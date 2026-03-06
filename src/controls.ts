import * as THREE from "three";
import { AirplaneStats } from "./airplanes";
import { AudioManager } from "./audio";
import { DevOverlay } from "./debug";
import { FlightRecorder, type FlightSnapshot } from "./flight-recorder";
import {
  applyDampingInto,
  updateInertiaInto,
  type AngularVelocities
} from "./physics/flight-model";
import {
  computeAxisInputSpringDamper,
  AIM_CONTROLLER_DEFAULTS
} from "./physics/aim-controller";
import { computeStabilizationForce } from "./physics/stabilization";
import { getKeys } from "./input/keyboard-input";
import { getMouseDeltas, type MouseDeltas } from "./input/mouse-input";
import type { CameraLike } from "./types";

/** Состояние перекрестия в NDC [-1..1] для виртуального джойстика (mouse-aim). */
export interface ReticleState {
  x_ndc: number;
  y_ndc: number;
}

/** Ошибки наведения в локальном базисе самолёта (радианы), с учётом deadzone. */
export interface AimErrors {
  yawErrorRad: number;
  pitchErrorRad: number;
}

/** Опции для отладки в update (например leadNdc из main loop). */
export interface UpdateDebugOptions {
  leadNdc?: { x: number; y: number };
}

/** Параметры перекрестия (виртуальный джойстик). */
export interface ReticleParams {
  /** Множитель пиксели → NDC (1 = стандартная чувствительность). */
  sensitivity?: number;
  /** Радиус ограничения в NDC (круг), например 0.6. */
  clampRadiusNdc?: number;
  /** Скорость возврата к центру за кадр (0 = выключено), для «WT feel» ~0.01. */
  returnToCenterSpeed?: number;
}

const DEFAULT_RETICLE_SENSITIVITY = 1;
const DEFAULT_CLAMP_RADIUS_NDC = 0.6;
const DEFAULT_RETURN_TO_CENTER_SPEED = 0.01;
/** Deadzone по углу ошибки наведения (радианы), ~1°. */
const AIM_ERROR_DEADZONE_RAD = (1 * Math.PI) / 180;

export function createControls(
  airplane: THREE.Object3D,
  stats: AirplaneStats,
  scene?: THREE.Scene,
  camera?: THREE.Camera,
  canvas?: HTMLCanvasElement,
  reticleParams?: ReticleParams
) {
  // Переиспользуемые объекты (без аллокаций в update)
  const forwardVector = new THREE.Vector3(0, 0, 1);
  const downVector = new THREE.Vector3(0, -1, 0);
  const raycaster = new THREE.Raycaster();
  const tempVector = new THREE.Vector3();
  const tempVector2 = new THREE.Vector2();
  const tempEuler = new THREE.Euler();
  const tempQuat = new THREE.Quaternion();
  /** Направление прицеливания в мировых координатах (луч от камеры через перекрестие). */
  const aimDir_world = new THREE.Vector3(0, 0, 1);
  /** Локальный базис самолёта (forward/right/up в мире) для расчёта ошибок наведения. */
  const planeForward = new THREE.Vector3(0, 0, 1);
  const planeRight = new THREE.Vector3(1, 0, 0);
  const planeUp = new THREE.Vector3(0, 1, 0);
  /** Текущие ошибки наведения (радианы), с deadzone. */
  let yawErrorRad = 0;
  let pitchErrorRad = 0;

  // ReticleState: перекрестие в NDC [-1..1], без аллокаций в update
  let reticleX_ndc = 0;
  let reticleY_ndc = 0;
  const reticleSensitivity = reticleParams?.sensitivity ?? DEFAULT_RETICLE_SENSITIVITY;
  const reticleClampRadius = reticleParams?.clampRadiusNdc ?? DEFAULT_CLAMP_RADIUS_NDC;
  const reticleReturnSpeed = reticleParams?.returnToCenterSpeed ?? DEFAULT_RETURN_TO_CENTER_SPEED;
  const mouseDeltasOut: MouseDeltas = { dx: 0, dy: 0 };

  // Схема управления: A — правое крыло вверх, D — левое крыло вверх, W/S — тангаж
  // Control keys: A — right wing up, D — left wing up, W/S — pitch up/down
  const PITCH_UP = ["w", "ц", "arrowup"];
  const PITCH_DOWN = ["s", "ы", "arrowdown"];
  const ROLL_RIGHT_WING_UP = ["a", "ф", "arrowleft"];   // A — правое крыло вверх
  const ROLL_LEFT_WING_UP = ["d", "в", "arrowright"];  // D — левое крыло вверх
  const YAW_LEFT = ["q", "й"];
  const YAW_RIGHT = ["e", "у"];

  function anyKeyPressed(keys: Set<string>, keyList: readonly string[]): boolean {
    for (let i = 0; i < keyList.length; i++) {
      if (keys.has(keyList[i])) return true;
    }
    return false;
  }

  // Скорости вращения самолёта / Angular velocities
  let pitchVelocity = 0;
  let rollVelocity = 0;
  let yawVelocity = 0;

  // Переиспользуемый out-объект для чистых функций physics (без аллокаций в update)
  const angularOut: AngularVelocities = {
    pitchVelocity: 0,
    rollVelocity: 0,
    yawVelocity: 0
  };

  // Последняя активность стабилизации по каждой оси
  const lastStabActivePitchRef = { current: performance.now() };
  const lastStabActiveRollRef = { current: performance.now() };

  /** Локальная вспомогательная функция стабилизации по одной оси (шаг A рефакторинга). */
  function applyStabilizationAxis(params: {
    axis: "pitch" | "roll";
    angle: number;
    angleAbs: number;
    input: number;
    speedFactor: number;
    stabLimit: number;
    forceLinear: number;
    forceConst: number;
    lastStabActiveRef: { current: number };
  }): number {
    const { axis, angle, angleAbs, input, speedFactor, stabLimit, forceLinear, forceConst, lastStabActiveRef } = params;
    const force = computeStabilizationForce(
      angle,
      angleAbs,
      input,
      stats,
      speedFactor,
      stabLimit,
      forceLinear,
      forceConst
    );
    if (force !== 0) {
      lastStabActiveRef.current = performance.now();
    }
    return force;
  }

  function update(_dt?: number, debugOptions?: UpdateDebugOptions) {
    // --- ReticleState: применяем дельты мыши → NDC, clamp, опционально возврат к центру ---
    getMouseDeltas(mouseDeltasOut);
    if (canvas) {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      const scaleX = (2 / w) * reticleSensitivity;
      const scaleY = (2 / h) * reticleSensitivity;
      reticleX_ndc += mouseDeltasOut.dx * scaleX;
      reticleY_ndc -= mouseDeltasOut.dy * scaleY; // Y в NDC: вверх положительно
      const rSq = reticleX_ndc * reticleX_ndc + reticleY_ndc * reticleY_ndc;
      const clampR2 = reticleClampRadius * reticleClampRadius;
      if (rSq > clampR2) {
        const r = Math.sqrt(rSq);
        reticleX_ndc *= reticleClampRadius / r;
        reticleY_ndc *= reticleClampRadius / r;
      }
      if (reticleReturnSpeed > 0) {
        reticleX_ndc *= 1 - reticleReturnSpeed;
        reticleY_ndc *= 1 - reticleReturnSpeed;
      }
    }

    // Ray от камеры через перекрестие → aimDir_world (для расчёта ошибок наведения)
    if (camera) {
      tempVector2.set(reticleX_ndc, reticleY_ndc);
      raycaster.setFromCamera(tempVector2, camera);
      aimDir_world.copy(raycaster.ray.direction).normalize();
    }

    // Ошибки yaw/pitch в локальном базисе самолёта (без матриц), с deadzone
    if (camera) {
      planeForward.set(0, 0, 1).applyQuaternion(airplane.quaternion);
      planeRight.set(1, 0, 0).applyQuaternion(airplane.quaternion);
      planeUp.set(0, 1, 0).applyQuaternion(airplane.quaternion);
      const lx = planeRight.dot(aimDir_world);
      const ly = planeUp.dot(aimDir_world);
      const lz = planeForward.dot(aimDir_world);
      const rawYawError = Math.atan2(lx, lz);
      const rawPitchError = -Math.atan2(ly, lz);
      const deadzone = AIM_ERROR_DEADZONE_RAD;
      yawErrorRad = Math.abs(rawYawError) < deadzone ? 0 : rawYawError;
      pitchErrorRad = Math.abs(rawPitchError) < deadzone ? 0 : rawPitchError;
    } else {
      yawErrorRad = 0;
      pitchErrorRad = 0;
    }

    const keys = getKeys();
    // Сырой ввод с клавиатуры (по осям pitch/roll/yaw)
    let rawPitchKey = 0;
    let rollInput = 0;
    let rawYawKey = 0;

    if (anyKeyPressed(keys, PITCH_UP)) rawPitchKey += 1;
    if (anyKeyPressed(keys, PITCH_DOWN)) rawPitchKey -= 1;
    if (anyKeyPressed(keys, ROLL_RIGHT_WING_UP)) rollInput += 1;   // A → правое крыло вверх
    if (anyKeyPressed(keys, ROLL_LEFT_WING_UP)) rollInput -= 1;     // D → левое крыло вверх
    if (anyKeyPressed(keys, YAW_RIGHT)) rawYawKey -= 1;             // E → нос вправо
    if (anyKeyPressed(keys, YAW_LEFT)) rawYawKey += 1;              // Q → нос влево

    // 4.3 Микширование с клавиатурой: если игрок жмёт по оси — mouse-aim по этой оси выключен; иначе выход spring-damper
    const kpPitch = AIM_CONTROLLER_DEFAULTS.kpPitch;
    const kdPitch = AIM_CONTROLLER_DEFAULTS.kdPitch;
    const kpYaw = AIM_CONTROLLER_DEFAULTS.kpYaw;
    const kdYaw = AIM_CONTROLLER_DEFAULTS.kdYaw;
    const aimDeadzone = AIM_CONTROLLER_DEFAULTS.deadzoneRad;

    let pitchInput: number;
    let yawInput: number;
    if (rawPitchKey !== 0) {
      pitchInput = rawPitchKey;
    } else if (camera) {
      // Тангаж: pitchError = -atan2(ly,lz) → цель выше носа = отриц. ошибка; нос вверх = +1
      const pitchFromAim = computeAxisInputSpringDamper(
        pitchErrorRad,
        pitchVelocity,
        kpPitch,
        kdPitch,
        aimDeadzone
      );
      pitchInput = -pitchFromAim;
    } else {
      pitchInput = 0;
    }

    if (rawYawKey !== 0) {
      yawInput = rawYawKey;
    } else if (camera) {
      yawInput = computeAxisInputSpringDamper(
        yawErrorRad,
        yawVelocity,
        kpYaw,
        kdYaw,
        aimDeadzone
      );
    } else {
      yawInput = 0;
    }

    // Инерция вращения / Angular inertia (physics)
    updateInertiaInto(
      angularOut,
      pitchInput,
      rollInput,
      yawInput,
      pitchVelocity,
      rollVelocity,
      yawVelocity,
      stats
    );
    pitchVelocity = angularOut.pitchVelocity;
    rollVelocity = angularOut.rollVelocity;
    yawVelocity = angularOut.yawVelocity;

    // Текущие углы самолёта / Current airplane angles
    const pitchAngle = airplane.rotation.x;
    const yawAngle = airplane.rotation.y;
    const rollAngle = airplane.rotation.z;

    const pitchAbs = Math.abs(pitchAngle);
    const rollAbs = Math.abs(rollAngle);

    const speedFactor = stats.speed * 2.0;
    const STAB_LIMIT = Math.PI * 0.25; // 45°

    // RPM двигателя = скорость самолёта * коэффициент
    AudioManager.setEngineRPM(1 + stats.speed * 3);
    AudioManager.setWindIntensity(stats.speed * 0.8);

    // === Автостабилизация / Autostabilization (отключается только при ручном вводе с клавиш) ===
    const pitchStabForce = applyStabilizationAxis({
      axis: "pitch",
      angle: pitchAngle,
      angleAbs: pitchAbs,
      input: rawPitchKey,
      speedFactor,
      stabLimit: STAB_LIMIT,
      forceLinear: 1.2,
      forceConst: 0.1,
      lastStabActiveRef: lastStabActivePitchRef
    });
    pitchVelocity -= pitchStabForce;

    const rollStabForce = applyStabilizationAxis({
      axis: "roll",
      angle: rollAngle,
      angleAbs: rollAbs,
      input: rollInput,
      speedFactor,
      stabLimit: STAB_LIMIT,
      forceLinear: 1.5,
      forceConst: 0.2,
      lastStabActiveRef: lastStabActiveRollRef
    });
    // Плюс: т.к. крен применяется как rotateZ(-rollVelocity), стабилизация должна увеличивать rollVelocity при положительном угле
    rollVelocity += rollStabForce;

    // Ограничение скорости вращения / Clamp angular velocities
    pitchVelocity = THREE.MathUtils.clamp(
      pitchVelocity,
      -(stats.maxPitchRate ?? 0.05),
      stats.maxPitchRate ?? 0.05
    );
    rollVelocity = THREE.MathUtils.clamp(
      rollVelocity,
      -(stats.maxRollRate ?? 0.06),
      stats.maxRollRate ?? 0.06
    );
    yawVelocity = THREE.MathUtils.clamp(
      yawVelocity,
      -(stats.maxYawRate ?? 0.05),
      stats.maxYawRate ?? 0.05
    );

    // Затухание / Damping (physics)
    applyDampingInto(angularOut, pitchVelocity, rollVelocity, yawVelocity, stats);
    pitchVelocity = angularOut.pitchVelocity;
    rollVelocity = angularOut.rollVelocity;
    yawVelocity = angularOut.yawVelocity;

    // Применяем вращение / Apply rotation (углы не ограничиваем — полная свобода крена и тангажа)
    airplane.rotateX(pitchVelocity);
    airplane.rotateY(yawVelocity);
    // Инвертировано: положительный rollInput (A) → правое крыло вверх (против часовой сзади)
    airplane.rotateZ(-rollVelocity);

    // === Движение вперёд / Forward movement ===
    tempVector.copy(forwardVector).applyQuaternion(airplane.quaternion).multiplyScalar(stats.speed);
    airplane.position.add(tempVector);

    // ========================================================================
    // ВЫСОТА НАД ЗЕМЛЁЙ (raycast вниз) / ALTITUDE ABOVE GROUND
    // ========================================================================
    let altitude: number | null = null;

    if (scene) {
      raycaster.set(airplane.position, downVector);
      const hits = raycaster.intersectObjects(scene.children, true);
      if (hits.length > 0) altitude = hits[0].distance;
    }

    // ========================================================================
    // ПОЛОЖЕНИЕ ОТНОСИТЕЛЬНО КАМЕРЫ / RELATIVE TO CAMERA
    // ========================================================================
    let distanceToCamera: number | null = null;
    let relPitch: number | null = null;
    let relYaw: number | null = null;
    let relRoll: number | null = null;

    if (camera) {
      const cam = camera as unknown as CameraLike;
      tempVector.copy(airplane.position).sub(cam.position);
      distanceToCamera = tempVector.length();

      tempQuat.copy(cam.quaternion).invert().multiply(airplane.quaternion);
      tempEuler.setFromQuaternion(tempQuat);

      relPitch = tempEuler.x;
      relYaw = tempEuler.y;
      relRoll = tempEuler.z;
    }

    // ========================================================================
    // Flight Recorder: снимок только при включённой записи (без аллокаций в hot path)
    // ========================================================================
    if (FlightRecorder.isRecording()) {
      const t = performance.now();
      const snapshot: FlightSnapshot = {
        t,
        airplane: {
          pos: {
            x: airplane.position.x,
            y: airplane.position.y,
            z: airplane.position.z
          },
          pitch: pitchAngle,
          yaw: yawAngle,
          roll: rollAngle,
          pitchVelocity,
          rollVelocity,
          yawVelocity
        },
        controls: {
          pitchInput,
          rollInput,
          yawInput
        },
        reticle: { x_ndc: reticleX_ndc, y_ndc: reticleY_ndc },
        aim: { yawErrorRad, pitchErrorRad },
        camera:
          distanceToCamera !== null &&
          relPitch !== null &&
          relYaw !== null &&
          relRoll !== null
            ? {
                distanceToCamera,
                relPitch,
                relYaw,
                relRoll
              }
            : null,
        altitude: altitude ?? null
      };
      if (debugOptions?.leadNdc !== undefined) {
        snapshot.leadNdc = debugOptions.leadNdc;
      }
      FlightRecorder.tick(snapshot);
    }

    // ========================================================================
    // HUD — отображение ключевых параметров / HUD display
    // ========================================================================
    const hud: Record<string, string> = {
      pitchDeg: (pitchAngle * 180 / Math.PI).toFixed(1),
      yawDeg: (yawAngle * 180 / Math.PI).toFixed(1),
      rollDeg: (rollAngle * 180 / Math.PI).toFixed(1),
      pitchVel: pitchVelocity.toFixed(4),
      yawVel: yawVelocity.toFixed(4),
      rollVel: rollVelocity.toFixed(4),
      yawErrorDeg: (yawErrorRad * 180 / Math.PI).toFixed(2),
      pitchErrorDeg: (pitchErrorRad * 180 / Math.PI).toFixed(2),
      reticleNdc: `${reticleX_ndc.toFixed(3)}, ${reticleY_ndc.toFixed(3)}`,
      altitude: altitude !== null ? altitude.toFixed(2) : "N/A",
      distCam: distanceToCamera !== null ? distanceToCamera.toFixed(2) : "N/A",
      relPitch: relPitch !== null ? (relPitch * 180 / Math.PI).toFixed(1) : "N/A",
      relYaw: relYaw !== null ? (relYaw * 180 / Math.PI).toFixed(1) : "N/A",
      relRoll: relRoll !== null ? (relRoll * 180 / Math.PI).toFixed(1) : "N/A"
    };
    if (debugOptions?.leadNdc !== undefined) {
      hud.leadNdc = `${debugOptions.leadNdc.x.toFixed(3)}, ${debugOptions.leadNdc.y.toFixed(3)}`;
    }
    DevOverlay.updateHUD(hud);
  }

  function getReticle(out: ReticleState): void {
    out.x_ndc = reticleX_ndc;
    out.y_ndc = reticleY_ndc;
  }

  /** Копирует текущее направление прицеливания (луч от камеры через перекрестие) в out. */
  function getAimDir(out: THREE.Vector3): void {
    out.copy(aimDir_world);
  }

  /** Записывает текущие ошибки наведения (yaw/pitch в радианах, с deadzone) в out. */
  function getAimErrors(out: AimErrors): void {
    out.yawErrorRad = yawErrorRad;
    out.pitchErrorRad = pitchErrorRad;
  }

  return { update, getReticle, getAimDir, getAimErrors };
}

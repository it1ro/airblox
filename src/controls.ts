import * as THREE from "three";
import { AirplaneStats } from "./airplanes";
import { AudioManager } from "./audio";
import { Debug } from "./debug";
import { updateInertia, applyDamping } from "./physics/flight-model";
import { computeStabilizationForce } from "./physics/stabilization";
import { getKeys, subscribe as subscribeKeyboard } from "./input/keyboard-input";
import type { CameraLike } from "./types";

// Логируются / Logged:
//  - ввод игрока (pitch/roll) 
//      → player input (pitch/roll)
//  - углы самолёта (pitchAngle, rollAngle) 
//      → airplane orientation angles (pitchAngle, rollAngle)
//  - скорости вращения (pitchVelocity, rollVelocity) 
//      → angular velocities (pitchVelocity, rollVelocity)
//  - высота над землёй (raycast вниз) 
//      → altitude above ground (raycast downward)
//  - положение самолёта относительно камеры 
//      → airplane position relative to camera
//  - относительные углы самолёта к камере 
//      → relative orientation to camera (pitch/yaw/roll difference)
//  - состояние стабилизации 
//      → stabilization state (enabled/disabled, force applied)
//
//  - периодический STATE-снимок (раз в 200 мс)
//      → periodic STATE snapshot (every 200 ms)
//      Это автоматическая запись полного состояния самолёта в лог через равные интервалы времени.
//      В отличие от событий (нажатие клавиши, включение стабилизации и т.п.), этот снимок
//      фиксирует текущее состояние самолёта "как есть": углы, скорости вращения, позицию,
//      высоту над землёй, расстояние до камеры и относительные углы.
//      Такой снимок создаёт "чёрный ящик" полёта — помогает анализировать поведение между событиями,
//      ловить редкие баги, которые проявляются не в момент нажатия кнопки, а спустя время.
//      Интервал 200 мс выбран как компромисс: достаточно часто, чтобы видеть динамику,
//      но достаточно редко, чтобы не засорять лог лишними данными.
// ============================================================================

export function createControls(
  airplane: THREE.Object3D,
  stats: AirplaneStats,
  scene?: THREE.Scene,
  camera?: THREE.Camera
) {
  // Переиспользуемые объекты (без аллокаций в update)
  const forwardVector = new THREE.Vector3(0, 0, 1);
  const downVector = new THREE.Vector3(0, -1, 0);
  const raycaster = new THREE.Raycaster();
  const tempVector = new THREE.Vector3();
  const tempEuler = new THREE.Euler();
  const tempQuat = new THREE.Quaternion();

  // Схема управления: A — правое крыло вверх, D — левое крыло вверх, W/S — тангаж
  // Control keys: A — right wing up, D — left wing up, W/S — pitch up/down
  const PITCH_UP = ["w", "ц", "arrowup"];
  const PITCH_DOWN = ["s", "ы", "arrowdown"];
  const ROLL_RIGHT_WING_UP = ["a", "ф", "arrowleft"];   // A — правое крыло вверх
  const ROLL_LEFT_WING_UP = ["d", "в", "arrowright"];  // D — левое крыло вверх

  // Скорости вращения самолёта / Angular velocities
  let pitchVelocity = 0;
  let rollVelocity = 0;

  // Последняя активность стабилизации по каждой оси
  const lastStabActivePitchRef = { current: performance.now() };
  const lastStabActiveRollRef = { current: performance.now() };

  Debug.init();

  subscribeKeyboard((key, down) => {
    if (down) Debug.log("input", "KEY_DOWN", { key });
    else Debug.log("input", "KEY_UP", { key });
  });

  let lastStateLog = 0;

  function logStabState(
    axis: "pitch" | "roll",
    angle: number,
    appliedForce: number,
    reason: string
  ) {
    Debug.log("stabilization", "STAB_EVENT", {
      axis,
      angle,
      appliedForce,
      reason
    });
  }

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
      logStabState(axis, angle, force, "active");
      lastStabActiveRef.current = performance.now();
    } else {
      const reason =
        input !== 0 ? "disabled_player_input" : "disabled_angle_limit";
      logStabState(axis, angle, 0, reason);
      const idleFor = performance.now() - lastStabActiveRef.current;
      if (idleFor > 1000) {
        Debug.log("stabilization", "STAB_IDLE", {
          axis,
          angle,
          idleFor,
          reason:
            reason === "disabled_player_input"
              ? "no_stabilization_for_1s_due_to_input"
              : "no_stabilization_for_1s_due_to_angle"
        });
      }
    }
    return force;
  }

  function update() {
    const keys = getKeys();
    let pitchInput = 0;
    let rollInput = 0;

    // Ввод игрока / Player input
    if (PITCH_UP.some(k => keys.has(k))) pitchInput += 1;
    if (PITCH_DOWN.some(k => keys.has(k))) pitchInput -= 1;
    if (ROLL_RIGHT_WING_UP.some(k => keys.has(k))) rollInput += 1;   // A → правое крыло вверх
    if (ROLL_LEFT_WING_UP.some(k => keys.has(k))) rollInput -= 1;     // D → левое крыло вверх

    // Логируем ввод / Log input
    if (pitchInput !== 0) Debug.log("input", "PITCH_INPUT", { pitchInput });
    if (rollInput !== 0) Debug.log("input", "ROLL_INPUT", { rollInput });

    // Инерция вращения / Angular inertia (physics)
    const afterInertia = updateInertia(
      pitchInput,
      rollInput,
      pitchVelocity,
      rollVelocity,
      stats
    );
    pitchVelocity = afterInertia.pitchVelocity;
    rollVelocity = afterInertia.rollVelocity;

    // Текущие углы самолёта / Current airplane angles
    const pitchAngle = airplane.rotation.x;
    const rollAngle = airplane.rotation.z;

    const pitchAbs = Math.abs(pitchAngle);
    const rollAbs = Math.abs(rollAngle);

    const speedFactor = stats.speed * 2.0;
    const STAB_LIMIT = Math.PI * 0.25; // 45°

    // RPM двигателя = скорость самолёта * коэффициент
    AudioManager.setEngineRPM(1 + stats.speed * 3);
    AudioManager.setWindIntensity(stats.speed * 0.8);

    // === Автостабилизация / Autostabilization (локальная applyStabilizationAxis → physics) ===
    const pitchStabForce = applyStabilizationAxis({
      axis: "pitch",
      angle: pitchAngle,
      angleAbs: pitchAbs,
      input: pitchInput,
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

    // === Аномалии стабилизации / Stabilization anomalies ===
    if (Math.abs(pitchVelocity) > 0.04) {
      Debug.log("anomalies", "STAB_ANOMALY", {
        axis: "pitch",
        pitchVelocity,
        reason: "high_rotation_speed"
      });
    }

    if (Math.abs(rollVelocity) > 0.05) {
      Debug.log("anomalies", "STAB_ANOMALY", {
        axis: "roll",
        rollVelocity,
        reason: "high_rotation_speed"
      });
    }

    if (pitchAbs > Math.PI * 0.5) {
      Debug.log("anomalies", "STAB_ANOMALY", {
        axis: "pitch",
        angle: pitchAngle,
        reason: "inverted_flight"
      });
    }

    if (rollAbs > Math.PI * 0.5) {
      Debug.log("anomalies", "STAB_ANOMALY", {
        axis: "roll",
        angle: rollAngle,
        reason: "inverted_flight"
      });
    }

    // Ограничение скорости вращения / Clamp angular velocities
    pitchVelocity = THREE.MathUtils.clamp(pitchVelocity, -0.05, 0.05);
    rollVelocity = THREE.MathUtils.clamp(rollVelocity, -0.06, 0.06);

    // Затухание / Damping (physics)
    const afterDamping = applyDamping(pitchVelocity, rollVelocity, stats);
    pitchVelocity = afterDamping.pitchVelocity;
    rollVelocity = afterDamping.rollVelocity;

    // Лог демпфирования / Damping log
    Debug.log("damping", "DAMPING", {
      pitchVelocity,
      rollVelocity,
      pitchDamping: stats.pitchDamping,
      rollDamping: stats.rollDamping
    });

    // Логирование перехода через 0° (zero-cross)
    if (Math.sign(pitchAngle) !== Math.sign(pitchAngle + pitchVelocity)) {
      Debug.log("zeroCross", "STAB_ZERO_CROSS", {
        axis: "pitch",
        from: pitchAngle,
        to: pitchAngle + pitchVelocity
      });
    }

    if (Math.sign(rollAngle) !== Math.sign(rollAngle + rollVelocity)) {
      Debug.log("zeroCross", "STAB_ZERO_CROSS", {
        axis: "roll",
        from: rollAngle,
        to: rollAngle + rollVelocity
      });
    }

    // Применяем вращение / Apply rotation (углы не ограничиваем — полная свобода крена и тангажа)
    airplane.rotateX(pitchVelocity);
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
    // ПЕРИОДИЧЕСКИЙ STATE-лог (раз в 200 мс) / PERIODIC STATE SNAPSHOT
    // ========================================================================
    const now = performance.now();
    if (now - lastStateLog > 200) {
      Debug.log("stateSnapshot", "STATE", {
        pitchAngle,
        rollAngle,
        pitchVelocity,
        rollVelocity,
        altitude,
        distanceToCamera,
        relPitch,
        relYaw,
        relRoll,
        pos: {
          x: airplane.position.x,
          y: airplane.position.y,
          z: airplane.position.z
        }
      });
      lastStateLog = now;
    }

    // ========================================================================
    // HUD — отображение ключевых параметров / HUD display
    // ========================================================================
    Debug.updateHUD({
      pitchDeg: (pitchAngle * 180 / Math.PI).toFixed(1),
      rollDeg: (rollAngle * 180 / Math.PI).toFixed(1),
      pitchVel: pitchVelocity.toFixed(4),
      rollVel: rollVelocity.toFixed(4),
      altitude: altitude !== null ? altitude.toFixed(2) : "N/A",
      distCam: distanceToCamera !== null ? distanceToCamera.toFixed(2) : "N/A",
      relPitch: relPitch !== null ? (relPitch * 180 / Math.PI).toFixed(1) : "N/A",
      relYaw: relYaw !== null ? (relYaw * 180 / Math.PI).toFixed(1) : "N/A",
      relRoll: relRoll !== null ? (relRoll * 180 / Math.PI).toFixed(1) : "N/A"
    });
  }

  return { update };
}

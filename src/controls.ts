import * as THREE from "three";
import { AirplaneStats } from "./airplanes";
import { AudioManager } from "./audio";

import { Debug } from "./debug";

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

/** Параметры одной оси стабилизации (pitch или roll). */
interface StabilizationAxisParams {
  axis: "pitch" | "roll";
  angle: number;
  angleAbs: number;
  input: number;
  stats: AirplaneStats;
  speedFactor: number;
  stabLimit: number;
  forceLinear: number;
  forceConst: number;
  lastStabActiveRef: { current: number };
  logStabState: (
    axis: "pitch" | "roll",
    angle: number,
    appliedForce: number,
    reason: string
  ) => void;
}

/**
 * Вычисляет и применяет стабилизацию по одной оси (pitch или roll).
 * Возвращает величину коррекции скорости вращения (вычитается из velocity).
 * Логирование и обновление lastStabActive выполняет внутри.
 */
function applyStabilizationAxis(params: StabilizationAxisParams): number {
  const {
    axis,
    angle,
    angleAbs,
    input,
    stats,
    speedFactor,
    stabLimit,
    forceLinear,
    forceConst,
    lastStabActiveRef,
    logStabState
  } = params;

  if (input === 0) {
    if (angleAbs < stabLimit) {
      const force = stats.autoLevel * (angleAbs * forceLinear + forceConst);
      const applied = angle * force * speedFactor;
      logStabState(axis, angle, applied, "active");
      lastStabActiveRef.current = performance.now();
      return applied;
    } else {
      logStabState(axis, angle, 0, "disabled_angle_limit");
      const idleFor = performance.now() - lastStabActiveRef.current;
      if (idleFor > 1000) {
        Debug.log("stabilization", "STAB_IDLE", {
          axis,
          angle,
          idleFor,
          reason: "no_stabilization_for_1s_due_to_angle"
        });
      }
      return 0;
    }
  } else {
    logStabState(axis, angle, 0, "disabled_player_input");
    const idleFor = performance.now() - lastStabActiveRef.current;
    if (idleFor > 1000) {
      Debug.log("stabilization", "STAB_IDLE", {
        axis,
        angle,
        idleFor,
        reason: "no_stabilization_for_1s_due_to_input"
      });
    }
    return 0;
  }
}

export function createControls(
  airplane: THREE.Object3D,
  stats: AirplaneStats,
  scene?: THREE.Scene,
  camera?: THREE.Camera
) {
  const keys = new Set<string>();

  // Переиспользуемые объекты (без аллокаций в update)
  const forwardVector = new THREE.Vector3(0, 0, 1);
  const downVector = new THREE.Vector3(0, -1, 0);
  const raycaster = new THREE.Raycaster();
  const tempVector = new THREE.Vector3();
  const tempEuler = new THREE.Euler();
  const tempQuat = new THREE.Quaternion();

  // Клавиши управления / Control keys
  const PITCH_UP = ["w", "ц", "arrowup"];
  const PITCH_DOWN = ["s", "ы", "arrowdown"];
  const ROLL_LEFT = ["d", "в", "arrowright"];
  const ROLL_RIGHT = ["a", "ф", "arrowleft"];

  // Скорости вращения самолёта / Angular velocities
  let pitchVelocity = 0;
  let rollVelocity = 0;

  // Последняя активность стабилизации по каждой оси (refs для applyStabilizationAxis)
  // Last time stabilization was actively applied on each axis (refs for applyStabilizationAxis)
  const lastStabActivePitchRef = { current: performance.now() };
  const lastStabActiveRollRef = { current: performance.now() };

  Debug.init();

  // Логирование нажатий клавиш / Key input logging
  window.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    keys.add(key);
    Debug.log("input", "KEY_DOWN", { key });
  });

  window.addEventListener("keyup", e => {
    const key = e.key.toLowerCase();
    keys.delete(key);
    Debug.log("input", "KEY_UP", { key });
  });

  let lastStateLog = 0;

  function update() {
    let pitchInput = 0;
    let rollInput = 0;

    // Ввод игрока / Player input
    if (PITCH_UP.some(k => keys.has(k))) pitchInput += 1;
    if (PITCH_DOWN.some(k => keys.has(k))) pitchInput -= 1;
    if (ROLL_LEFT.some(k => keys.has(k))) rollInput += 1;
    if (ROLL_RIGHT.some(k => keys.has(k))) rollInput -= 1;

    // Логируем ввод / Log input
    if (pitchInput !== 0) Debug.log("input", "PITCH_INPUT", { pitchInput });
    if (rollInput !== 0) Debug.log("input", "ROLL_INPUT", { rollInput });

    // Инерция вращения / Angular inertia
    pitchVelocity += pitchInput * stats.pitchAccel;
    rollVelocity += rollInput * stats.rollAccel;

    // Текущие углы самолёта / Current airplane angles
    const pitchAngle = airplane.rotation.x;
    const rollAngle = airplane.rotation.z;

    const pitchAbs = Math.abs(pitchAngle);
    const rollAbs = Math.abs(rollAngle);

    const speedFactor = stats.speed * 2.0;
    const STAB_LIMIT = Math.PI * 0.25; // 45°



    // RPM двигателя = скорость самолёта * коэффициент
    AudioManager.setEngineRPM(1 + stats.speed * 3);

    // Шум ветра = скорость самолёта
    AudioManager.setWindIntensity(stats.speed * 0.8);


    // Вспомогательная функция логирования активности стабилизатора
    // Helper for detailed stabilization logging
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

    // === Автостабилизация / Autostabilization ===
    // Работает только при малых углах, чтобы избежать "отпружинивания"
    // Works only at small angles to avoid "spring back"

    pitchVelocity -= applyStabilizationAxis({
      axis: "pitch",
      angle: pitchAngle,
      angleAbs: pitchAbs,
      input: pitchInput,
      stats,
      speedFactor,
      stabLimit: STAB_LIMIT,
      forceLinear: 1.2,
      forceConst: 0.1,
      lastStabActiveRef: lastStabActivePitchRef,
      logStabState
    });

    rollVelocity -= applyStabilizationAxis({
      axis: "roll",
      angle: rollAngle,
      angleAbs: rollAbs,
      input: rollInput,
      stats,
      speedFactor,
      stabLimit: STAB_LIMIT,
      forceLinear: 1.5,
      forceConst: 0.2,
      lastStabActiveRef: lastStabActiveRollRef,
      logStabState
    });

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

    // Затухание / Damping
    pitchVelocity *= stats.pitchDamping;
    rollVelocity *= stats.rollDamping;

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

    // Применяем вращение / Apply rotation
    airplane.rotateX(pitchVelocity);
    airplane.rotateZ(rollVelocity);

    // === Движение вперёд / Forward movement ===
    tempVector.copy(forwardVector).applyQuaternion(airplane.quaternion).multiplyScalar(stats.speed);
    airplane.position.add(tempVector);

    // === ВРАЩЕНИЕ ПРОПЕЛЛЕРА ===
    if (airplane.userData.propeller) {
      // скорость вращения зависит от скорости самолёта
      const spin = stats.speed * 20; // можно увеличить/уменьшить
      airplane.userData.propeller.rotation.z += spin;
    }


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
      const cam = camera as THREE.PerspectiveCamera;
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

import * as THREE from "three";
import { AirplaneStats } from "./airplanes";

export function createControls(airplane: THREE.Object3D, stats: AirplaneStats) {
  const keys = new Set<string>();

  // === Управление ===
  const PITCH_UP = ["w", "ц", "arrowup"];        // пикирование
  const PITCH_DOWN = ["s", "ы", "arrowdown"];    // кабрирование

  const ROLL_LEFT = ["d", "в", "arrowright"];    // крен влево
  const ROLL_RIGHT = ["a", "ф", "arrowleft"];    // крен вправо

  // === Физические состояния ===
  let pitchVelocity = 0;
  let rollVelocity = 0;

  // === Слушатели клавиш ===
  window.addEventListener("keydown", e => keys.add(e.key.toLowerCase()));
  window.addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));

  function update() {
    let pitchInput = 0;
    let rollInput = 0;

    // === Тангаж ===
    if (PITCH_UP.some(k => keys.has(k))) pitchInput += 1;
    if (PITCH_DOWN.some(k => keys.has(k))) pitchInput -= 1;

    // === Крен ===
    if (ROLL_LEFT.some(k => keys.has(k))) rollInput += 1;
    if (ROLL_RIGHT.some(k => keys.has(k))) rollInput -= 1;

    // === Инерция ===
    pitchVelocity += pitchInput * stats.pitchAccel;
    rollVelocity += rollInput * stats.rollAccel;

    // === Автостабилизация ===
    if (pitchInput === 0) pitchVelocity -= airplane.rotation.x * stats.autoLevel;
    if (rollInput === 0) rollVelocity -= airplane.rotation.z * stats.autoLevel;

    // === Затухание ===
    pitchVelocity *= stats.pitchDamping;
    rollVelocity *= stats.rollDamping;

    // === Ограничение углов ===
    airplane.rotation.x = THREE.MathUtils.clamp(
      airplane.rotation.x + pitchVelocity,
      -stats.maxPitch,
      stats.maxPitch
    );

    airplane.rotation.z = THREE.MathUtils.clamp(
      airplane.rotation.z + rollVelocity,
      -stats.maxRoll,
      stats.maxRoll
    );

    // === Движение вперёд ===
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(airplane.quaternion);
    airplane.position.add(forward.multiplyScalar(stats.speed));
  }

  return { update };
}

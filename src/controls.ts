import * as THREE from "three";
import { AirplaneStats } from "./airplanes";

export function createControls(airplane: THREE.Object3D, stats: AirplaneStats) {
  const keys = new Set<string>();

  // === Управление ===
  const PITCH_UP = ["w", "ц", "arrowup"];        // пикирование (нос вниз)
  const PITCH_DOWN = ["s", "ы", "arrowdown"];    // кабрирование (нос вверх)

  const ROLL_LEFT = ["d", "в", "arrowright"];    // крен влево
  const ROLL_RIGHT = ["a", "ф", "arrowleft"];    // крен вправо

  // === Состояние ===
  let pitchVelocity = 0;
  let rollVelocity = 0;

  // === Слушатели клавиш ===
  window.addEventListener("keydown", e => keys.add(e.key.toLowerCase()));
  window.addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));

  function update() {
    let pitchInput = 0;
    let rollInput = 0;

    // === Ввод игрока ===
    if (PITCH_UP.some(k => keys.has(k))) pitchInput += 1;
    if (PITCH_DOWN.some(k => keys.has(k))) pitchInput -= 1;

    if (ROLL_LEFT.some(k => keys.has(k))) rollInput += 1;
    if (ROLL_RIGHT.some(k => keys.has(k))) rollInput -= 1;

    // === Инерция вращения ===
    pitchVelocity += pitchInput * stats.pitchAccel;
    rollVelocity += rollInput * stats.rollAccel;

    // === Автостабилизация (нелинейная, зависящая от скорости) ===
    const speedFactor = stats.speed * 2.0;

    const pitchAngle = airplane.rotation.x;
    const rollAngle = airplane.rotation.z;

    if (pitchInput === 0) {
      const pitchAuto = stats.autoLevel * (Math.abs(pitchAngle) * 1.2 + 0.1);
      pitchVelocity -= pitchAngle * pitchAuto * speedFactor;
    }

    if (rollInput === 0) {
      const rollAuto = stats.autoLevel * (Math.abs(rollAngle) * 1.5 + 0.2);
      rollVelocity -= rollAngle * rollAuto * speedFactor;
    }

    // === Ограничение скорости вращения (НЕ угла) ===
    pitchVelocity = THREE.MathUtils.clamp(pitchVelocity, -0.05, 0.05);
    rollVelocity = THREE.MathUtils.clamp(rollVelocity, -0.06, 0.06);

    // === Затухание ===
    pitchVelocity *= stats.pitchDamping;
    rollVelocity *= stats.rollDamping;

    // === Применяем вращение (без ограничения угла — можно делать петли) ===
    airplane.rotation.x += pitchVelocity;
    airplane.rotation.z += rollVelocity;

    // === Движение вперёд ===
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(airplane.quaternion);
    airplane.position.add(forward.multiplyScalar(stats.speed));
  }

  return { update };
}

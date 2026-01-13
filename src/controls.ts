import * as THREE from "three";
import { AirplaneStats } from "./airplanes";

export function createControls(airplane: THREE.Object3D, stats: AirplaneStats) {
  const keys = new Set<string>();

  // === Управление ===
  const PITCH_UP = ["w", "ц", "arrowup"];        // пикирование (нос вниз)
  const PITCH_DOWN = ["s", "ы", "arrowdown"];    // кабрирование (нос вверх)

  const ROLL_LEFT = ["d", "в", "arrowright"];    // крен влево
  const ROLL_RIGHT = ["a", "ф", "arrowleft"];    // крен вправо

  // === Состояние физики ===
  let pitchVelocity = 0;   // скорость вращения по тангажу
  let rollVelocity = 0;    // скорость вращения по крену

  // === Слушатели клавиш ===
  window.addEventListener("keydown", e => {
    keys.add(e.key.toLowerCase());
  });

  window.addEventListener("keyup", e => {
    keys.delete(e.key.toLowerCase());
  });

  function update() {
    let pitchInput = 0;
    let rollInput = 0;

    // === Тангаж (ввод игрока) ===
    if (PITCH_UP.some(k => keys.has(k))) pitchInput += 1;
    if (PITCH_DOWN.some(k => keys.has(k))) pitchInput -= 1;

    // === Крен (ввод игрока) ===
    if (ROLL_LEFT.some(k => keys.has(k))) rollInput += 1;
    if (ROLL_RIGHT.some(k => keys.has(k))) rollInput -= 1;

    // === Инерция — разгон вращения ===
    pitchVelocity += pitchInput * stats.pitchAccel;
    rollVelocity += rollInput * stats.rollAccel;

    // === Автостабилизация (нелинейная, завязана на угол и скорость) ===
    const speedFactor = stats.speed * 2.0; // чем быстрее самолёт, тем стабильнее он ведёт себя

    const pitchAngle = airplane.rotation.x;
    const rollAngle = airplane.rotation.z;

    // слабая стабилизация при малых углах, сильнее при больших
    if (pitchInput === 0) {
      const pitchAutoForce = stats.autoLevel * (Math.abs(pitchAngle) * 1.2 + 0.1);
      pitchVelocity -= pitchAngle * pitchAutoForce * speedFactor;
    }

    if (rollInput === 0) {
      const rollAutoForce = stats.autoLevel * (Math.abs(rollAngle) * 1.5 + 0.2);
      rollVelocity -= rollAngle * rollAutoForce * speedFactor;
    }

    // === Затухание (damping) — мягкое, не мультяшное ===
    pitchVelocity *= stats.pitchDamping;  // ~0.94–0.97 в пресетах
    rollVelocity *= stats.rollDamping;    // ~0.92–0.96 в пресетах

    // === Применяем вращение с ограничениями углов ===
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

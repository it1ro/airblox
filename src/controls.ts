import * as THREE from "three";

export function createControls(airplane: THREE.Object3D) {
  const keys = new Set<string>();

  // === Управление ===
  // Тангаж
  const PITCH_UP = ["w", "ц", "arrowup"];      // пикирование
  const PITCH_DOWN = ["s", "ы", "arrowdown"];      // кабрирование

  // Крен (ПЕРЕВЕРНУТО)
  const ROLL_LEFT = ["d", "в", "arrowright"];    // крен влево
  const ROLL_RIGHT = ["a", "ф", "arrowleft"];    // крен вправо

  // === Слушатели клавиш ===
  window.addEventListener("keydown", e => keys.add(e.key.toLowerCase()));
  window.addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));

  window.addEventListener("keydown", e => { console.log("KEY:", e.key.toLowerCase()); keys.add(e.key.toLowerCase()); });
  function update() {
    let pitch = 0;
    let roll = 0;

    // === Тангаж ===
    if (PITCH_UP.some(k => keys.has(k))) pitch += 1;
    if (PITCH_DOWN.some(k => keys.has(k))) pitch -= 1;

    // === Крен ===
    if (ROLL_LEFT.some(k => keys.has(k))) roll += 1;
    if (ROLL_RIGHT.some(k => keys.has(k))) roll -= 1;

    // === Применяем вращение ===
    airplane.rotation.x += pitch * 0.02; // тангаж
    airplane.rotation.z += roll * 0.03;  // крен

    // === Движение вперёд ===
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(airplane.quaternion);
    airplane.position.add(forward.multiplyScalar(0.3));
  }

  return { update };
}

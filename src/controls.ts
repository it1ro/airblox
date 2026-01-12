import * as THREE from "three";

export function createControls(airplane: THREE.Group) {
  const keys: Record<string, boolean> = {};

  window.addEventListener("keydown", e => (keys[e.key] = true));
  window.addEventListener("keyup", e => (keys[e.key] = false));

  const velocity = new THREE.Vector3(0, 0, 0.2);

  function update() {
    // Повороты
    if (keys["a"]) airplane.rotation.z += 0.02;
    if (keys["d"]) airplane.rotation.z -= 0.02;

    if (keys["w"]) airplane.rotation.x -= 0.02;
    if (keys["s"]) airplane.rotation.x += 0.02;

    // Движение вперёд
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(airplane.quaternion);
    airplane.position.add(forward.multiplyScalar(0.2));
  }

  return { update };
}

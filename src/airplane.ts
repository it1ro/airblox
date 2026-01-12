
import * as THREE from "three";

export function createAirplane() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.4, 3),
    new THREE.MeshStandardMaterial({ color: 0xff4444 })
  );

  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.1, 1),
    new THREE.MeshStandardMaterial({ color: 0xff8888 })
  );
  wing.position.set(0, 0, 0);

  const tail = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.3, 1),
    new THREE.MeshStandardMaterial({ color: 0xff6666 })
  );
  tail.position.set(0, 0.2, -1.5);

  group.add(body, wing, tail);

  group.position.set(0, 2, 0);

  return group;
}

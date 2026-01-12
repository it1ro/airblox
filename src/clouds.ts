import * as THREE from "three";

export function createCloud(): THREE.Group {
  const cloud = new THREE.Group();
  cloud.userData.cloud = true;

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.0
  });

  const parts = 3 + Math.floor(Math.random() * 4);

  for (let i = 0; i < parts; i++) {
    const w = 1 + Math.random() * 2;
    const h = 0.6 + Math.random() * 0.6;
    const d = 1 + Math.random() * 2;

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      mat
    );

    box.position.set(
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 1,
      (Math.random() - 0.5) * 3
    );

    cloud.add(box);
  }

  cloud.position.set(
    (Math.random() - 0.5) * 300,
    5 + Math.random() * 15,
    (Math.random() - 0.5) * 300
  );

  cloud.rotation.y = Math.random() * Math.PI * 2;

  return cloud;
}

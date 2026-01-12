import * as THREE from "three";

export function createCloud(level: LevelDefinition): THREE.Group {
  const cloud = new THREE.Group();
  cloud.userData.cloud = true;

  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff });

  const parts = 3 + Math.floor(Math.random() * 4);

  for (let i = 0; i < parts; i++) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(
        1 + Math.random() * 2,
        0.6 + Math.random() * 0.6,
        1 + Math.random() * 2
      ),
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
    (Math.random() - 0.5) * level.worldSize,
    level.cloudHeightMin + Math.random() * (level.cloudHeightMax - level.cloudHeightMin),
    (Math.random() - 0.5) * level.worldSize
  );

  return cloud;
}


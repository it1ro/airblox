import * as THREE from "three";

export function createIsland(level: LevelDefinition): THREE.Group {
  const island = new THREE.Group();
  island.userData.island = true;

  const mat = new THREE.MeshStandardMaterial({
    color: level.islandColor
  });

  const size = level.islandSizeMin + Math.random() * (level.islandSizeMax - level.islandSizeMin);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(size, 2 + Math.random() * 2, size),
    mat
  );
  base.position.y = -1;
  island.add(base);

  const hills = 5 + Math.floor(Math.random() * 8);
  for (let i = 0; i < hills; i++) {
    const w = 2 + Math.random() * 4;
    const h = 1 + Math.random() * 3;
    const d = 2 + Math.random() * 4;

    const hill = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      mat
    );

    hill.position.set(
      (Math.random() - 0.5) * size * 0.6,
      h / 2,
      (Math.random() - 0.5) * size * 0.6
    );

    island.add(hill);
  }

  island.position.set(
    (Math.random() - 0.5) * level.worldSize,
    -2,
    (Math.random() - 0.5) * level.worldSize
  );

  return island;
}


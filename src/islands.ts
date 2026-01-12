import * as THREE from "three";

export function createIsland(): THREE.Group {
  const island = new THREE.Group();
  island.userData.island = true;

  const mat = new THREE.MeshStandardMaterial({
    color: 0x55aa55,
    roughness: 1.0,
    metalness: 0.0
  });

  // Основа острова — большой куб
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(
      20 + Math.random() * 20,
      2 + Math.random() * 2,
      20 + Math.random() * 20
    ),
    mat
  );
  base.position.y = -1;
  island.add(base);

  // Добавляем "холмы" — маленькие кубики сверху
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
      (Math.random() - 0.5) * base.geometry.parameters.width * 0.6,
      h / 2,
      (Math.random() - 0.5) * base.geometry.parameters.depth * 0.6
    );

    island.add(hill);
  }

  // Позиция острова в мире
  island.position.set(
    (Math.random() - 0.5) * 500,
    -2,
    (Math.random() - 0.5) * 500
  );

  return island;
}

import * as THREE from "three";
import { LevelDefinition } from "./levels";
import { createCloud } from "./clouds";
import { createIsland } from "./islands";

export function generateLevel(scene: THREE.Scene, level: LevelDefinition): THREE.Object3D[] {
  const clouds: THREE.Object3D[] = [];

  // Океан (размер по горизонтали: ±worldSize)
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(level.worldSize * 2, level.worldSize * 2),
    new THREE.MeshStandardMaterial({ color: level.oceanColor })
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -3;
  scene.add(ocean);

  // Облака
  for (let i = 0; i < level.cloudCount; i++) {
    const cloud = createCloud(level);
    clouds.push(cloud);
    scene.add(cloud);
  }

  // Острова
  for (let i = 0; i < level.islandCount; i++) {
    const island = createIsland(level);
    scene.add(island);
  }

  return clouds;
}

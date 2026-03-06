/**
 * Тестовая цель для кружка упреждения (v1).
 * Объект в сцене (сфера), позиция обновляется линейно по скорости.
 * pos, vel — переиспользуемые Vector3, без аллокаций в update().
 */

import * as THREE from "three";

export interface TestTargetOptions {
  /** Начальная позиция цели в мировых координатах. */
  initialPos?: THREE.Vector3Tuple;
  /** Начальная скорость цели (м/с). */
  initialVel?: THREE.Vector3Tuple;
  /** Радиус сферы (визуальный размер цели). */
  radius?: number;
  /** Цвет материала. */
  color?: number;
}

const DEFAULT_POS: THREE.Vector3Tuple = [80, 8, 100];
const DEFAULT_VEL: THREE.Vector3Tuple = [0, 0, -12];
const DEFAULT_RADIUS = 2;
const DEFAULT_COLOR = 0xcc4422;

export interface TestTarget {
  /** Mesh цели в сцене (для удаления при cleanup). */
  mesh: THREE.Mesh;
  /** Текущая позиция цели (мировые координаты). Мутируется в update(). */
  pos: THREE.Vector3;
  /** Скорость цели (м/с). Константа на время жизни цели. */
  vel: THREE.Vector3;
  /**
   * Обновляет позицию цели: pos += vel * dt, синхронизирует mesh.position.
   * Без аллокаций.
   */
  update(dt: number): void;
}

/**
 * Создаёт тестовую цель в сцене: сфера с заданными pos/vel.
 * Возвращает объект с mesh, pos, vel и update(dt) для линейного движения.
 */
export function createTestTarget(
  scene: THREE.Scene,
  options: TestTargetOptions = {}
): TestTarget {
  const initialPos = options.initialPos ?? DEFAULT_POS;
  const initialVel = options.initialVel ?? DEFAULT_VEL;
  const radius = options.radius ?? DEFAULT_RADIUS;
  const color = options.color ?? DEFAULT_COLOR;

  const geometry = new THREE.SphereGeometry(radius, 16, 12);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.2,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const pos = new THREE.Vector3(initialPos[0], initialPos[1], initialPos[2]);
  const vel = new THREE.Vector3(initialVel[0], initialVel[1], initialVel[2]);

  mesh.position.copy(pos);
  scene.add(mesh);

  function update(dt: number): void {
    pos.addScaledVector(vel, dt);
    mesh.position.copy(pos);
  }

  return { mesh, pos, vel, update };
}

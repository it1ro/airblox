/**
 * Математика перехвата (чистая).
 * Решает время до перехвата цели постоянной скоростью снаряда.
 * Без аллокаций, без мутаций — только числа.
 */

import type { Vector3 } from "three";

/**
 * Решает время перехвата: при каком минимальном t > 0 снаряд с постоянной
 * скоростью projectileSpeed, выпущенный из начала координат в направлении
 * точки (r + v*t), достигнет цели.
 *
 * Уравнение: |r + v*t| = projectileSpeed * t
 * Квадрат:   (r + v*t)² = (projectileSpeed * t)²
 * Раскрытие: r² + 2(r·v)t + v²t² = s²t²
 * Квадратное: (v² - s²)t² + 2(r·v)t + r² = 0
 *
 * @param rVec — вектор от стрелка к цели (relative position)
 * @param vVec — скорость цели (или относительная скорость цель−стрелок)
 * @param projectileSpeed — скорость снаряда (скаляр, > 0)
 * @returns минимальный положительный t (секунды) или null, если решения нет
 */
export function solveInterceptTime(
  rVec: Vector3,
  vVec: Vector3,
  projectileSpeed: number
): number | null {
  if (projectileSpeed <= 0) return null;

  const rx = rVec.x,
    ry = rVec.y,
    rz = rVec.z;
  const vx = vVec.x,
    vy = vVec.y,
    vz = vVec.z;
  const s = projectileSpeed;

  const r2 = rx * rx + ry * ry + rz * rz;
  const rv = rx * vx + ry * vy + rz * vz;
  const v2 = vx * vx + vy * vy + vz * vz;

  const a = v2 - s * s;
  const b = 2 * rv;
  const c = r2;

  if (a === 0) {
    // Цель движется со скоростью снаряда: линейное уравнение b*t + c = 0
    if (b >= 0) return null; // цель удаляется или стоит — перехват в будущем невозможен
    const t = -c / b;
    return t > 0 ? t : null;
  }

  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;

  const sqrtDisc = Math.sqrt(disc);
  const twoA = 2 * a;
  const t1 = (-b - sqrtDisc) / twoA;
  const t2 = (-b + sqrtDisc) / twoA;

  const tPos1 = t1 > 0 ? t1 : null;
  const tPos2 = t2 > 0 ? t2 : null;

  if (tPos1 !== null && tPos2 !== null) return Math.min(tPos1, tPos2);
  if (tPos1 !== null) return tPos1;
  if (tPos2 !== null) return tPos2;
  return null;
}

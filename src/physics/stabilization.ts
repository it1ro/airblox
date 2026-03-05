/**
 * Стабилизация — чистая функция расчёта корректирующей силы по одной оси.
 * Логирование остаётся в controls (коллбэком или после вызова).
 */

import type { AirplaneStats } from "../airplanes";

/**
 * Вычисляет величину коррекции угловой скорости для стабилизации.
 * Возвращает значение, которое вычитается из velocity (приводит к выравниванию).
 *
 * @param angle — текущий угол по оси (радианы)
 * @param angleAbs — |angle|
 * @param input — ввод игрока по этой оси (-1, 0, 1)
 * @param stats — параметры самолёта (autoLevel и т.д.)
 * @param speedFactor — множитель от скорости полёта
 * @param stabLimit — порог угла (радианы), выше которого стабилизация отключена
 * @param forceLinear — линейный коэффициент силы (зависимость от угла)
 * @param forceConst — постоянная составляющая силы
 * @returns коррекция для вычитания из velocity, или 0 если стабилизация не активна
 */
export function computeStabilizationForce(
  angle: number,
  angleAbs: number,
  input: number,
  stats: AirplaneStats,
  speedFactor: number,
  stabLimit: number,
  forceLinear: number,
  forceConst: number
): number {
  if (input !== 0) return 0;
  if (angleAbs >= stabLimit) return 0;

  const force = stats.autoLevel * (angleAbs * forceLinear + forceConst);
  return angle * force * speedFactor;
}

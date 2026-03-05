/**
 * Модель полёта — чистые функции расчёта инерции и затухания.
 * Только числа, без мутации Three.js объектов.
 */

import type { AirplaneStats } from "../airplanes";

export interface AngularVelocities {
  pitchVelocity: number;
  rollVelocity: number;
}

/**
 * Обновление угловых скоростей по вводу игрока (инерция).
 * Возвращает новые pitchVelocity, rollVelocity.
 */
export function updateInertia(
  pitchInput: number,
  rollInput: number,
  pitchVel: number,
  rollVel: number,
  stats: AirplaneStats
): AngularVelocities {
  return {
    pitchVelocity: pitchVel + pitchInput * stats.pitchAccel,
    rollVelocity: rollVel + rollInput * stats.rollAccel
  };
}

/**
 * Применение затухания к угловым скоростям.
 * Возвращает затухшие pitchVelocity, rollVelocity.
 */
export function applyDamping(
  pitchVel: number,
  rollVel: number,
  stats: AirplaneStats
): AngularVelocities {
  return {
    pitchVelocity: pitchVel * stats.pitchDamping,
    rollVelocity: rollVel * stats.rollDamping
  };
}

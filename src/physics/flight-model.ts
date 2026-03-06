/**
 * Модель полёта — чистые функции расчёта инерции и затухания.
 * Только числа, без мутации Three.js объектов.
 */

import type { AirplaneStats } from "../airplanes";

export interface AngularVelocities {
  pitchVelocity: number;
  rollVelocity: number;
  yawVelocity: number;
}

type AirplaneStatsYaw = AirplaneStats & {
  yawAccel?: number;
  yawDamping?: number;
};

/**
 * Обновление угловых скоростей по вводу игрока (инерция).
 * Возвращает новые pitchVelocity, rollVelocity, yawVelocity.
 */
export function updateInertia(
  pitchInput: number,
  rollInput: number,
  pitchVel: number,
  rollVel: number,
  stats: AirplaneStatsYaw,
  yawInput = 0,
  yawVel = 0
): AngularVelocities {
  const yawAccel = stats.yawAccel ?? stats.rollAccel;
  return {
    pitchVelocity: pitchVel + pitchInput * stats.pitchAccel,
    rollVelocity: rollVel + rollInput * stats.rollAccel,
    yawVelocity: yawVel + yawInput * yawAccel
  };
}

export function updateInertiaInto(
  out: AngularVelocities,
  pitchInput: number,
  rollInput: number,
  yawInput: number,
  pitchVel: number,
  rollVel: number,
  yawVel: number,
  stats: AirplaneStatsYaw
): AngularVelocities {
  const yawAccel = stats.yawAccel ?? stats.rollAccel;
  out.pitchVelocity = pitchVel + pitchInput * stats.pitchAccel;
  out.rollVelocity = rollVel + rollInput * stats.rollAccel;
  out.yawVelocity = yawVel + yawInput * yawAccel;
  return out;
}

/**
 * Применение затухания к угловым скоростям.
 * Возвращает затухшие pitchVelocity, rollVelocity, yawVelocity.
 */
export function applyDamping(
  pitchVel: number,
  rollVel: number,
  stats: AirplaneStatsYaw,
  yawVel = 0
): AngularVelocities {
  const yawDamping = stats.yawDamping ?? stats.rollDamping;
  return {
    pitchVelocity: pitchVel * stats.pitchDamping,
    rollVelocity: rollVel * stats.rollDamping,
    yawVelocity: yawVel * yawDamping
  };
}

export function applyDampingInto(
  out: AngularVelocities,
  pitchVel: number,
  rollVel: number,
  yawVel: number,
  stats: AirplaneStatsYaw
): AngularVelocities {
  const yawDamping = stats.yawDamping ?? stats.rollDamping;
  out.pitchVelocity = pitchVel * stats.pitchDamping;
  out.rollVelocity = rollVel * stats.rollDamping;
  out.yawVelocity = yawVel * yawDamping;
  return out;
}

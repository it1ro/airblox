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
 * Ограничивает приращение угловой скорости за кадр (4.4 — ограничители для «задержки»).
 * Если задан maxRateChange, дельта за кадр не превышает его по модулю.
 */
function clampDelta(
  delta: number,
  maxRateChange: number | undefined
): number {
  if (maxRateChange === undefined) return delta;
  if (delta > maxRateChange) return maxRateChange;
  if (delta < -maxRateChange) return -maxRateChange;
  return delta;
}

/**
 * Обновление угловых скоростей по вводу игрока (инерция).
 * Учитывает ограничители приращения за кадр (max*RateChange), если заданы в stats.
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
  const dPitch = clampDelta(pitchInput * stats.pitchAccel, stats.maxPitchRateChange);
  const dRoll = clampDelta(rollInput * stats.rollAccel, stats.maxRollRateChange);
  const dYaw = clampDelta(yawInput * yawAccel, stats.maxYawRateChange);
  return {
    pitchVelocity: pitchVel + dPitch,
    rollVelocity: rollVel + dRoll,
    yawVelocity: yawVel + dYaw
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
  const dPitch = clampDelta(pitchInput * stats.pitchAccel, stats.maxPitchRateChange);
  const dRoll = clampDelta(rollInput * stats.rollAccel, stats.maxRollRateChange);
  const dYaw = clampDelta(yawInput * yawAccel, stats.maxYawRateChange);
  out.pitchVelocity = pitchVel + dPitch;
  out.rollVelocity = rollVel + dRoll;
  out.yawVelocity = yawVel + dYaw;
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

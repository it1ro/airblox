/**
 * Контроллер прицеливания (mouse-aim) — чистые функции spring-damper.
 * Только числа, без побочных эффектов. Используется для расчёта pitch/yaw/roll
 * входов по ошибке наведения и текущей угловой скорости.
 */

/**
 * Вычисляет вход по одной оси [-1..1] по spring-damper закону.
 * Ошибка и угловая скорость в радианах/рад/с; deadzone обнуляет малые ошибки.
 *
 * @param errorRad — текущая угловая ошибка (рад), например yawError или pitchError
 * @param angularVel — текущая угловая скорость по этой оси (рад/с)
 * @param kp — коэффициент жёсткости (рекомендуемый диапазон 2..8)
 * @param kd — коэффициент демпфирования (рекомендуемый диапазон 0.5..2)
 * @param deadzoneRad — порог (рад): при |errorRad| < deadzoneRad ошибка считается 0
 * @returns вход по оси в диапазоне [-1, 1]
 */
export function computeAxisInputSpringDamper(
  errorRad: number,
  angularVel: number,
  kp: number,
  kd: number,
  deadzoneRad: number
): number {
  const effectiveError =
    Math.abs(errorRad) <= deadzoneRad ? 0 : errorRad;
  const raw = kp * effectiveError - kd * angularVel;
  if (raw <= -1) return -1;
  if (raw >= 1) return 1;
  return raw;
}

/**
 * Целевой угол крена (рад) по ошибке рысканья — для auto-bank (нос в сторону прицела).
 *
 * @param yawErrorRad — ошибка рысканья (рад)
 * @param maxBankRad — максимальный крен (рад), по модулю
 * @param gain — коэффициент: bankTarget = clamp(gain * yawError, -maxBank, maxBank)
 * @returns целевой крен в радианах
 */
export function computeBankTarget(
  yawErrorRad: number,
  maxBankRad: number,
  gain: number = 1
): number {
  const target = gain * yawErrorRad;
  if (target <= -maxBankRad) return -maxBankRad;
  if (target >= maxBankRad) return maxBankRad;
  return target;
}

/**
 * Вход по крену [-1..1] для выхода на целевой угол крена (spring-damper).
 *
 * @param rollAngle — текущий угол крена (рад)
 * @param rollVel — текущая угловая скорость крена (рад/с)
 * @param rollTargetRad — целевой угол крена (рад)
 * @param kp — коэффициент жёсткости (2..8)
 * @param kd — коэффициент демпфирования (0.5..2)
 * @param deadzoneRad — порог по ошибке угла (рад)
 * @returns вход по крену в диапазоне [-1, 1]
 */
export function computeRollInputToBank(
  rollAngle: number,
  rollVel: number,
  rollTargetRad: number,
  kp: number,
  kd: number,
  deadzoneRad: number
): number {
  const errorRad = rollTargetRad - rollAngle;
  return computeAxisInputSpringDamper(
    errorRad,
    rollVel,
    kp,
    kd,
    deadzoneRad
  );
}

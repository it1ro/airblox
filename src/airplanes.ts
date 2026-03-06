export interface AirplaneStats {
  speed: number;          // базовая скорость
  pitchAccel: number;     // ускорение тангажа
  yawAccel: number;       // ускорение рысканья (yaw)
  rollAccel: number;      // ускорение крена
  pitchDamping: number;   // затухание тангажа
  yawDamping: number;     // затухание рысканья (yaw)
  rollDamping: number;    // затухание крена
  autoLevel: number;      // сила автостабилизации
  maxPitch: number;       // ограничение угла тангажа
  maxRoll: number;        // ограничение угла крена

  // Лимиты угловых скоростей (рад/кадр) — создают «задержку догоняния» прицела (4.4).
  maxYawRate?: number;
  maxPitchRate?: number;
  maxRollRate?: number;
  // Макс. приращение угловой скорости за кадр (рад/кадр) — ограничение *Accel, второй уровень задержки.
  maxPitchRateChange?: number;
  maxYawRateChange?: number;
  maxRollRateChange?: number;
}

// === 1. Лёгкий истребитель (самый манёвренный) ===
export const LIGHT_FIGHTER: AirplaneStats = {
  speed: 0.42,
  pitchAccel: 0.0012,
  yawAccel: 0.0011,
  rollAccel: 0.0025,
  pitchDamping: 0.92,
  yawDamping: 0.91,
  rollDamping: 0.90,
  autoLevel: 0.015,
  maxPitch: 0.9,
  maxRoll: 1.4,
  maxPitchRate: 0.05,
  maxYawRate: 0.045,
  maxRollRate: 0.06,
  maxPitchRateChange: 0.012,
  maxYawRateChange: 0.011,
  maxRollRateChange: 0.015
};

// === 2. Тяжёлый штурмовик ===
export const HEAVY_ATTACKER: AirplaneStats = {
  speed: 0.32,
  pitchAccel: 0.0018,
  yawAccel: 0.0012,
  rollAccel: 0.0022,
  pitchDamping: 0.96,
  yawDamping: 0.95,
  rollDamping: 0.95,
  autoLevel: 0.010,
  maxPitch: 0.6,
  maxRoll: 0.9,
  maxPitchRate: 0.04,
  maxYawRate: 0.035,
  maxRollRate: 0.05,
  maxPitchRateChange: 0.009,
  maxYawRateChange: 0.008,
  maxRollRateChange: 0.012
};

// === 3. Балансный самолёт (универсальный) ===
export const BALANCED_PLANE: AirplaneStats = {
  speed: 0.36,
  pitchAccel: 0.0025,
  yawAccel: 0.0018,
  rollAccel: 0.0030,
  pitchDamping: 0.94,
  yawDamping: 0.93,
  rollDamping: 0.93,
  autoLevel: 0.012,
  maxPitch: 0.75,
  maxRoll: 1.1,
  maxPitchRate: 0.055,
  maxYawRate: 0.05,
  maxRollRate: 0.065,
  maxPitchRateChange: 0.014,
  maxYawRateChange: 0.012,
  maxRollRateChange: 0.018
};

// === 4. Скоростной разведчик ===
export const SCOUT_PLANE: AirplaneStats = {
  speed: 0.50,
  pitchAccel: 0.0020,
  yawAccel: 0.0014,
  rollAccel: 0.0035,
  pitchDamping: 0.93,
  yawDamping: 0.92,
  rollDamping: 0.92,
  autoLevel: 0.014,
  maxPitch: 0.7,
  maxRoll: 1.3,
  maxPitchRate: 0.048,
  maxYawRate: 0.042,
  maxRollRate: 0.068,
  maxPitchRateChange: 0.011,
  maxYawRateChange: 0.009,
  maxRollRateChange: 0.016
};

// === 5. Тренировочный самолёт (очень стабильный) ===
export const TRAINER_PLANE: AirplaneStats = {
  speed: 0.28,
  pitchAccel: 0.0015,
  yawAccel: 0.0010,
  rollAccel: 0.0020,
  pitchDamping: 0.97,
  yawDamping: 0.96,
  rollDamping: 0.96,
  autoLevel: 0.020,
  maxPitch: 0.5,
  maxRoll: 0.8,
  maxPitchRate: 0.038,
  maxYawRate: 0.032,
  maxRollRate: 0.045,
  maxPitchRateChange: 0.007,
  maxYawRateChange: 0.006,
  maxRollRateChange: 0.010
};

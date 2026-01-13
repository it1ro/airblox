export interface AirplaneStats {
  speed: number;          // базовая скорость
  pitchAccel: number;     // ускорение тангажа
  rollAccel: number;      // ускорение крена
  pitchDamping: number;   // затухание тангажа
  rollDamping: number;    // затухание крена
  autoLevel: number;      // сила автостабилизации
  maxPitch: number;       // ограничение угла тангажа
  maxRoll: number;        // ограничение угла крена
}

// === 1. Лёгкий истребитель (самый манёвренный) ===
export const LIGHT_FIGHTER: AirplaneStats = {
  speed: 0.42,
  pitchAccel: 0.0012,
  rollAccel: 0.0025,
  pitchDamping: 0.92,
  rollDamping: 0.90,
  autoLevel: 0.015,
  maxPitch: 0.9,
  maxRoll: 1.4
};

// === 2. Тяжёлый штурмовик ===
export const HEAVY_ATTACKER: AirplaneStats = {
  speed: 0.32,
  pitchAccel: 0.0018,
  rollAccel: 0.0022,
  pitchDamping: 0.96,
  rollDamping: 0.95,
  autoLevel: 0.010,
  maxPitch: 0.6,
  maxRoll: 0.9
};

// === 3. Балансный самолёт (универсальный) ===
export const BALANCED_PLANE: AirplaneStats = {
  speed: 0.36,
  pitchAccel: 0.0025,
  rollAccel: 0.0030,
  pitchDamping: 0.94,
  rollDamping: 0.93,
  autoLevel: 0.012,
  maxPitch: 0.75,
  maxRoll: 1.1
};

// === 4. Скоростной разведчик ===
export const SCOUT_PLANE: AirplaneStats = {
  speed: 0.50,
  pitchAccel: 0.0020,
  rollAccel: 0.0035,
  pitchDamping: 0.93,
  rollDamping: 0.92,
  autoLevel: 0.014,
  maxPitch: 0.7,
  maxRoll: 1.3
};

// === 5. Тренировочный самолёт (очень стабильный) ===
export const TRAINER_PLANE: AirplaneStats = {
  speed: 0.28,
  pitchAccel: 0.0015,
  rollAccel: 0.0020,
  pitchDamping: 0.97,
  rollDamping: 0.96,
  autoLevel: 0.020,
  maxPitch: 0.5,
  maxRoll: 0.8
};

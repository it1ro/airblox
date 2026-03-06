/**
 * Тесты flight-model: крайние случаи по правилам (zero speed, стабильность).
 * Без аллокаций в hot path — проверяем граничные входы и clamp.
 */
import { describe, it, expect } from "vitest";
import {
  updateInertia,
  updateInertiaInto,
  applyDamping,
  applyDampingInto,
  type AngularVelocities
} from "./flight-model";
import type { AirplaneStats } from "../airplanes";

const baseStats: AirplaneStats = {
  speed: 0.4,
  pitchAccel: 0.001,
  yawAccel: 0.001,
  rollAccel: 0.002,
  pitchDamping: 0.92,
  yawDamping: 0.9,
  rollDamping: 0.9,
  maxPitch: 0.9,
  maxRoll: 1.2,
  autoLevel: 0.01
};

describe("flight-model", () => {
  describe("updateInertia — крайние случаи", () => {
    it("zero speed (нулевой ввод и нулевые скорости) — выход остаётся нулевым", () => {
      const out = updateInertia(0, 0, 0, 0, { ...baseStats }, 0, 0);
      expect(out.pitchVelocity).toBe(0);
      expect(out.rollVelocity).toBe(0);
      expect(out.yawVelocity).toBe(0);
    });

    it("нулевые текущие скорости, единичный ввод — даёт приращение по accel", () => {
      const s = { ...baseStats, pitchAccel: 0.01, rollAccel: 0.02 };
      const out = updateInertia(1, 1, 0, 0, s, 1, 0);
      expect(out.pitchVelocity).toBe(0.01);
      expect(out.rollVelocity).toBe(0.02);
      expect(out.yawVelocity).toBeGreaterThan(0);
    });

    it("maxRateChange ограничивает приращение за кадр (задержка)", () => {
      const s = {
        ...baseStats,
        pitchAccel: 1,
        maxPitchRateChange: 0.05,
        maxRollRateChange: 0.05,
        maxYawRateChange: 0.05
      };
      const out = updateInertia(1, 1, 0, 0, s, 1, 0);
      expect(Math.abs(out.pitchVelocity)).toBeLessThanOrEqual(0.05);
      expect(Math.abs(out.rollVelocity)).toBeLessThanOrEqual(0.05);
      expect(Math.abs(out.yawVelocity)).toBeLessThanOrEqual(0.05);
    });

    it("updateInertiaInto не аллоцирует — перезаписывает out", () => {
      const out: AngularVelocities = {
        pitchVelocity: -1,
        rollVelocity: -1,
        yawVelocity: -1
      };
      const s = { ...baseStats, pitchAccel: 0.001, rollAccel: 0.002 };
      const result = updateInertiaInto(out, 0, 0, 0, 0, 0, 0, s);
      expect(result).toBe(out);
      expect(out.pitchVelocity).toBe(0);
      expect(out.rollVelocity).toBe(0);
      expect(out.yawVelocity).toBe(0);
    });
  });

  describe("applyDamping — крайние случаи", () => {
    it("zero speed (нулевые угловые скорости) — после damping остаётся 0", () => {
      const out = applyDamping(0, 0, { ...baseStats }, 0);
      expect(out.pitchVelocity).toBe(0);
      expect(out.rollVelocity).toBe(0);
      expect(out.yawVelocity).toBe(0);
    });

    it("затухание уменьшает скорость (стабильность)", () => {
      const out = applyDamping(0.1, 0.1, { ...baseStats }, 0.1);
      expect(Math.abs(out.pitchVelocity)).toBeLessThan(0.1);
      expect(Math.abs(out.rollVelocity)).toBeLessThan(0.1);
      expect(Math.abs(out.yawVelocity)).toBeLessThan(0.1);
    });

    it("applyDampingInto перезаписывает out без аллокации", () => {
      const out: AngularVelocities = { pitchVelocity: 1, rollVelocity: 1, yawVelocity: 1 };
      const result = applyDampingInto(out, 0.5, 0.5, 0.5, { ...baseStats });
      expect(result).toBe(out);
      expect(out.pitchVelocity).toBe(0.5 * baseStats.pitchDamping);
      expect(out.rollVelocity).toBe(0.5 * baseStats.rollDamping);
    });
  });
});

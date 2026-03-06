/**
 * Тесты aim-controller: крайние случаи (zero speed, stall, inverted flight).
 * Spring-damper с deadzone — проверяем границы и clamp [-1, 1].
 */
import { describe, it, expect } from "vitest";
import {
  computeAxisInputSpringDamper,
  computeBankTarget,
  computeRollInputToBank,
  AIM_CONTROLLER_DEFAULTS
} from "./aim-controller";

const { deadzoneRad, kpYaw, kdYaw, kpPitch, kdPitch, kpRoll, kdRoll } =
  AIM_CONTROLLER_DEFAULTS;

describe("aim-controller", () => {
  describe("computeAxisInputSpringDamper — крайние случаи", () => {
    it("zero speed: нулевая ошибка и нулевая угловая скорость — выход 0 (deadzone)", () => {
      const input = computeAxisInputSpringDamper(0, 0, kpYaw, kdYaw, deadzoneRad);
      expect(input).toBe(0);
    });

    it("deadzone: ошибка внутри deadzone даёт 0 (стабильность)", () => {
      const smallError = deadzoneRad * 0.5;
      const input = computeAxisInputSpringDamper(smallError, 0, kpYaw, kdYaw, deadzoneRad);
      expect(input).toBe(0);
    });

    it("inverted flight: большая ошибка (близко к ±π) — выход зажат в [-1, 1]", () => {
      const largeError = Math.PI * 0.9;
      const input = computeAxisInputSpringDamper(largeError, 0, kpYaw, kdYaw, deadzoneRad);
      expect(input).toBeLessThanOrEqual(1);
      expect(input).toBeGreaterThanOrEqual(-1);
    });

    it("stall: высокая угловая скорость — демпфер даёт отрицательный вклад (торможение вращения)", () => {
      const error = 0;
      const highAngularVel = 2;
      const input = computeAxisInputSpringDamper(error, highAngularVel, kpYaw, kdYaw, deadzoneRad);
      expect(input).toBeLessThan(0);
    });

    it("выход всегда в [-1, 1]", () => {
      const veryLargeError = 10;
      const input = computeAxisInputSpringDamper(veryLargeError, 0, kpYaw, kdYaw, deadzoneRad);
      expect(input).toBe(1);
      const neg = computeAxisInputSpringDamper(-veryLargeError, 0, kpYaw, kdYaw, deadzoneRad);
      expect(neg).toBe(-1);
    });
  });

  describe("computeBankTarget", () => {
    it("нулевая ошибка рысканья — целевой крен 0", () => {
      expect(computeBankTarget(0, 1)).toBe(0);
    });

    it("ограничение по maxBankRad (inverted-style большая ошибка)", () => {
      const maxBank = 0.8;
      expect(computeBankTarget(2, maxBank, 1)).toBe(maxBank);
      expect(computeBankTarget(-2, maxBank, 1)).toBe(-maxBank);
    });
  });

  describe("computeRollInputToBank", () => {
    it("цель совпадает с текущим углом — выход в deadzone ~0", () => {
      const rollAngle = 0.3;
      const input = computeRollInputToBank(
        rollAngle,
        0,
        rollAngle,
        kpRoll,
        kdRoll,
        deadzoneRad
      );
      expect(Math.abs(input)).toBeLessThanOrEqual(0.01);
    });

    it("большая ошибка крена — выход зажат в [-1, 1]", () => {
      const input = computeRollInputToBank(0, 0, Math.PI, kpRoll, kdRoll, deadzoneRad);
      expect(input).toBeLessThanOrEqual(1);
      expect(input).toBeGreaterThanOrEqual(-1);
    });
  });
});

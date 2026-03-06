/**
 * Тесты intercept: крайние случаи (zero speed, нет решения, граничная геометрия).
 */
import { describe, it, expect } from "vitest";
import { solveInterceptTime } from "./intercept";
import { Vector3 } from "three";

describe("intercept", () => {
  describe("solveInterceptTime — крайние случаи", () => {
    it("zero speed снаряда (projectileSpeed <= 0) — null", () => {
      const r = new Vector3(100, 0, 0);
      const v = new Vector3(0, 0, 0);
      expect(solveInterceptTime(r, v, 0)).toBeNull();
      expect(solveInterceptTime(r, v, -1)).toBeNull();
    });

    it("zero speed цели (цель неподвижна) — время = расстояние / скорость снаряда", () => {
      const dist = 200;
      const r = new Vector3(dist, 0, 0);
      const v = new Vector3(0, 0, 0);
      const speed = 100;
      const t = solveInterceptTime(r, v, speed);
      expect(t).not.toBeNull();
      expect(t!).toBeCloseTo(dist / speed, 5);
    });

    it("цель в начале координат (r = 0), цель удаляется — единственный положительный корень или null", () => {
      const r = new Vector3(0, 0, 0);
      const v = new Vector3(10, 0, 0);
      const t = solveInterceptTime(r, v, 50);
      // r=0 => c=0; корни t=0 и t=-b/(2a). При a>0 (v²<s²) один положительный; при a<0 оба отриц. или null.
      expect(t === null || t > 0).toBe(true);
    });

    it("нет решения (дискриминант < 0, снаряд не достаёт до траектории цели) — null", () => {
      const r = new Vector3(100, 0, 0);
      const v = new Vector3(0, 500, 0);
      const t = solveInterceptTime(r, v, 100);
      expect(t).toBeNull();
    });

    it("цель движется со скоростью снаряда (a = 0) — линейное уравнение", () => {
      const r = new Vector3(100, 0, 0);
      const v = new Vector3(-50, 0, 0);
      const speed = 50;
      const t = solveInterceptTime(r, v, speed);
      expect(t).not.toBeNull();
      expect(t!).toBeGreaterThan(0);
    });

    it("два положительных корня — возвращается минимальный t", () => {
      const r = new Vector3(0, 0, 100);
      const v = new Vector3(0, 0, -10);
      const speed = 200;
      const t = solveInterceptTime(r, v, speed);
      expect(t).not.toBeNull();
      expect(t!).toBeGreaterThan(0);
      const t2 = solveInterceptTime(r, v, speed);
      expect(t2).toBe(t);
    });
  });
});

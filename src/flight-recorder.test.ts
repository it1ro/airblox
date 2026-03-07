/**
 * Тест-драйв Flight Recorder и DevOverlay: проверка передачи сигналов управления
 * и появления логов (снимков) на выходе при записи.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import { createControls } from "./controls";
import { FlightRecorder } from "./flight-recorder";
import { LIGHT_FIGHTER } from "./airplanes";

// Мок ввода: управляемый Set клавиш и нулевые дельты мыши
const keys = new Set<string>();
vi.mock("./input/keyboard-input", () => ({
  getKeys: vi.fn(() => keys)
}));
vi.mock("./input/mouse-input", () => ({
  getMouseDeltas: vi.fn((out: { dx: number; dy: number }) => {
    out.dx = 0;
    out.dy = 0;
  })
}));
vi.mock("./audio", () => ({
  AudioManager: {
    setEngineRPM: vi.fn(),
    setWindIntensity: vi.fn()
  }
}));

describe("Flight Recorder + controls — тест-драйв (сигналы управления и логи)", () => {
  let airplane: THREE.Group;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let controls: ReturnType<typeof createControls>;
  let nowMs: number;

  beforeEach(() => {
    keys.clear();
    nowMs = 0;
    vi.spyOn(performance, "now").mockImplementation(() => nowMs);

    airplane = new THREE.Group();
    airplane.position.set(0, 10, 0);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
    camera.position.set(0, 13, -8);
    camera.lookAt(0, 10, 0);

    controls = createControls(
      airplane,
      LIGHT_FIGHTER,
      scene,
      camera,
      undefined,
      { sensitivity: 1, clampRadiusNdc: 0.6, returnToCenterSpeed: 0.01 }
    );
  });

  afterEach(() => {
    FlightRecorder.stopRecording();
    vi.restoreAllMocks();
  });

  it("при выключенной записи getRecordingBlob() пустой, снимков нет", () => {
    controls.update(undefined, { leadNdc: { x: 0.1, y: -0.2 } });
    nowMs += 200;
    controls.update(undefined);

    expect(FlightRecorder.isRecording()).toBe(false);
    expect(FlightRecorder.getLastSnapshot()).toBeNull();
    expect(FlightRecorder.getRecordingBlob()).toBeNull();
  });

  it("при включённой записи после update() появляются снимки и логи на выходе", async () => {
    FlightRecorder.startRecording({ frequencyHz: 10 });

    controls.update(undefined, { leadNdc: { x: 0.1, y: -0.2 } });
    nowMs += 150;
    controls.update(undefined, { leadNdc: { x: 0.15, y: -0.25 } });

    const snapshot = FlightRecorder.getLastSnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot!.t).toBe(150);
    expect(snapshot!.airplane).toBeDefined();
    expect(snapshot!.controls).toBeDefined();
    expect(snapshot!.reticle).toBeDefined();
    expect(snapshot!.aim).toBeDefined();
    expect(snapshot!.leadNdc).toEqual({ x: 0.15, y: -0.25 });

    const blob = FlightRecorder.getRecordingBlob();
    expect(blob).not.toBeNull();
    const text = await blob!.text();
    const lines = text.trim().split("\n").filter(Boolean);
    expect(lines.length).toBeGreaterThanOrEqual(1);
    const first = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(first.t).toBeDefined();
    expect(first.airplane).toBeDefined();
    expect(first.controls).toBeDefined();
    expect(first.reticle).toBeDefined();
  });

  it("сигналы управления с клавиатуры попадают в снимок (pitch/roll/yaw)", () => {
    FlightRecorder.startRecording({ frequencyHz: 10 });

    keys.add("w");
    controls.update(undefined);
    nowMs += 150;
    keys.add("a");
    controls.update(undefined);

    const snapshot = FlightRecorder.getLastSnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot!.controls.pitchInput).not.toBe(0);
    expect(snapshot!.controls.rollInput).not.toBe(0);
  });

  it("throttle по frequencyHz: снимки не чаще заданной частоты", async () => {
    FlightRecorder.startRecording({ frequencyHz: 10 });

    controls.update(undefined);
    nowMs += 105;
    controls.update(undefined);
    nowMs += 105;
    controls.update(undefined);

    const blob = FlightRecorder.getRecordingBlob();
    expect(blob).not.toBeNull();
    const text = await blob!.text();
    const lines = text.trim().split("\n").filter(Boolean);
    expect(lines.length).toBeLessThanOrEqual(3);
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });
});

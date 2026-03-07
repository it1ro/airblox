import * as THREE from "three";
import { createScene } from "./scene";
import { createAirplane } from "./airplane";
import { createControls } from "./controls";
import { LIGHT_FIGHTER } from "./airplanes";
import { AudioManager } from "./audio";
import { subscribe as subscribeMouseInput } from "./input/mouse-input";
import { initAimOverlay, updateAimOverlay } from "./ui/aim-overlay";
import { DevOverlay } from "./debug";
import { createTestTarget } from "./game/test-target";
import { solveInterceptTime } from "./physics/intercept";

// === HDR LOADER ===
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

const { scene, camera, renderer, clouds, level, cleanup } = createScene();

const unsubscribeMouse = subscribeMouseInput(renderer.domElement);

// При выгрузке страницы снимаем слушатели (resize, mouse и т.д.)
window.addEventListener("beforeunload", () => {
  cleanup();
  unsubscribeMouse();
});
const airplane = createAirplane();
scene.add(airplane);

const controls = createControls(
  airplane,
  LIGHT_FIGHTER,
  scene,
  camera,
  renderer.domElement,
  { sensitivity: 1, clampRadiusNdc: 0.6, returnToCenterSpeed: 0.01 }
);

initAimOverlay(renderer.domElement);
DevOverlay.init();

const testTarget = createTestTarget(scene);
const cameraOffset = new THREE.Vector3(0, 3, -8);
const reticleState = { x_ndc: 0, y_ndc: 0 };
const aimErrorsOut = { yawErrorRad: 0, pitchErrorRad: 0 };
const desiredPos = new THREE.Vector3();
/** Включить периодический вывод в консоль для проверки сигналов: ?log=1 или sessionStorage.airblox_log */
const debugLogEnabled =
  typeof window !== "undefined" &&
  (window.location.search.includes("log=1") || sessionStorage.getItem("airblox_log") === "1");
let debugLogLast = 0;
/** Скорость снаряда для расчёта упреждения (м/с). */
const PROJECTILE_SPEED = 500;
/** Вектор от самолёта к цели (для solveInterceptTime), переиспользуемый. */
const rVec = new THREE.Vector3();
/** Точка упреждения в мире, затем в NDC после project(camera). */
const leadPointWorld = new THREE.Vector3();
let lastTime = performance.now();

async function main() {
  try {
    await AudioManager.init();
  } catch (e) {
    console.error("Audio init failed:", e);
  }
}

main();

// === HDR ENVIRONMENT ===
new RGBELoader().load(
  "/hdr/sky.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.physicallyCorrectLights = true;

    scene.environment = texture;   // освещение
    scene.background = texture;    // фон
  },
  undefined,
  (error) => {
    console.error("Ошибка загрузки HDR:", error);
  }
);

function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // === ТЕСТОВАЯ ЦЕЛЬ (линейное движение) ===
  testTarget.update(dt);

  // === 6.3 Проекция leadPoint на экран (до controls.update для Debug HUD) ===
  rVec.subVectors(testTarget.pos, airplane.position);
  const t = solveInterceptTime(rVec, testTarget.vel, PROJECTILE_SPEED);
  let leadX_ndc: number | undefined;
  let leadY_ndc: number | undefined;
  if (t !== null) {
    leadPointWorld.copy(testTarget.pos).addScaledVector(testTarget.vel, t);
    leadPointWorld.project(camera);
    if (leadPointWorld.z <= 1) {
      leadX_ndc = leadPointWorld.x;
      leadY_ndc = leadPointWorld.y;
    }
  }

  // === ОБНОВЛЕНИЕ УПРАВЛЕНИЯ (с leadNdc для DevOverlay HUD и снимка Flight Recorder) ===
  const debugOptions =
    leadX_ndc !== undefined && leadY_ndc !== undefined
      ? { leadNdc: { x: leadX_ndc, y: leadY_ndc } }
      : undefined;
  controls.update(undefined, debugOptions);
  controls.getReticle(reticleState);

  if (debugLogEnabled && now - debugLogLast >= 500) {
    debugLogLast = now;
    controls.getAimErrors(aimErrorsOut);
    const deg = (r: number) => ((r * 180) / Math.PI).toFixed(2);
    console.log("[airblox]", {
      reticleNdc: { x: reticleState.x_ndc.toFixed(3), y: reticleState.y_ndc.toFixed(3) },
      aimErrorsDeg: { yaw: deg(aimErrorsOut.yawErrorRad), pitch: deg(aimErrorsOut.pitchErrorRad) },
      leadNdc: leadX_ndc !== undefined && leadY_ndc !== undefined ? { x: leadX_ndc.toFixed(3), y: leadY_ndc.toFixed(3) } : null
    });
  }

  // === КАМЕРА ТРЕТЬЕГО ЛИЦА ===
  desiredPos.copy(airplane.position).add(cameraOffset);
  camera.position.lerp(desiredPos, 0.1);
  camera.lookAt(airplane.position);

  updateAimOverlay(reticleState.x_ndc, reticleState.y_ndc, leadX_ndc, leadY_ndc);

  // === ДВИЖЕНИЕ ОБЛАКОВ ===
  for (let i = 0; i < clouds.length; i++) {
    const obj = clouds[i];
    obj.position.z += 0.05;

    if (obj.position.z > level.worldSize) {
      obj.position.z = -level.worldSize;
      obj.position.x = (Math.random() - 0.5) * level.worldSize * 2;
      obj.position.y =
        level.cloudHeightMin +
        Math.random() * (level.cloudHeightMax - level.cloudHeightMin);
    }
  }

  renderer.render(scene, camera);
}

loop();



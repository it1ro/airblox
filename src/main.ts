import * as THREE from "three";
import { createScene } from "./scene";
import { createAirplane } from "./airplane";
import { createControls } from "./controls";
import { LIGHT_FIGHTER } from "./airplanes";
import { AudioManager } from "./audio";

// === HDR LOADER ===
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

const { scene, camera, renderer, clouds, level } = createScene();
const airplane = createAirplane();
scene.add(airplane);

const controls = createControls(airplane, LIGHT_FIGHTER, scene, camera);

const cameraOffset = new THREE.Vector3(0, 3, -8);
const desiredPos = new THREE.Vector3();

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

  // === ОБНОВЛЕНИЕ УПРАВЛЕНИЯ ===
  controls.update();

  // === КАМЕРА ТРЕТЬЕГО ЛИЦА ===
  desiredPos.copy(airplane.position).add(cameraOffset);
  camera.position.lerp(desiredPos, 0.1);
  camera.lookAt(airplane.position);

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



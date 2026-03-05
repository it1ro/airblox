import * as THREE from "three";
import { createScene } from "./scene";
import { createAirplane } from "./airplane";
import { createControls } from "./controls";
import { LIGHT_FIGHTER } from "./airplanes";
import { AudioManager } from "./audio";

// === HDR LOADER ===
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

const { scene, camera, renderer } = createScene();
const airplane = createAirplane();
scene.add(airplane);

const controls = createControls(airplane, LIGHT_FIGHTER, scene, camera);

AudioManager.init();

// === HDR ENVIRONMENT ===
new RGBELoader().load("/hdr/sky.hdr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.physicallyCorrectLights = true;

  scene.environment = texture;   // освещение
  scene.background = texture;    // фон
});

function loop() {
  requestAnimationFrame(loop);

  // === ОБНОВЛЕНИЕ УПРАВЛЕНИЯ ===
  controls.update();

  // === КАМЕРА ТРЕТЬЕГО ЛИЦА ===
  const desiredPos = airplane.position.clone().add(new THREE.Vector3(0, 3, -8));
  camera.position.lerp(desiredPos, 0.1);
  camera.lookAt(airplane.position);

  // === ДВИЖЕНИЕ ОБЛАКОВ ===
  scene.children.forEach(obj => {
    if (obj.userData.cloud) {
      obj.position.z += 0.05;

      if (obj.position.z > 150) {
        obj.position.z = -150;
        obj.position.x = (Math.random() - 0.5) * 300;
        obj.position.y = 5 + Math.random() * 15;
      }
    }
  });

  renderer.render(scene, camera);
}

loop();



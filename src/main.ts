import * as THREE from "three";
import { createScene } from "./scene";
import { createAirplane } from "./airplane";
import { createControls } from "./controls";

const { scene, camera, renderer } = createScene();
const airplane = createAirplane();
scene.add(airplane);

const controls = createControls(airplane);

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

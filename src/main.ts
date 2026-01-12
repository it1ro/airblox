import { createScene } from "./scene";
import { createAirplane } from "./airplane";
import { createControls } from "./controls";

const { scene, camera, renderer } = createScene();
const airplane = createAirplane();
scene.add(airplane);

const controls = createControls(airplane);

function loop() {
  requestAnimationFrame(loop);

  controls.update();
  camera.position.lerp(
    airplane.position.clone().add(new THREE.Vector3(0, 3, -8)),
    0.1
  );
  camera.lookAt(airplane.position);

  renderer.render(scene, camera);
}

loop();

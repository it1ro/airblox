import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const DEFAULT_MODEL_URL = "/fighters/supermarine_spitfire.glb";
const DEFAULT_TARGET_LENGTH_Z = 6; // примерно сопоставимо с прежней воксельной моделью

export function createAirplane() {
  const plane = new THREE.Group();

  // Видимый плейсхолдер на время загрузки (однократно, не в hot path).
  const placeholderGeometry = new THREE.BoxGeometry(1.2, 0.35, 2.2);
  const placeholderMaterial = new THREE.MeshStandardMaterial({
    color: 0x5566aa,
    roughness: 0.8,
    metalness: 0.05,
    wireframe: true,
  });
  const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
  plane.add(placeholder);

  const loader = new GLTFLoader();
  loader.load(
    DEFAULT_MODEL_URL,
    (gltf) => {
      // Снимаем плейсхолдер и освобождаем ресурсы.
      plane.remove(placeholder);
      placeholderGeometry.dispose();
      placeholderMaterial.dispose();

      const model = gltf.scene;

      // Часто glTF модели ориентированы "носом" в -Z; для нашей физики нос должен смотреть в +Z.
      model.rotation.y = Math.PI;

      // Подгоняем масштаб под ожидаемую длину по Z.
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      if (size.z > 1e-6) {
        const s = DEFAULT_TARGET_LENGTH_Z / size.z;
        model.scale.setScalar(s);
      }

      // Центруем пивот модели в (0,0,0) группы и ставим "на землю" по Y.
      box.setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center);
      box.setFromObject(model);
      if (box.min.y < 0) {
        model.position.y -= box.min.y;
      }

      plane.add(model);
    },
    undefined,
    (error) => {
      console.error("Ошибка загрузки модели самолёта:", error);
    }
  );

  plane.position.set(0, 2, 0);

  return plane;
}

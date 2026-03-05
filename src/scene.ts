import * as THREE from "three";
import { LEVELS } from "./levels";
import { generateLevel } from "./level-generator";

export function createScene() {
  const scene = new THREE.Scene();

  // === КАМЕРА ===
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 3, -8);

  // === СВЕТ ===
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 20, 10);
  scene.add(light);

  // === ВЫБОР УРОВНЯ ===
  const level = LEVELS[0]; // Tropical Isles (или любой другой)
  generateLevel(scene, level);

  // === РЕНДЕРЕР ===
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // === РЕСАЙЗ ===
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}


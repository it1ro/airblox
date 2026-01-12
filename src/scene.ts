import * as THREE from "three";
import { createCloud } from "./clouds";
import { createIsland } from "./islands";

export function createScene() {
  const scene = new THREE.Scene();

  // === ГРАДИЕНТНОЕ НЕБО ===
  const skyGeo = new THREE.SphereGeometry(1000, 32, 32);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color(0x87ceeb) },
      bottomColor: { value: new THREE.Color(0xffffff) }
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      void main() {
        float h = normalize(vPos).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
      }
    `
  });

  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

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

  // === ОКЕАН ===
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshStandardMaterial({ color: 0x3366aa })
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -3;
  scene.add(ocean);

  // === ОБЛАКА ===
  for (let i = 0; i < 40; i++) {
    scene.add(createCloud());
  }

  // === ОСТРОВА ===
  for (let i = 0; i < 12; i++) {
    scene.add(createIsland());
  }

  // === РЕНДЕРЕР ===
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}

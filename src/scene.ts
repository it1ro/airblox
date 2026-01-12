import * as THREE from "three";

export function createScene() {
  const scene = new THREE.Scene();

  // Градиентное небо
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

  // Камера
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 3, -8);

  // Свет
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 20, 10);
  scene.add(light);

  // Рендерер
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

import * as THREE from "three";

export function createAirplane() {
  const plane = new THREE.Group();

  // === ФЮЗЕЛЯЖ (длинный, как у Sea Fury) ===
  const fuselage = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.6, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x5566aa })
  );
  fuselage.position.set(0, 0, 0);
  plane.add(fuselage);

  // === КАБИНА ===
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.4, 0.9),
    new THREE.MeshStandardMaterial({
      color: 0x88aaff,
      transparent: true,
      opacity: 0.7
    })
  );
  canopy.position.set(0, 0.35, 0.3);
  plane.add(canopy);

  // === КРЫЛЬЯ (широкие, слегка сужающиеся) ===
  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.15, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x334488 })
  );
  wing.position.set(0, -0.1, 0.2);
  plane.add(wing);

  // === ХВОСТОВОЕ ОПЕРЕНИЕ ===
  const tailWing = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.12, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x334488 })
  );
  tailWing.position.set(0, 0, -2.1);
  plane.add(tailWing);

  const tailFin = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.8, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x334488 })
  );
  tailFin.position.set(0, 0.4, -2.2);
  plane.add(tailFin);

  // === ПРОПЕЛЛЕР ===
  const propellerGroup = new THREE.Group();
  propellerGroup.position.set(0, 0, 2.3);

  const bladeGeo = new THREE.BoxGeometry(0.1, 1.2, 0.15);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.rotation.z = (Math.PI * 3 * i) / 3;
    propellerGroup.add(blade);
  }

  plane.add(propellerGroup);

  // === ДЛЯ КОНТРОЛОВ ===
  plane.userData.propeller = propellerGroup;

  // === ПОЗИЦИЯ САМОЛЁТА В МИРЕ ===
  plane.position.set(0, 2, 0);

  return plane;
}



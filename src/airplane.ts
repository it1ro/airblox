import * as THREE from "three";

export function createAirplane() {
  const plane = new THREE.Group();

  // === ФЮЗЕЛЯЖ (3 сегмента для taper-эффекта) ===
  const fuselage = new THREE.Group();

  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.55, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x5566aa, roughness: 0.7, metalness: 0.1 })
  );
  nose.position.z = 1.6;

  const mid = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.6, 2.0),
    new THREE.MeshStandardMaterial({ color: 0x5566aa, roughness: 0.7, metalness: 0.1 })
  );

  const tail = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.5, 1.3),
    new THREE.MeshStandardMaterial({ color: 0x5566aa, roughness: 0.7, metalness: 0.1 })
  );
  tail.position.z = -1.65;

  fuselage.add(nose, mid, tail);
  plane.add(fuselage);

  // === КАБИНА (чуть более каплевидная) ===
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.35, 0.9),
    new THREE.MeshStandardMaterial({
      color: 0x88aaff,
      transparent: true,
      opacity: 0.65
    })
  );
  canopy.position.set(0, 0.38, 0.3);
  canopy.scale.set(1, 1, 0.85);
  plane.add(canopy);

  // === КРЫЛЬЯ (с лёгким диэдром + taper) ===
  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.15, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x334488 })
  );
  wing.position.set(0, -0.1, 0.2);
  wing.rotation.z = THREE.MathUtils.degToRad(4); // диэдр
  wing.scale.z = 0.9; // лёгкое сужение
  plane.add(wing);

  // === ХВОСТОВОЕ ОПЕРЕНИЕ ===
  const tailWing = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.12, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x334488 })
  );
  tailWing.position.set(0, 0.05, -2.2);
  tailWing.rotation.z = THREE.MathUtils.degToRad(2);
  plane.add(tailWing);

  const tailFin = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.75, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x334488 })
  );
  tailFin.position.set(0, 0.45, -2.25);
  plane.add(tailFin);

  // === ПРОПЕЛЛЕР (ступица + лопасти) ===
  const propellerGroup = new THREE.Group();
  propellerGroup.position.set(0, -0.18, 2.9);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.25, 0.25, 12),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  hub.rotation.x = Math.PI / 2;
  propellerGroup.add(hub);

  const bladeGeo = new THREE.BoxGeometry(0.1, 1.2, 0.15);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.rotation.z = (Math.PI * 2 * i) / 3;
    propellerGroup.add(blade);
  }

  plane.add(propellerGroup);
  plane.userData.propeller = propellerGroup;

  // === ПОЗИЦИЯ В МИРЕ ===
  plane.position.set(0, 2, 0);

  return plane;
}


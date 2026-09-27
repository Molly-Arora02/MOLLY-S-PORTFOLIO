import * as THREE from 'three';

export default class ServerRig {
  constructor(scene, position = new THREE.Vector3(-1.75, 0, 0.4)) {
    this.scene = scene;
    this.position = position;
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.fans = [];
    this.time = 0;

    this.buildPCStand();
    this.buildChassis();
    this.buildInternalHardware();

    this.scene.add(this.group);
  }

  buildPCStand() {
    // Solid Oak/Walnut floor riser stand to keep the PC off the floor (realistic setup!)
    const standGeo = new THREE.BoxGeometry(0.52, 0.05, 0.74);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0xc49a6c,
      roughness: 0.4,
      metalness: 0.1
    });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.y = 0.025;
    stand.castShadow = true;
    stand.receiveShadow = true;
    this.group.add(stand);

    // 4 small rubber feet on the stand
    const feetMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
    [
      [-0.22, -0.32], [0.22, -0.32],
      [-0.22, 0.32], [0.22, 0.32]
    ].forEach(([fx, fz]) => {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 12), feetMat);
      foot.position.set(fx, 0.01, fz);
      this.group.add(foot);
    });
  }

  buildChassis() {
    // Modern Matte Charcoal Tower (Fractal North / NZXT style)
    const frameGeo = new THREE.BoxGeometry(0.44, 0.82, 0.66);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.4,
      roughness: 0.35
    });
    const chassis = new THREE.Mesh(frameGeo, frameMat);
    chassis.position.y = 0.46;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    this.group.add(chassis);

    // Front Panel with vertical wood accents (Fractal North signature realistic look)
    const frontWoodMat = new THREE.MeshStandardMaterial({
      color: 0xb48250,
      roughness: 0.5,
      metalness: 0.05
    });
    for (let s = -4; s <= 4; s++) {
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.76, 0.015),
        frontWoodMat
      );
      slat.position.set(s * 0.042, 0.46, 0.338);
      this.group.add(slat);
    }

    // Power Button on top front
    const pwrBtn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.01, 16),
      new THREE.MeshStandardMaterial({ color: 0xe5e7eb, metalness: 0.9 })
    );
    pwrBtn.position.set(0.14, 0.875, 0.28);
    this.group.add(pwrBtn);

    // Power LED indicator
    const pwrLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.004, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    pwrLed.position.set(0.17, 0.875, 0.28);
    this.group.add(pwrLed);

    // Tempered Smoked Glass Side Panel (Facing the room)
    const glassGeo = new THREE.PlaneGeometry(0.62, 0.78);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x111827,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.8,
      transparent: true,
      opacity: 0.65
    });
    const glassPanel = new THREE.Mesh(glassGeo, glassMat);
    glassPanel.rotation.y = Math.PI / 2;
    glassPanel.position.set(0.222, 0.46, 0);
    this.group.add(glassPanel);
  }

  buildInternalHardware() {
    // Motherboard Tray (Matte Black PCB)
    const moboGeo = new THREE.BoxGeometry(0.02, 0.62, 0.5);
    const moboMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 });
    const mobo = new THREE.Mesh(moboGeo, moboMat);
    mobo.position.set(-0.14, 0.48, -0.02);
    this.group.add(mobo);

    // RTX 4090 GPU (Dual-slot card with illuminated GeForce logo)
    const gpuGroup = new THREE.Group();
    gpuGroup.position.set(0.02, 0.4, 0);

    const gpuMain = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.08, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.7, roughness: 0.3 })
    );
    gpuGroup.add(gpuMain);

    // GPU Backplate & Illuminated Logo
    const gpuLogo = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.025, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.6 })
    );
    gpuLogo.position.set(0.125, 0.01, 0);
    gpuGroup.add(gpuLogo);

    this.group.add(gpuGroup);

    // CPU AIO Liquid Cooler Pump Block with soft illuminated ring
    const cpuPump = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.035, 20),
      new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.2 })
    );
    cpuPump.rotation.z = Math.PI / 2;
    cpuPump.position.set(-0.1, 0.58, -0.05);
    this.group.add(cpuPump);

    const aioRing = new THREE.Mesh(
      new THREE.RingGeometry(0.03, 0.04, 20),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    aioRing.rotation.y = Math.PI / 2;
    aioRing.position.set(-0.08, 0.58, -0.05);
    this.group.add(aioRing);

    // 2 Braided Liquid Cooling Tubes curving gracefully to top radiator
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
    for (let t = 0; t < 2; t++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.08, 0.58 + t * 0.02, -0.05),
        new THREE.Vector3(-0.02, 0.68 + t * 0.02, -0.08),
        new THREE.Vector3(0.05, 0.78, -0.12 + t * 0.04)
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.01, 8, false);
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      this.group.add(tube);
    }

    // Top Radiator
    const rad = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.035, 0.44),
      new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.8 })
    );
    rad.position.set(0, 0.81, 0);
    this.group.add(rad);

    // 2 Front Case Fans (Soft clean white/warm illumination)
    const fanGeo = new THREE.RingGeometry(0.05, 0.08, 16);
    const fanMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 2; i++) {
      const fan = new THREE.Mesh(fanGeo, fanMat);
      fan.position.set(0, 0.32 + i * 0.26, 0.32);
      this.group.add(fan);
      this.fans.push(fan);
    }

    // Soft warm interior accent light
    const pcInteriorLight = new THREE.PointLight(0xbae6fd, 0.8, 1.8);
    pcInteriorLight.position.set(0.05, 0.52, 0);
    this.group.add(pcInteriorLight);
  }

  update(delta) {
    this.time += delta;
    this.fans.forEach(fan => {
      fan.rotation.z += delta * 4;
    });
  }
}

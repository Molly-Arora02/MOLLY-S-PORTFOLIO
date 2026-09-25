import * as THREE from 'three';

export default class ServerRig {
  constructor(scene, position = new THREE.Vector3(-1.75, 0, 0.4)) {
    this.scene = scene;
    this.position = position;
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.fans = [];
    this.hologramCore = null;
    this.time = 0;

    this.buildChassis();
    this.buildInternalHardware();
    this.buildHologramCore();

    this.scene.add(this.group);
  }

  buildChassis() {
    // Chassis Frame (Dark Anodized Aluminum)
    const frameGeo = new THREE.BoxGeometry(0.48, 0.9, 0.72);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.9,
      roughness: 0.2
    });
    const chassis = new THREE.Mesh(frameGeo, frameMat);
    chassis.position.y = 0.45;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    this.group.add(chassis);

    // Tempered Smoked Glass Side Panel
    const glassGeo = new THREE.PlaneGeometry(0.7, 0.86);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x030712,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.75,
      transparent: true,
      opacity: 0.7
    });
    const glassPanel = new THREE.Mesh(glassGeo, glassMat);
    glassPanel.rotation.y = Math.PI / 2;
    glassPanel.position.set(0.245, 0.45, 0);
    this.group.add(glassPanel);

    // Neon Edge Trim Strip
    const trimGeo = new THREE.BoxGeometry(0.02, 0.88, 0.02);
    const trimMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
    const trim1 = new THREE.Mesh(trimGeo, trimMat);
    trim1.position.set(0.245, 0.45, 0.35);
    this.group.add(trim1);

    const trim2 = new THREE.Mesh(trimGeo, trimMat);
    trim2.position.set(0.245, 0.45, -0.35);
    this.group.add(trim2);
  }

  buildInternalHardware() {
    // Motherboard
    const moboGeo = new THREE.BoxGeometry(0.02, 0.7, 0.55);
    const moboMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
    const mobo = new THREE.Mesh(moboGeo, moboMat);
    mobo.position.set(-0.15, 0.48, 0);
    this.group.add(mobo);

    // 4 High-End AI Tensor GPUs
    const gpuGeo = new THREE.BoxGeometry(0.28, 0.06, 0.38);
    const gpuMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const gpuRgbMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });

    for (let i = 0; i < 3; i++) {
      const gpu = new THREE.Mesh(gpuGeo, gpuMat);
      gpu.position.set(0.02, 0.32 + i * 0.14, -0.05);
      this.group.add(gpu);

      // Glowing RGB Logo Stripe on GPU
      const stripeGeo = new THREE.BoxGeometry(0.01, 0.02, 0.32);
      const stripe = new THREE.Mesh(stripeGeo, gpuRgbMat);
      stripe.position.set(0.165, 0.32 + i * 0.14, -0.05);
      this.group.add(stripe);
    }

    // 3 Glowing Intake Fans on Front
    const fanGeo = new THREE.RingGeometry(0.06, 0.09, 16);
    const fanMat = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 3; i++) {
      const fan = new THREE.Mesh(fanGeo, fanMat);
      fan.position.set(0, 0.25 + i * 0.24, 0.365);
      this.group.add(fan);
      this.fans.push(fan);
    }

    // Glowing Liquid Cooling Reservoir & Tube
    const resGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 16);
    const resMat = new THREE.MeshStandardMaterial({
      color: 0x00f5ff,
      emissive: 0x00f5ff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const reservoir = new THREE.Mesh(resGeo, resMat);
    reservoir.position.set(0.1, 0.5, 0.18);
    this.group.add(reservoir);

    // Light casting from inside rig
    const internalLight = new THREE.PointLight(0x00f5ff, 1.5, 2.5);
    internalLight.position.set(0.05, 0.45, 0);
    this.group.add(internalLight);
  }

  buildHologramCore() {
    // Floating Hologram Platform Base on top of Server
    const ringBaseGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.03, 24);
    const ringBaseMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.2 });
    const ringBase = new THREE.Mesh(ringBaseGeo, ringBaseMat);
    ringBase.position.set(0, 0.915, 0);
    this.group.add(ringBase);

    // Glowing Emitter Ring
    const emitterGeo = new THREE.RingGeometry(0.08, 0.13, 24);
    const emitterMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, side: THREE.DoubleSide });
    const emitter = new THREE.Mesh(emitterGeo, emitterMat);
    emitter.rotation.x = -Math.PI / 2;
    emitter.position.set(0, 0.932, 0);
    this.group.add(emitter);

    // Floating Hologram Neural Core (Icosahedron Wireframe + Nodes)
    this.hologramGroup = new THREE.Group();
    this.hologramGroup.position.set(0, 1.15, 0);

    const coreGeo = new THREE.IcosahedronGeometry(0.12, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.hologramGroup.add(this.coreMesh);

    // Inner pulsing plasma sphere
    const innerGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      transparent: true,
      opacity: 0.75
    });
    this.innerMesh = new THREE.Mesh(innerGeo, innerMat);
    this.hologramGroup.add(this.innerMesh);

    // Outer orbital rings
    const orbitGeo = new THREE.TorusGeometry(0.16, 0.005, 8, 32);
    const orbitMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    this.orbitRing1 = new THREE.Mesh(orbitGeo, orbitMat);
    this.hologramGroup.add(this.orbitRing1);

    this.orbitRing2 = new THREE.Mesh(orbitGeo, orbitMat);
    this.orbitRing2.rotation.x = Math.PI / 2;
    this.hologramGroup.add(this.orbitRing2);

    this.group.add(this.hologramGroup);
  }

  update(delta) {
    this.time += delta;

    // Rotate fans
    this.fans.forEach(fan => {
      fan.rotation.z += delta * 6;
    });

    // Animate Hologram Core
    if (this.hologramGroup) {
      this.hologramGroup.position.y = 1.15 + Math.sin(this.time * 2) * 0.03;
      this.coreMesh.rotation.y += delta * 0.8;
      this.coreMesh.rotation.x += delta * 0.5;

      this.orbitRing1.rotation.y -= delta * 1.2;
      this.orbitRing1.rotation.z += delta * 0.6;

      this.orbitRing2.rotation.x += delta * 1.0;
      this.orbitRing2.rotation.y += delta * 0.7;

      const scale = 1 + Math.sin(this.time * 4) * 0.1;
      this.innerMesh.scale.set(scale, scale, scale);
    }
  }
}

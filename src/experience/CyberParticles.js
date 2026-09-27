import * as THREE from 'three';

/**
 * Realistic sunlight dust motes drifting gently through the window sunbeam
 */
export default class CyberParticles {
  constructor(scene, count = 120) {
    this.scene = scene;
    this.count = count;

    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.speeds = [];

    // Warm golden daylight dust motes palette
    const warmMoteColor = new THREE.Color(0xfff7ed); // Warm ivory/golden sunbeam
    const sunbeamGold = new THREE.Color(0xfde68a);   // Soft sunlight gold

    for (let i = 0; i < count; i++) {
      // Cluster more particles near the window sunbeam path (x: 0 to 3.5, z: -3 to 1)
      positions[i * 3] = 0.5 + (Math.random() - 0.5) * 5.0;
      positions[i * 3 + 1] = 0.4 + Math.random() * 3.4;
      positions[i * 3 + 2] = -1.0 + (Math.random() - 0.5) * 4.5;

      const col = Math.random() > 0.4 ? warmMoteColor : sunbeamGold;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      this.speeds.push({
        y: (Math.random() - 0.45) * 0.08, // slow gentle drift up/down
        x: (Math.random() - 0.5) * 0.05,
        z: (Math.random() - 0.5) * 0.05,
        phase: Math.random() * Math.PI * 2
      });
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Soft feathered circular particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 250, 240, 0.9)');
    grad.addColorStop(0.3, 'rgba(254, 240, 138, 0.6)');
    grad.addColorStop(0.7, 'rgba(254, 215, 170, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    this.material = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
    this.time = 0;
  }

  update(delta) {
    this.time += delta;
    const positions = this.geometry.attributes.position.array;

    for (let i = 0; i < this.count; i++) {
      const sp = this.speeds[i];
      positions[i * 3 + 1] += Math.sin(this.time * 0.5 + sp.phase) * 0.003 + sp.y * delta * 0.3;
      positions[i * 3] += Math.cos(this.time * 0.4 + sp.phase) * 0.003 + sp.x * delta * 0.2;
      positions[i * 3 + 2] += Math.sin(this.time * 0.6 + sp.phase) * 0.003 + sp.z * delta * 0.2;

      // Wrap around soft bounds
      if (positions[i * 3 + 1] > 3.8) positions[i * 3 + 1] = 0.3;
      if (positions[i * 3 + 1] < 0.2) positions[i * 3 + 1] = 3.6;
    }

    this.geometry.attributes.position.needsUpdate = true;
  }
}

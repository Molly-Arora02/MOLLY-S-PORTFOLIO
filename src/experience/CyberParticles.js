import * as THREE from 'three';

export default class CyberParticles {
  constructor(scene, count = 120) {
    this.scene = scene;
    this.count = count;

    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    this.speeds = [];

    const palette = [
      new THREE.Color(0x00f5ff), // Electric Cyan
      new THREE.Color(0xff007f), // Neon Magenta
      new THREE.Color(0xa855f7), // Neon Violet
      new THREE.Color(0x38bdf8), // Sky Blue
      new THREE.Color(0x00f08a)  // Laser Green
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6.5;
      positions[i * 3 + 1] = 0.2 + Math.random() * 3.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6.5;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      scales[i] = Math.random() * 0.04 + 0.02;

      this.speeds.push({
        y: 0.15 + Math.random() * 0.25,
        x: (Math.random() - 0.5) * 0.08,
        z: (Math.random() - 0.5) * 0.08,
        offset: Math.random() * Math.PI * 2
      });
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle sprite using canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(0, 245, 255, 0.8)');
    grad.addColorStop(0.8, 'rgba(168, 85, 247, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    this.material = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      map: texture,
      transparent: true,
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
      positions[i * 3 + 1] += sp.y * delta;
      positions[i * 3] += Math.sin(this.time + sp.offset) * sp.x * delta;
      positions[i * 3 + 2] += Math.cos(this.time + sp.offset) * sp.z * delta;

      // Wrap around room height
      if (positions[i * 3 + 1] > 4.2) {
        positions[i * 3 + 1] = 0.2;
        positions[i * 3] = (Math.random() - 0.5) * 6.0;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 6.0;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
  }
}

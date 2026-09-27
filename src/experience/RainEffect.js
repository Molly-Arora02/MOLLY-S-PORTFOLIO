import * as THREE from 'three';

export default class RainEffect {
  constructor(scene, windowPos = new THREE.Vector3(2.0, 2.4, -3.38)) {
    this.scene = scene;
    this.windowPos = windowPos;
    this.active = false;
    this.time = 0;

    this.group = new THREE.Group();
    this.buildRainParticles();
    this.buildGlassRainStreaks();
    this.group.visible = false;
    this.scene.add(this.group);
  }

  buildRainParticles() {
    // 3D falling raindrops outside the window area
    const count = 350;
    this.rainCount = count;
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    this.speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Confine rain volume just outside the window: x in [0.7, 3.3], y in [0.5, 4.0], z in [-3.8, -3.42]
      positions[i * 3] = this.windowPos.x + (Math.random() - 0.5) * 2.6;
      positions[i * 3 + 1] = this.windowPos.y + (Math.random() - 0.5) * 2.8;
      positions[i * 3 + 2] = this.windowPos.z - 0.05 - Math.random() * 0.4;
      this.speeds[i] = 4.5 + Math.random() * 3.5;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Stretched vertical raindrop streak texture
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.5, 'rgba(200, 230, 255, 0.6)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(6, 0, 4, 64);

    const texture = new THREE.CanvasTexture(canvas);

    this.material = new THREE.PointsMaterial({
      size: 0.12,
      map: texture,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.group.add(this.points);
  }

  buildGlassRainStreaks() {
    // Canvas-based animated water streaks running down the window glass
    this.glassCanvas = document.createElement('canvas');
    this.glassCanvas.width = 512;
    this.glassCanvas.height = 512;
    this.glassCtx = this.glassCanvas.getContext('2d');

    this.drops = [];
    for (let i = 0; i < 45; i++) {
      this.drops.push({
        x: Math.random() * 512,
        y: Math.random() * 512,
        len: 12 + Math.random() * 25,
        speed: 1.5 + Math.random() * 3.0,
        width: 1.5 + Math.random() * 2.0
      });
    }

    this.glassTexture = new THREE.CanvasTexture(this.glassCanvas);
    const glassMat = new THREE.MeshBasicMaterial({
      map: this.glassTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const glassPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), glassMat);
    glassPlane.position.set(this.windowPos.x, this.windowPos.y, this.windowPos.z + 0.025);
    this.group.add(glassPlane);
  }

  setActive(active) {
    this.active = active;
    this.group.visible = active;
  }

  update(delta) {
    if (!this.active) return;
    this.time += delta;

    // 1. Update 3D Raindrop positions
    const pos = this.geometry.attributes.position.array;
    for (let i = 0; i < this.rainCount; i++) {
      pos[i * 3 + 1] -= this.speeds[i] * delta;
      pos[i * 3] -= 0.6 * delta; // slight wind slant

      if (pos[i * 3 + 1] < this.windowPos.y - 1.4) {
        pos[i * 3 + 1] = this.windowPos.y + 1.4;
        pos[i * 3] = this.windowPos.x + (Math.random() - 0.5) * 2.6;
      }
    }
    this.geometry.attributes.position.needsUpdate = true;

    // 2. Update Water Droplets running down glass canvas
    const ctx = this.glassCtx;
    ctx.clearRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(220, 240, 255, 0.55)';
    ctx.lineCap = 'round';

    this.drops.forEach(d => {
      d.y += d.speed * 60 * delta;
      if (d.y > 512) {
        d.y = -d.len;
        d.x = Math.random() * 512;
      }

      ctx.lineWidth = d.width;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 2, d.y + d.len);
      ctx.stroke();

      // Droplet head bead
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(d.x - 2, d.y + d.len, d.width * 0.9, 0, Math.PI * 2);
      ctx.fill();
    });

    this.glassTexture.needsUpdate = true;
  }
}

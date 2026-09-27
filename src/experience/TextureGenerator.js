import * as THREE from 'three';

/**
 * Procedural texture, normal map, and roughness map generators for hyper-realistic 3D materials
 */
export class TextureGenerator {
  /**
   * Generates a warm Scandinavian Oak parquet / hardwood planks diffuse texture
   */
  static createWoodFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#b89b7b';
    ctx.fillRect(0, 0, 1024, 1024);

    const plankHeight = 64;
    const cols = 4;
    const plankWidth = 1024 / cols;

    const oakColors = [
      '#c4a98b', '#b89a7a', '#bd9f81', '#af8f6e',
      '#c2a787', '#b59574', '#be9e7f', '#a98a69'
    ];

    for (let r = 0; r < 16; r++) {
      const y = r * plankHeight;
      const xOffset = (r % 3) * (plankWidth / 3);

      for (let c = -1; c <= cols + 1; c++) {
        const x = c * plankWidth + xOffset;
        const colorIdx = (r * 7 + c * 13 + (r % 5)) % oakColors.length;
        ctx.fillStyle = oakColors[colorIdx];
        ctx.fillRect(x + 1, y + 1, plankWidth - 2, plankHeight - 2);

        // Fine wood grain lines
        ctx.strokeStyle = 'rgba(75, 48, 22, 0.14)';
        ctx.lineWidth = 1;
        for (let g = 0; g < 6; g++) {
          const gy = y + 4 + g * 10 + (Math.sin(g + r) * 3);
          ctx.beginPath();
          ctx.moveTo(x, gy);
          ctx.bezierCurveTo(
            x + plankWidth * 0.33, gy + (Math.sin(c + g) * 4),
            x + plankWidth * 0.66, gy - (Math.cos(r + g) * 3),
            x + plankWidth, gy
          );
          ctx.stroke();
        }

        // Dark bevel seam
        ctx.strokeStyle = '#3e2c1e';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, plankWidth, plankHeight);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Generates a realistic Tangent-Space Normal Map for the wood floor (provides 3D groove depth)
   */
  static createWoodFloorNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base flat normal vector (128, 128, 255) -> (0, 0, 1) in tangent space
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 512, 512);

    const plankHeight = 32;
    const cols = 4;
    const plankWidth = 512 / cols;

    for (let r = 0; r < 16; r++) {
      const y = r * plankHeight;
      const xOffset = (r % 3) * (plankWidth / 3);

      for (let c = -1; c <= cols + 1; c++) {
        const x = c * plankWidth + xOffset;

        // Bevel normal shading on edges: Top bevel (tilt up), Bottom bevel (tilt down)
        ctx.fillStyle = 'rgb(128, 200, 230)'; // tilted in Y+
        ctx.fillRect(x, y, plankWidth, 2);

        ctx.fillStyle = 'rgb(128, 55, 230)'; // tilted in Y-
        ctx.fillRect(x, y + plankHeight - 2, plankWidth, 2);

        // Left/Right bevels
        ctx.fillStyle = 'rgb(200, 128, 230)'; // tilted in X+
        ctx.fillRect(x, y, 2, plankHeight);

        ctx.fillStyle = 'rgb(55, 128, 230)'; // tilted in X-
        ctx.fillRect(x + plankWidth - 2, y, 2, plankHeight);

        // Micro grain ridge normals
        for (let g = 0; g < 4; g++) {
          const gy = y + 6 + g * 7;
          ctx.strokeStyle = g % 2 === 0 ? 'rgb(140, 150, 240)' : 'rgb(116, 106, 240)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 2, gy);
          ctx.lineTo(x + plankWidth - 2, gy);
          ctx.stroke();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Generates a Roughness Map for the wood floor (per-plank specular sheen variation)
   */
  static createWoodFloorRoughnessMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const plankHeight = 32;
    const cols = 4;
    const plankWidth = 512 / cols;

    for (let r = 0; r < 16; r++) {
      const y = r * plankHeight;
      const xOffset = (r % 3) * (plankWidth / 3);

      for (let c = -1; c <= cols + 1; c++) {
        const x = c * plankWidth + xOffset;
        const val = 70 + ((r * 11 + c * 17) % 45); // Varying roughness between 0.28 and 0.45
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(x, y, plankWidth, plankHeight);

        // Darker in seams
        ctx.fillStyle = 'rgb(180, 180, 180)';
        ctx.strokeRect(x, y, plankWidth, plankHeight);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Generates solid walnut/oak grain texture for furniture
   */
  static createFurnitureWoodTexture(isWalnut = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const baseColor = isWalnut ? '#452f1e' : '#c29766';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    const grainColor = isWalnut ? 'rgba(25, 14, 8, 0.38)' : 'rgba(110, 68, 30, 0.28)';
    ctx.strokeStyle = grainColor;
    
    for (let i = 0; i < 60; i++) {
      const y = i * 9;
      ctx.lineWidth = 1 + (i % 3) * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(
        150, y + Math.sin(i * 0.4) * 12,
        350, y - Math.cos(i * 0.3) * 10,
        512, y + Math.sin(i * 0.2) * 8
      );
      ctx.stroke();
    }

    for (let n = 0; n < 250; n++) {
      const nx = Math.random() * 512;
      const ny = Math.random() * 512;
      ctx.fillStyle = isWalnut ? 'rgba(20, 10, 5, 0.15)' : 'rgba(80, 45, 20, 0.1)';
      ctx.fillRect(nx, ny, Math.random() * 15 + 5, 1.5);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Normal Map for wood tabletop
   */
  static createWoodNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 40; i++) {
      const y = i * 6.5;
      ctx.strokeStyle = i % 2 === 0 ? 'rgb(136, 145, 245)' : 'rgb(120, 110, 245)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(70, y + Math.sin(i) * 5, 180, y - Math.cos(i) * 4, 256, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Generates a cozy textured Nordic woven area rug texture
   */
  static createWovenRugTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e5dfd2';
    ctx.fillRect(0, 0, 512, 512);

    // Nordic geometric lines
    ctx.strokeStyle = 'rgba(60, 75, 95, 0.4)';
    ctx.lineWidth = 5;

    const step = 64;
    for (let x = -512; x < 1024; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 512, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, 512);
      ctx.lineTo(x + 512, 0);
      ctx.stroke();
    }

    // Fiber weave stippling
    for (let i = 0; i < 5000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillStyle = (i % 2 === 0) ? 'rgba(255, 255, 255, 0.45)' : 'rgba(80, 70, 60, 0.22)';
      ctx.fillRect(rx, ry, 2, 2);
    }

    // Border trim
    ctx.strokeStyle = '#baa993';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, 496, 496);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Normal Map for fabric/carpet weave (tactile micro fiber depth)
   */
  static createFabricNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 128, 128);

    for (let x = 0; x < 128; x += 4) {
      for (let y = 0; y < 128; y += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillStyle = 'rgb(142, 142, 240)';
        } else {
          ctx.fillStyle = 'rgb(114, 114, 240)';
        }
        ctx.fillRect(x, y, 3, 3);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
  }

  /**
   * Normal map for realistic wall plaster stipple
   */
  static createWallPlasterNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 3000; i++) {
      const rx = Math.random() * 256;
      const ry = Math.random() * 256;
      const col = (i % 2 === 0) ? 'rgb(138, 138, 248)' : 'rgb(118, 118, 248)';
      ctx.fillStyle = col;
      ctx.fillRect(rx, ry, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  /**
   * Generates realistic outdoor sky & scenery for different times of day & weather
   */
  static createWindowViewTexture(mode = 'day') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    if (mode === 'morning') {
      // Crisp Morning Sunrise: Azure to soft peach and golden dawn
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.35, '#93c5fd');
      skyGrad.addColorStop(0.65, '#fed7aa');
      skyGrad.addColorStop(0.85, '#fde68a');
      skyGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Soft rising sun glow
      const sunGlow = ctx.createRadialGradient(380, 520, 20, 380, 520, 320);
      sunGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      sunGlow.addColorStop(0.3, 'rgba(254, 215, 170, 0.6)');
      sunGlow.addColorStop(0.7, 'rgba(254, 215, 170, 0.2)');
      sunGlow.addColorStop(1, 'rgba(254, 215, 170, 0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, 1024, 800);

    } else if (mode === 'evening') {
      // Golden Hour Sunset: Twilight indigo, rich magenta, warm amber
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      skyGrad.addColorStop(0, '#1e1b4b');
      skyGrad.addColorStop(0.3, '#581c87');
      skyGrad.addColorStop(0.6, '#c026d3');
      skyGrad.addColorStop(0.8, '#ea580c');
      skyGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Low setting sun
      const sunGlow = ctx.createRadialGradient(580, 600, 20, 580, 600, 340);
      sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      sunGlow.addColorStop(0.35, 'rgba(249, 115, 22, 0.7)');
      sunGlow.addColorStop(0.8, 'rgba(234, 88, 12, 0.2)');
      sunGlow.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, 1024, 800);

    } else if (mode === 'night') {
      // Midnight Sky with subtle stellar nebula gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.5, '#0b1120');
      skyGrad.addColorStop(0.85, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Crisp realistic stars
      for (let s = 0; s < 140; s++) {
        const sx = (s * 97) % 1024;
        const sy = (s * 61) % 560;
        const sr = (s % 5 === 0) ? 2.0 : (s % 3 === 0 ? 1.4 : 0.8);
        const alpha = 0.4 + (s % 7) * 0.08;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Elegant Crescent Moon with soft lunar halo
      const moonGlow = ctx.createRadialGradient(760, 200, 10, 760, 200, 120);
      moonGlow.addColorStop(0, 'rgba(224, 242, 254, 0.8)');
      moonGlow.addColorStop(0.4, 'rgba(224, 242, 254, 0.25)');
      moonGlow.addColorStop(1, 'rgba(224, 242, 254, 0)');
      ctx.fillStyle = moonGlow;
      ctx.fillRect(600, 50, 320, 300);

      // Moon body
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(760, 200, 38, 0, Math.PI * 2);
      ctx.fill();

      // Shadow mask to form crisp crescent
      ctx.fillStyle = '#0a101f';
      ctx.beginPath();
      ctx.arc(748, 192, 34, 0, Math.PI * 2);
      ctx.fill();

    } else if (mode === 'rain') {
      // Overcast moody rainy atmosphere
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      skyGrad.addColorStop(0, '#1e293b');
      skyGrad.addColorStop(0.4, '#334155');
      skyGrad.addColorStop(0.7, '#475569');
      skyGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Subtle atmospheric rain haze gradient across horizon
      const hazeGrad = ctx.createLinearGradient(0, 400, 0, 800);
      hazeGrad.addColorStop(0, 'rgba(148, 163, 184, 0)');
      hazeGrad.addColorStop(0.5, 'rgba(148, 163, 184, 0.25)');
      hazeGrad.addColorStop(1, 'rgba(100, 116, 139, 0.4)');
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, 400, 1024, 400);

    } else {
      // Day (Crisp Blue Sky & Radiant Sunlight)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.4, '#38bdf8');
      skyGrad.addColorStop(0.75, '#bae6fd');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Radiant Sun
      const sunGlow = ctx.createRadialGradient(320, 240, 25, 320, 240, 280);
      sunGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
      sunGlow.addColorStop(0.25, 'rgba(254, 240, 138, 0.7)');
      sunGlow.addColorStop(0.6, 'rgba(253, 224, 71, 0.25)');
      sunGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, 1024, 600);
    }

    // Distant Modern City Skyline Silhouettes
    const skylineColor = (mode === 'night') ? '#070b14' : (mode === 'evening' ? '#2e1065' : (mode === 'rain' ? '#1e293b' : '#334155'));
    ctx.fillStyle = skylineColor;

    // High-rise buildings
    const buildings = [
      { x: 140, y: 520, w: 90, h: 280 },
      { x: 250, y: 460, w: 110, h: 340 },
      { x: 380, y: 500, w: 85, h: 300 },
      { x: 490, y: 420, w: 130, h: 380 },
      { x: 640, y: 480, w: 100, h: 320 },
      { x: 760, y: 530, w: 90, h: 270 },
      { x: 870, y: 560, w: 80, h: 240 }
    ];

    buildings.forEach(b => {
      ctx.fillRect(b.x, b.y, b.w, b.h);
      // Spire on tall center tower
      if (b.w === 130) {
        ctx.fillRect(b.x + 60, b.y - 45, 10, 45);
      }
    });

    // Illuminated windows on skyscrapers (especially bright at night / evening)
    if (mode === 'night' || mode === 'evening' || mode === 'rain') {
      buildings.forEach((b, bIdx) => {
        const cols = Math.floor(b.w / 18);
        const rows = Math.floor((b.h - 40) / 22);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if ((bIdx * 7 + r * 5 + c * 3) % 4 !== 0) {
              const isAmber = (bIdx + r + c) % 3 === 0;
              ctx.fillStyle = isAmber ? 'rgba(254, 240, 138, 0.85)' : 'rgba(56, 189, 248, 0.75)';
              ctx.fillRect(b.x + 10 + c * 18, b.y + 20 + r * 22, 8, 12);
            }
          }
        }
      });
    }

    // Mid-ground & Foreground Lush Park Ridge
    const ridgeColor1 = (mode === 'night') ? '#021c0c' : (mode === 'evening' ? '#14532d' : (mode === 'rain' ? '#0f3d2e' : '#15803d'));
    const ridgeColor2 = (mode === 'night') ? '#011207' : (mode === 'evening' ? '#052e16' : (mode === 'rain' ? '#062c21' : '#166534'));

    // Soft organic hill curves
    ctx.fillStyle = ridgeColor1;
    ctx.beginPath();
    ctx.moveTo(0, 720);
    ctx.bezierCurveTo(280, 680, 620, 740, 1024, 700);
    ctx.lineTo(1024, 1024);
    ctx.lineTo(0, 1024);
    ctx.closePath();
    ctx.fill();

    // Foreground lush park canopy line
    ctx.fillStyle = ridgeColor2;
    ctx.beginPath();
    ctx.moveTo(0, 780);
    ctx.bezierCurveTo(340, 760, 720, 800, 1024, 770);
    ctx.lineTo(1024, 1024);
    ctx.lineTo(0, 1024);
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Generates a modern minimalist wall art poster
   */
  static createWallArtTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 700);

    const artGrad = ctx.createLinearGradient(0, 100, 512, 500);
    artGrad.addColorStop(0, '#f97316');
    artGrad.addColorStop(0.5, '#ec4899');
    artGrad.addColorStop(1, '#6366f1');

    ctx.fillStyle = artGrad;
    ctx.beginPath();
    ctx.arc(256, 320, 180, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(256, 320, 100, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(256, 320, 130, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('MOLLY ARORA • STUDIO', 256, 560);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('ARTIFICIAL INTELLIGENCE & CREATIVE TECH', 256, 595);
    ctx.fillText('2026 EDITION — DEV SUMMIT TOP 10', 256, 620);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}

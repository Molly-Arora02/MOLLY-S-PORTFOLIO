import * as THREE from 'three';
import { mollyData } from '../data/mollyData.js';

export default class VisionBoard {
  constructor(experience, position = new THREE.Vector3(0.55, 2.65, -3.36), size = { width: 1.6, height: 1.9 }) {
    this.experience = experience;
    this.scene = experience.scene;
    this.audioManager = experience.audioManager;
    this.position = position;
    this.size = size;

    this.canvas = document.createElement('canvas');
    this.canvas.width = 2400;
    this.canvas.height = 2400;
    this.ctx = this.canvas.getContext('2d');

    // Use items from mollyData
    this.visionItems = mollyData.visionBoard || [];
    this.loadedImages = {};
    
    this.initCanvasTexture();
    this.init3DMesh();
    this.loadAllImages();
  }

  initCanvasTexture() {
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.colorSpace = THREE.SRGBColorSpace;
  }

  loadAllImages() {
    let loadedCount = 0;
    const total = this.visionItems.length;

    // Draw initial base texture right away
    this.drawBoard();

    this.visionItems.forEach(item => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = item.image;
      img.onload = () => {
        this.loadedImages[item.id] = img;
        loadedCount++;
        this.drawBoard();
      };
      img.onerror = () => {
        console.warn(`Failed to load vision image: ${item.image}`);
        loadedCount++;
        this.drawBoard();
      };
    });
  }

  drawBoard() {
    const ctx = this.ctx;
    const w = 2400;
    const h = 2400;

    // 1. Natural Cork / Warm Textured Linen Background
    const corkGrad = ctx.createLinearGradient(0, 0, w, h);
    corkGrad.addColorStop(0, '#26211c');
    corkGrad.addColorStop(0.5, '#201b17');
    corkGrad.addColorStop(1, '#1b1714');
    ctx.fillStyle = corkGrad;
    ctx.fillRect(0, 0, w, h);

    // Fine cork texture speckles
    ctx.fillStyle = 'rgba(217, 119, 6, 0.08)';
    for (let i = 0; i < 3500; i++) {
      const sx = (Math.sin(i * 991) * 0.5 + 0.5) * w;
      const sy = (Math.cos(i * 433) * 0.5 + 0.5) * h;
      ctx.fillRect(sx, sy, 3, 3);
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let i = 0; i < 2200; i++) {
      const sx = (Math.cos(i * 617) * 0.5 + 0.5) * w;
      const sy = (Math.sin(i * 883) * 0.5 + 0.5) * h;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Grid wire / subtle fairy lights pattern
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 80; x < w; x += 180) {
      ctx.moveTo(x, 60);
      ctx.lineTo(x, h - 60);
    }
    for (let y = 180; y < h; y += 180) {
      ctx.moveTo(60, y);
      ctx.lineTo(w - 60, y);
    }
    ctx.stroke();

    // 2. Elegant Header Banner
    ctx.save();
    const bannerGrad = ctx.createLinearGradient(120, 50, w - 120, 170);
    bannerGrad.addColorStop(0, 'rgba(36, 30, 24, 0.96)');
    bannerGrad.addColorStop(0.5, 'rgba(48, 38, 28, 0.98)');
    bannerGrad.addColorStop(1, 'rgba(36, 30, 24, 0.96)');
    ctx.fillStyle = bannerGrad;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(100, 45, w - 200, 140, 20);
    ctx.fill();
    ctx.stroke();

    // Header Title
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 50px "Outfit", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
    ctx.shadowBlur = 18;
    ctx.fillText("✨ MOLLY'S GRAND VISION BOARD • 2026 & BEYOND ✨", w / 2, 108);

    // Header Subtext & Blessings
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 24px "Outfit", sans-serif';
    ctx.fillText("Devotion • Radha Nam Jaap • Seva • Emirates • AI Unicorn • 10M Community • Peace & Radiance", w / 2, 154);
    ctx.restore();

    // 3. Grid Layout for Polaroids (4 Columns x 4 Rows)
    const cols = 4;
    const cardW = 460;
    const cardH = 430;
    const startX = 130;
    const startY = 220;
    const gapX = 110;
    const gapY = 85;

    // Fixed rotation offsets for natural polaroid pinboard look
    const rotations = [
      -0.035, 0.025, -0.02, 0.03,
      0.025, -0.03, 0.035, -0.025,
      -0.03, 0.02, -0.025, 0.03,
      0.02, -0.035, 0.025, -0.02
    ];

    const displayCount = Math.min(16, this.visionItems.length);
    for (let i = 0; i < displayCount; i++) {
      const item = this.visionItems[i];
      const c = i % cols;
      const r = Math.floor(i / cols);
      const px = startX + c * (cardW + gapX);
      const py = startY + r * (cardH + gapY);
      const rot = rotations[i % rotations.length];

      this.drawPolaroid(ctx, {
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        tag: item.tag || 'Manifestation',
        accent: item.accent || '#f59e0b',
        x: px,
        y: py,
        w: cardW,
        h: cardH,
        rot: rot
      });
    }

    // 4. Affirmation Sticky Notes
    this.drawStickyNote(ctx, 100, 2260, 520, 110, -0.02, '#fef08a', '#1c1917', [
      '“Radha Radha Radha Jaap” 🌸',
      'No Ego • No Revenge • No Anger • Pure Seva & Peace'
    ]);

    this.drawStickyNote(ctx, 690, 2260, 500, 110, 0.02, '#bbf7d0', '#1c1917', [
      '✨ God’s Favourite Child ✨',
      'Emirates Business Class • 198 Countries Nomad'
    ]);

    this.drawStickyNote(ctx, 1260, 2260, 500, 110, -0.02, '#fed7aa', '#1c1917', [
      '🚀 Billion $ AI Startup & Apple Kingdom',
      '10M+ Global Community • Pure Love & Pride'
    ]);

    this.drawStickyNote(ctx, 1830, 2260, 470, 110, 0.02, '#fbcfe8', '#1c1917', [
      '❤️ Happy & Proud Parents ❤️',
      'Dream Wardrobe • Dream Sanctuary • Health'
    ]);

    // Update texture
    if (this.texture) {
      this.texture.needsUpdate = true;
    }
  }

  drawPolaroid(ctx, item) {
    const { x, y, w, h, rot, title, subtitle, tag, accent, id } = item;
    const img = this.loadedImages[id];

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rot);

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 12;

    // White / Warm Cream Polaroid Frame
    ctx.fillStyle = '#fbf9f4';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 12);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Image Area
    const pad = 16;
    const imgW = w - pad * 2;
    const imgH = h - 110;
    const imgX = -w / 2 + pad;
    const imgY = -h / 2 + pad;

    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(imgX, imgY, imgW, imgH);

    if (img && img.complete && img.naturalWidth !== 0) {
      // Draw image object-fit: cover
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const targetRatio = imgW / imgH;
      let sx, sy, sw, sh;

      if (imgRatio > targetRatio) {
        sh = img.naturalHeight;
        sw = sh * targetRatio;
        sx = (img.naturalWidth - sw) / 2;
        sy = 0;
      } else {
        sw = img.naturalWidth;
        sh = sw / targetRatio;
        sx = 0;
        sy = (img.naturalHeight - sh) / 2;
      }

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgW, imgH, 8);
      ctx.clip();
      ctx.drawImage(img, sx, sy, sw, sh, imgX, imgY, imgW, imgH);
      ctx.restore();
    } else {
      // Fallback placeholder
      ctx.fillStyle = accent || '#f59e0b';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, 0, imgY + imgH / 2);
    }

    // Category Tag Pill
    ctx.font = 'bold 14px "Outfit", sans-serif';
    const tagWidth = ctx.measureText(tag).width + 20;
    ctx.fillStyle = accent || '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(imgX + 10, imgY + 10, tagWidth, 26, 13);
    ctx.fill();

    ctx.fillStyle = '#111215';
    ctx.textAlign = 'left';
    ctx.fillText(tag, imgX + 20, imgY + 28);

    // Text details below photo
    ctx.textAlign = 'center';
    ctx.fillStyle = '#111215';
    ctx.font = 'bold 20px "Outfit", sans-serif';
    // Truncate long title if needed
    let displayTitle = title;
    if (displayTitle.length > 28) displayTitle = displayTitle.slice(0, 26) + '...';
    ctx.fillText(displayTitle, 0, h / 2 - 50);

    ctx.fillStyle = '#4b5563';
    ctx.font = '500 14px "Outfit", sans-serif';
    let displaySub = subtitle;
    if (displaySub.length > 34) displaySub = displaySub.slice(0, 32) + '...';
    ctx.fillText(displaySub, 0, h / 2 - 24);

    // Metallic Golden Pushpin at top center
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(0, -h / 2 + 8, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(-2, -h / 2 + 6, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4, -h / 2 + 4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawStickyNote(ctx, x, y, w, h, rot, bgColor, textColor, lines) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rot);

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 8;

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 8);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Pushpin
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -h / 2 + 10, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(-2, -h / 2 + 8, 4, 0, Math.PI * 2);
    ctx.fill();

    // Text Lines
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    lines.forEach((line, i) => {
      ctx.font = i === 0 ? 'bold 18px "Outfit", sans-serif' : '500 15px "Outfit", sans-serif';
      ctx.fillText(line, 0, -h / 2 + 44 + i * 32);
    });

    ctx.restore();
  }

  init3DMesh() {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    // Board Surface with Canvas Texture
    const boardGeo = new THREE.PlaneGeometry(this.size.width, this.size.height);
    this.boardMaterial = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.65,
      metalness: 0.05
    });
    this.mesh = new THREE.Mesh(boardGeo, this.boardMaterial);
    this.mesh.userData = { targetView: 'vision', isVisionBoard: true };
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);

    // Solid Luxury Oak Frame
    const frameThickness = 0.07;
    const frameDepth = 0.06;
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x3e2716, // Rich Walnut / Oak
      roughness: 0.4,
      metalness: 0.1
    });

    // Top Bar
    const topBar = new THREE.Mesh(
      new THREE.BoxGeometry(this.size.width + frameThickness * 2, frameThickness, frameDepth),
      frameMat
    );
    topBar.position.set(0, this.size.height / 2 + frameThickness / 2, 0.02);
    topBar.castShadow = true;
    this.group.add(topBar);

    // Bottom Bar
    const btmBar = new THREE.Mesh(
      new THREE.BoxGeometry(this.size.width + frameThickness * 2, frameThickness, frameDepth),
      frameMat
    );
    btmBar.position.set(0, -this.size.height / 2 - frameThickness / 2, 0.02);
    btmBar.castShadow = true;
    this.group.add(btmBar);

    // Left Bar
    const leftBar = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, this.size.height, frameDepth),
      frameMat
    );
    leftBar.position.set(-this.size.width / 2 - frameThickness / 2, 0, 0.02);
    leftBar.castShadow = true;
    this.group.add(leftBar);

    // Right Bar
    const rightBar = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, this.size.height, frameDepth),
      frameMat
    );
    rightBar.position.set(this.size.width / 2 + frameThickness / 2, 0, 0.02);
    rightBar.castShadow = true;
    this.group.add(rightBar);

    // Warm LED Accent Back-Glow / Ambient Spot
    this.accentGlow = new THREE.PointLight(0xfef08a, 1.2, 3.2, 2);
    this.accentGlow.position.set(0, this.size.height / 2 + 0.1, 0.35);
    this.group.add(this.accentGlow);
  }
}

import * as THREE from 'three';

export default class Whiteboard {
  constructor(experience, position = new THREE.Vector3(-3.38, 1.8, 0.4), size = { width: 2.2, height: 1.4 }) {
    this.experience = experience;
    this.scene = experience.scene;
    this.audioManager = experience.audioManager;
    this.position = position;
    this.size = size;

    // High-resolution 2D Canvas for Smart Board rendering
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1600;
    this.canvas.height = 1000;
    this.ctx = this.canvas.getContext('2d');

    this.currentTool = 'pen'; // 'pen', 'highlighter', 'eraser', 'text', 'sticky'
    this.currentColor = '#38bdf8'; // Sky blue
    this.brushSize = 6;
    this.isDrawing = false;
    this.lastPoint = null;

    // Music / Equalizer animation state
    this.isPlayingMusic = false;
    this.musicTrackTitle = 'Lofi Girl • Beats to Relax/Study to';
    this.animTime = 0;

    // Notification toast on HUD
    this.notificationText = '';
    this.notificationTimer = 0;

    // Undo history
    this.history = [];
    this.maxHistory = 12;

    this.autoSaveTimeout = null;

    this.initCanvasTexture();
    this.init3DMesh();
    this.drawInitialContent();
  }

  initCanvasTexture() {
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = true;
    this.texture.colorSpace = THREE.SRGBColorSpace;
  }

  init3DMesh() {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.group.rotation.y = Math.PI / 2; // facing into the room from left wall

    // Smart Board Screen Surface
    const boardGeo = new THREE.PlaneGeometry(this.size.width, this.size.height);
    this.boardMaterial = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.15,
      metalness: 0.05,
      emissive: 0xffffff,
      emissiveMap: this.texture,
      emissiveIntensity: 0.18
    });
    this.mesh = new THREE.Mesh(boardGeo, this.boardMaterial);
    this.mesh.userData = { isWhiteboard: true, targetView: 'whiteboard' };
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);

    // Modern Bezel Frame (Anodized Dark Titanium)
    const frameGeo = new THREE.BoxGeometry(this.size.width + 0.06, this.size.height + 0.06, 0.035);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.85 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.z = -0.018;
    this.group.add(frame);

    // Slim Stylus Pen Dock at bottom
    const dockGeo = new THREE.BoxGeometry(0.35, 0.03, 0.04);
    const dockMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4, metalness: 0.7 });
    const dock = new THREE.Mesh(dockGeo, dockMat);
    dock.position.set(0, -this.size.height / 2 - 0.02, 0.02);
    this.group.add(dock);

    // Smart Stylus Pen
    const penGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.18, 16);
    const penMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const pen = new THREE.Mesh(penGeo, penMat);
    pen.rotation.z = Math.PI / 2;
    pen.position.set(0, -this.size.height / 2 - 0.015, 0.035);
    this.group.add(pen);

    // Camera / Microphone Bar on Top Center
    const micBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.018, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2 })
    );
    micBar.position.set(0, this.size.height / 2 + 0.02, 0.01);
    this.group.add(micBar);

    this.scene.add(this.group);
  }

  saveHistory() {
    if (this.history.length >= this.maxHistory) {
      this.history.shift();
    }
    this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
  }

  undo() {
    if (this.history.length > 0) {
      const prev = this.history.pop();
      this.ctx.putImageData(prev, 0, 0);
      this.texture.needsUpdate = true;
      this.audioManager?.playWhoosh();
      this.autoSave();
      this.showToast('↩️ Action Undone');
    }
  }

  drawInitialContent() {
    // Check if user has saved whiteboard content in localStorage
    if (this.loadFromLocalStorage()) {
      return;
    }

    this.saveHistory();
    // Modern Light Slate / Frosted Glass Canvas
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Subtle Grid Pattern
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 1;
    const gridStep = 50;
    for (let x = 0; x < this.canvas.width; x += gridStep) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += gridStep) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    // Top Smart Board HUD Bar
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    this.ctx.fillRect(0, 0, this.canvas.width, 70);

    // Brand / Status Title
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.font = 'bold 26px "Outfit", sans-serif';
    this.ctx.fillText("✨ MOLLY'S AI SMART BOARD • INTERACTIVE LAB", 30, 45);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '500 16px monospace';
    this.ctx.textAlign = 'right';
    this.ctx.fillText("⚡ Live Stylus • Auto-Save to LocalStorage Active", this.canvas.width - 30, 45);
    this.ctx.textAlign = 'left';

    // Draw initial Neural Network & Brainstorming diagram
    this.drawPreset('neural', false);
  }

  autoSave() {
    clearTimeout(this.autoSaveTimeout);
    this.autoSaveTimeout = setTimeout(() => {
      this.saveToLocalStorage(true);
    }, 600);
  }

  saveToLocalStorage(isSilent = false) {
    try {
      const dataUrl = this.canvas.toDataURL('image/png');
      localStorage.setItem('molly_smartboard_canvas_save', dataUrl);
      localStorage.setItem('molly_smartboard_saved_at', new Date().toLocaleTimeString());
      if (!isSilent) {
        this.showToast('💾 Saved to Local Storage');
        this.audioManager?.playClick();
      }
      return true;
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
      return false;
    }
  }

  loadFromLocalStorage() {
    try {
      const dataUrl = localStorage.getItem('molly_smartboard_canvas_save');
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          this.saveHistory();
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.drawImage(img, 0, 0);
          this.texture.needsUpdate = true;
          this.showToast('📂 Restored from Local Storage');
        };
        img.src = dataUrl;
        return true;
      }
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
    }
    return false;
  }

  exportToDesktop(filename = 'molly_smartboard_brainstorm.png') {
    try {
      const dataUrl = this.canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.audioManager?.playClick();
      this.showToast('📥 Exported PNG to Desktop!');
      return true;
    } catch (e) {
      console.error('Desktop Export failed:', e);
      return false;
    }
  }

  showToast(msg) {
    this.notificationText = msg;
    this.notificationTimer = 3.0; // 3 seconds
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setColor(color) {
    this.currentColor = color;
  }

  startDraw(uvX, uvY) {
    this.saveHistory();
    this.isDrawing = true;
    const x = uvX * this.canvas.width;
    const y = (1 - uvY) * this.canvas.height;
    this.lastPoint = { x, y };
    this.draw(uvX, uvY);
  }

  draw(uvX, uvY) {
    if (!this.isDrawing || !this.lastPoint) return;
    const x = uvX * this.canvas.width;
    const y = (1 - uvY) * this.canvas.height;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
    this.ctx.lineTo(x, y);

    if (this.currentTool === 'eraser' || this.currentColor === 'eraser') {
      this.ctx.strokeStyle = '#f8fafc';
      this.ctx.lineWidth = this.brushSize * 5;
      this.ctx.globalAlpha = 1.0;
    } else if (this.currentTool === 'highlighter') {
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.lineWidth = this.brushSize * 3.5;
      this.ctx.globalAlpha = 0.35;
    } else {
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.lineWidth = this.brushSize;
      this.ctx.globalAlpha = 1.0;
    }

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();
    this.ctx.globalAlpha = 1.0;

    this.lastPoint = { x, y };
    this.texture.needsUpdate = true;

    if (Math.random() > 0.7) {
      this.audioManager?.playMarkerDraw();
    }
  }

  stopDraw() {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.lastPoint = null;
      this.autoSave();
    }
  }

  addText(text, x = 200, y = 300, fontSize = 28, color = '#1e293b') {
    this.saveHistory();
    this.ctx.save();
    this.ctx.font = `bold ${fontSize}px "Outfit", sans-serif`;
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
    this.texture.needsUpdate = true;
    this.audioManager?.playClick();
    this.autoSave();
    this.showToast('✍️ Text Added to Board');
  }

  addStickyNote(title, text, x = 300, y = 250, bgColor = '#fef08a', textColor = '#1e1b18') {
    this.saveHistory();
    this.ctx.save();
    const w = 260;
    const h = 180;

    // Shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    this.ctx.shadowBlur = 14;
    this.ctx.shadowOffsetX = 4;
    this.ctx.shadowOffsetY = 6;

    // Note Body
    this.ctx.fillStyle = bgColor;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, w, h, 8);
    this.ctx.fill();

    this.ctx.shadowColor = 'transparent';

    // Pin
    this.ctx.fillStyle = '#ef4444';
    this.ctx.beginPath();
    this.ctx.arc(x + w / 2, y + 14, 8, 0, Math.PI * 2);
    this.ctx.fill();

    // Title
    this.ctx.fillStyle = textColor;
    this.ctx.font = 'bold 18px "Outfit", sans-serif';
    this.ctx.fillText(title, x + 20, y + 50);

    // Text Body
    this.ctx.font = '500 15px "Outfit", sans-serif';
    const lines = this.wrapText(text, 220, 15);
    lines.forEach((l, i) => {
      this.ctx.fillText(l, x + 20, y + 80 + i * 22);
    });

    this.ctx.restore();
    this.texture.needsUpdate = true;
    this.audioManager?.playClick();
  }

  insertImage(imgSource, x = 250, y = 220, maxW = 400, maxH = 300) {
    this.saveHistory();
    const renderImg = (img) => {
      let w = img.naturalWidth || img.width || 300;
      let h = img.naturalHeight || img.height || 200;

      const ratio = Math.min(maxW / w, maxH / h);
      w = w * ratio;
      h = h * ratio;

      this.ctx.save();
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      this.ctx.shadowBlur = 18;
      this.ctx.shadowOffsetY = 8;

      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 6;
      this.ctx.strokeRect(x, y, w, h);

      this.ctx.drawImage(img, x, y, w, h);
      this.ctx.restore();

      this.texture.needsUpdate = true;
      this.audioManager?.playClick();
      this.autoSave();
      this.showToast('🖼️ Picture Placed on Board');
    };

    if (typeof imgSource === 'string') {
      const image = new Image();
      image.onload = () => renderImg(image);
      image.src = imgSource;
    } else {
      renderImg(imgSource);
    }
  }

  drawSticker(emoji, label, x = 320, y = 280) {
    this.saveHistory();
    this.ctx.save();

    // Sticker Badge Card
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowBlur = 12;
    this.ctx.shadowOffsetY = 4;

    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#f59e0b';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, 140, 90, 12);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.shadowColor = 'transparent';

    // Emoji Icon
    this.ctx.font = '36px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(emoji, x + 70, y + 46);

    // Label Text
    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 14px "Outfit", sans-serif';
    this.ctx.fillText(label, x + 70, y + 74);
    this.ctx.textAlign = 'left';

    this.ctx.restore();
    this.texture.needsUpdate = true;
    this.audioManager?.playClick();
    this.autoSave();
    this.showToast(`✨ Added ${label} Badge`);
  }

  wrapText(text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    this.ctx.font = `500 ${fontSize}px sans-serif`;

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = this.ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  clear() {
    this.saveHistory();
    // Modern Light Slate / Frosted Glass Canvas
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Subtle Grid Pattern
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    // Top Smart Board HUD Bar
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    this.ctx.fillRect(0, 0, this.canvas.width, 70);

    // Brand / Status Title
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.font = 'bold 26px "Outfit", sans-serif';
    this.ctx.fillText("✨ MOLLY'S AI SMART BOARD • INTERACTIVE LAB", 30, 45);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '500 16px monospace';
    this.ctx.textAlign = 'right';
    this.ctx.fillText("⚡ Live Stylus • Auto-Save to LocalStorage Active", this.canvas.width - 30, 45);
    this.ctx.textAlign = 'left';

    this.texture.needsUpdate = true;
    this.audioManager?.playWhoosh();
    this.autoSave();
    this.showToast('🗑️ Smart Board Cleared');
  }

  drawPreset(type, shouldAutoSave = true) {
    this.saveHistory();
    // Clear drawing area below HUD
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(0, 71, this.canvas.width, this.canvas.height - 71);

    // Redraw subtle grid
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 70);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 70; y < this.canvas.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    if (type === 'neural') {
      // 1. Deep Learning Neural Network Architecture
      const layers = [4, 6, 6, 3];
      const startX = 240;
      const startY = 220;
      const layerSpacing = 280;
      const nodeSpacing = 90;
      const nodes = [];

      layers.forEach((count, lIdx) => {
        nodes[lIdx] = [];
        const offsetY = (6 - count) * (nodeSpacing / 2);
        for (let i = 0; i < count; i++) {
          const px = startX + lIdx * layerSpacing;
          const py = startY + offsetY + i * nodeSpacing;
          nodes[lIdx].push({ x: px, y: py });
        }
      });

      // Connections
      this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      this.ctx.lineWidth = 2.5;
      for (let l = 0; l < layers.length - 1; l++) {
        nodes[l].forEach(n1 => {
          nodes[l + 1].forEach(n2 => {
            this.ctx.beginPath();
            this.ctx.moveTo(n1.x, n1.y);
            this.ctx.lineTo(n2.x, n2.y);
            this.ctx.stroke();
          });
        });
      }

      // Nodes
      nodes.forEach((layer, lIdx) => {
        layer.forEach((node) => {
          this.ctx.beginPath();
          this.ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
          this.ctx.fillStyle = lIdx === 0 ? '#38bdf8' : (lIdx === 3 ? '#10b981' : '#8b5cf6');
          this.ctx.fill();
          this.ctx.strokeStyle = '#0f172a';
          this.ctx.lineWidth = 3;
          this.ctx.stroke();
        });
      });

      // Headers & Formula
      this.ctx.fillStyle = '#0f172a';
      this.ctx.font = 'bold 22px "Outfit", sans-serif';
      this.ctx.fillText("Input Features (X)", 160, 160);
      this.ctx.fillText("Hidden Layer 1 (ReLU)", 420, 160);
      this.ctx.fillText("Hidden Layer 2 (GELU)", 700, 160);
      this.ctx.fillText("Predictions (Y)", 1000, 160);

      this.ctx.fillStyle = '#f59e0b';
      this.ctx.font = 'bold 22px monospace';
      this.ctx.fillText("Forward Pass: ŷ = Softmax(W₃ · GELU(W₂ · ReLU(W₁X + b₁) + b₂) + b₃)", 220, 800);

      // Sticky Notes on the side
      this.addStickyNote('Sprint Focus', '• MUSE AI Melody Loss < 0.04\n• Optimize Token Inference\n• Deploy to Vercel/Agora', 1240, 150, '#fef08a');
      this.addStickyNote('DevSummit #8', '• Real-time Gaze Vector\n• Audio Anomaly Detection\n• 8th Rank National', 1240, 420, '#a7f3d0');

    } else if (type === 'system') {
      // 2. Microservices System Design & Architecture
      this.ctx.fillStyle = '#0f172a';
      this.ctx.font = 'bold 28px "Outfit", sans-serif';
      this.ctx.fillText("🏗️ Full-Stack AI System Architecture & Microservices", 120, 150);

      const boxes = [
        { title: "React / Vite Frontend", sub: "Three.js 3D Room & HUD", x: 120, y: 220, w: 260, h: 120, col: "#38bdf8" },
        { title: "API Gateway / Nginx", sub: "Load Balancer & Auth", x: 480, y: 220, w: 260, h: 120, col: "#818cf8" },
        { title: "FastAPI / PyTorch Core", sub: "LLM Inference & Voice AI", x: 840, y: 220, w: 280, h: 120, col: "#f59e0b" },
        { title: "Redis Cache & Queue", sub: "Sub-20ms Token Stream", x: 840, y: 440, w: 280, h: 120, col: "#ec4899" },
        { title: "PostgreSQL / Cloud DB", sub: "User Profiles & History", x: 480, y: 440, w: 260, h: 120, col: "#10b981" },
        { title: "Agora RTC / WebSockets", sub: "Real-Time Low-Latency Audio", x: 120, y: 440, w: 260, h: 120, col: "#06b6d4" }
      ];

      boxes.forEach(b => {
        this.ctx.fillStyle = b.col + '22';
        this.ctx.strokeStyle = b.col;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.roundRect(b.x, b.y, b.w, b.h, 12);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#0f172a';
        this.ctx.font = 'bold 18px "Outfit", sans-serif';
        this.ctx.fillText(b.title, b.x + 20, b.y + 45);

        this.ctx.fillStyle = '#475569';
        this.ctx.font = '500 14px monospace';
        this.ctx.fillText(b.sub, b.x + 20, b.y + 80);
      });

      // Flowchart Arrows
      this.ctx.strokeStyle = '#f59e0b';
      this.ctx.lineWidth = 3;
      this.drawArrow(380, 280, 480, 280);
      this.drawArrow(740, 280, 840, 280);
      this.drawArrow(980, 340, 980, 440);
      this.drawArrow(840, 500, 740, 500);
      this.drawArrow(480, 500, 380, 500);

      this.addStickyNote('Key Metric', '⚡ Latency: < 180ms\n🎯 99.9% Uptime\n🔒 JWT & Rate Limiting', 1240, 260, '#fed7aa');

    } else if (type === 'kanban') {
      // 3. AI Sprint Brainstorming & Kanban
      this.ctx.fillStyle = '#0f172a';
      this.ctx.font = 'bold 28px "Outfit", sans-serif';
      this.ctx.fillText("📋 AI Lab Sprint Planner & Brainstorming Board", 100, 140);

      const columns = [
        { name: "💡 Ideas & Backlog", x: 100, w: 320 },
        { name: "⚡ In Development", x: 460, w: 320 },
        { name: "🧪 Testing & Evaluation", x: 820, w: 320 },
        { name: "🚀 Shipped & Live", x: 1180, w: 320 }
      ];

      columns.forEach(col => {
        this.ctx.fillStyle = 'rgba(226, 232, 240, 0.4)';
        this.ctx.beginPath();
        this.ctx.roundRect(col.x, 170, col.w, 750, 10);
        this.ctx.fill();

        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 20px "Outfit", sans-serif';
        this.ctx.fillText(col.name, col.x + 20, 210);
      });

      // Column 1 Notes
      this.addStickyNote('Agent Swarm', '• Multi-agent orchestration\n• Auto code-review agent', 120, 240, '#fef08a');
      this.addStickyNote('Vision RAG', '• Hybrid image & vector search\n• LangChain + ChromaDB', 120, 450, '#fed7aa');

      // Column 2 Notes
      this.addStickyNote('MUSE AI v2', '• Agora Voice AI SDK\n• 5 distinct AI personas\n• Real-time chord progression', 480, 240, '#bae6fd');
      this.addStickyNote('Focus Forge', '• Gaze tracking attention\n• Real-time focus rewards', 480, 480, '#ddd6fe');

      // Column 3 Notes
      this.addStickyNote('Satyadarshi', '• AI proctored integrity\n• Anti-cheat benchmark', 840, 240, '#fbcfe8');

      // Column 4 Notes
      this.addStickyNote('3D Room Portfolio', '• Three.js + Day/Night\n• Vision Board + Smart Board\n• Live on Vercel 🚀', 1200, 240, '#bbf7d0');

    } else if (type === 'calendar') {
      // 4. Monthly Calendar & AI Milestone Planner
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const curMonth = monthNames[now.getMonth()];
      const curYear = now.getFullYear();

      this.ctx.fillStyle = '#0f172a';
      this.ctx.font = 'bold 30px "Outfit", sans-serif';
      this.ctx.fillText(`📅 ${curMonth} ${curYear} • AI Milestone & Sprint Schedule`, 100, 140);

      // Calendar Days Table Grid
      const startX = 100;
      const startY = 180;
      const cellW = 140;
      const cellH = 100;
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      // Header row
      days.forEach((day, idx) => {
        this.ctx.fillStyle = idx === 0 || idx === 6 ? '#f59e0b' : '#38bdf8';
        this.ctx.font = 'bold 18px "Outfit", sans-serif';
        this.ctx.fillText(day, startX + idx * cellW + 40, startY);
      });

      // Simple 5-week date grid
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      let dateNum = 1;
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 7; col++) {
          const cx = startX + col * cellW;
          const cy = startY + 20 + row * cellH;

          // Cell Box
          this.ctx.fillStyle = '#ffffff';
          this.ctx.strokeStyle = '#e2e8f0';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.roundRect(cx, cy, cellW - 10, cellH - 10, 8);
          this.ctx.fill();
          this.ctx.stroke();

          if ((row === 0 && col >= firstDay) || (row > 0 && dateNum <= daysInMonth)) {
            const isToday = dateNum === now.getDate();
            if (isToday) {
              this.ctx.fillStyle = '#f59e0b22';
              this.ctx.beginPath();
              this.ctx.roundRect(cx, cy, cellW - 10, cellH - 10, 8);
              this.ctx.fill();
              this.ctx.strokeStyle = '#f59e0b';
              this.ctx.lineWidth = 2.5;
              this.ctx.stroke();
            }

            this.ctx.fillStyle = isToday ? '#d97706' : '#1e293b';
            this.ctx.font = isToday ? 'bold 18px "Outfit", sans-serif' : '600 16px "Outfit", sans-serif';
            this.ctx.fillText(String(dateNum), cx + 12, cy + 26);

            if (isToday) {
              this.ctx.fillStyle = '#f59e0b';
              this.ctx.font = 'bold 11px monospace';
              this.ctx.fillText("⭐ TODAY", cx + 45, cy + 26);
            }

            dateNum++;
          }
        }
      }

      // High-Priority Schedule Sticky Notes on the right
      this.addStickyNote('Sprint Milestones', '• Deploy Agent Swarm v2\n• Train Vision RAG benchmark\n• DevSummit Finalist Showcase', 1140, 180, '#fef08a');
      this.addStickyNote('Upcoming Events', '• Google AI Hackathon\n• Japan Trip Booking\n• Mercedes AMG Test Drive 🏎️', 1140, 420, '#bae6fd');

    } else if (type === 'blank') {
      // Just clear canvas for fresh brainstorming
      this.addText("💡 Start brainstorming, drawing, or typing anywhere...", 100, 180, 24, '#94a3b8');
    }

    this.texture.needsUpdate = true;
    if (shouldAutoSave) {
      this.autoSave();
      this.showToast(`✨ Loaded ${type.toUpperCase()} Board`);
    }
  }

  drawArrow(fromX, fromY, toX, toY) {
    const headLen = 14;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    this.ctx.fillStyle = this.ctx.strokeStyle;
    this.ctx.fill();
  }

  setPlayingMusic(isPlaying, title = 'Lofi Beats Streaming') {
    this.isPlayingMusic = isPlaying;
    this.musicTrackTitle = title;
  }

  update(delta) {
    let needsUpdate = false;

    // HUD Notification Toast
    if (this.notificationTimer > 0) {
      this.notificationTimer -= delta;
      this.ctx.save();
      const toastW = 380;
      const toastH = 42;
      const toastX = (this.canvas.width - toastW) / 2;
      const toastY = 14;

      this.ctx.fillStyle = 'rgba(245, 158, 11, 0.96)';
      this.ctx.beginPath();
      this.ctx.roundRect(toastX, toastY, toastW, toastH, 20);
      this.ctx.fill();

      this.ctx.fillStyle = '#0f172a';
      this.ctx.font = 'bold 16px "Outfit", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.notificationText, this.canvas.width / 2, toastY + 26);
      this.ctx.textAlign = 'left';
      this.ctx.restore();
      needsUpdate = true;
    }

    if (this.isPlayingMusic) {
      this.animTime += delta * 6;
      // Draw dynamic animated sound wave equalizer in the bottom right corner of the Smart Board
      this.ctx.save();
      const eqX = this.canvas.width - 340;
      const eqY = this.canvas.height - 70;
      const eqW = 300;
      const eqH = 45;

      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      this.ctx.beginPath();
      this.ctx.roundRect(eqX, eqY, eqW, eqH, 8);
      this.ctx.fill();

      // Equalizer bars
      const numBars = 18;
      const barW = 6;
      for (let i = 0; i < numBars; i++) {
        const h = Math.abs(Math.sin(this.animTime + i * 0.7) * 26) + 6;
        const bx = eqX + 16 + i * 11;
        const by = eqY + eqH - 10 - h;
        this.ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#f59e0b';
        this.ctx.fillRect(bx, by, barW, h);
      }

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 12px "Outfit", sans-serif';
      this.ctx.fillText("🎵 Playing: " + this.musicTrackTitle.substring(0, 16) + "...", eqX + 220, eqY + 28);
      this.ctx.restore();

      needsUpdate = true;
    }

    if (needsUpdate) {
      this.texture.needsUpdate = true;
    }
  }
}

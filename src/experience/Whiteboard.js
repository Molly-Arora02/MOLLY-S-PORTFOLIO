import * as THREE from 'three';

export default class Whiteboard {
  constructor(experience, position = new THREE.Vector3(-2.8, 1.8, -0.5), size = { width: 2.2, height: 1.4 }) {
    this.experience = experience;
    this.scene = experience.scene;
    this.audioManager = experience.audioManager;
    this.position = position;
    this.size = size;

    // 2D Canvas setup for texture
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 650;
    this.ctx = this.canvas.getContext('2d');

    this.currentColor = '#06b6d4'; // Cyan
    this.brushSize = 6;
    this.isDrawing = false;
    this.lastPoint = null;

    this.initCanvasTexture();
    this.init3DMesh();
    this.drawInitialContent();
  }

  initCanvasTexture() {
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
  }

  init3DMesh() {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.group.rotation.y = Math.PI / 2; // facing into the room from left wall

    // Board Surface
    const boardGeo = new THREE.PlaneGeometry(this.size.width, this.size.height);
    this.boardMaterial = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.2,
      metalness: 0.05
    });
    this.mesh = new THREE.Mesh(boardGeo, this.boardMaterial);
    this.mesh.userData = { isWhiteboard: true };
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);

    // Sleek Aluminum Frame
    const frameGeo = new THREE.BoxGeometry(this.size.width + 0.08, this.size.height + 0.08, 0.03);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.3, metalness: 0.8 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.z = -0.016;
    this.group.add(frame);

    // Marker Tray at the bottom
    const trayGeo = new THREE.BoxGeometry(this.size.width * 0.8, 0.04, 0.08);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.4, metalness: 0.7 });
    const tray = new THREE.Mesh(trayGeo, trayMat);
    tray.position.set(0, -this.size.height / 2 - 0.02, 0.04);
    this.group.add(tray);

    // Little colored marker props on the tray
    const markerColors = [0x06b6d4, 0x6366f1, 0x10b981, 0xf43f5e, 0x18181b];
    markerColors.forEach((col, i) => {
      const penGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.12, 12);
      const penMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3 });
      const pen = new THREE.Mesh(penGeo, penMat);
      pen.rotation.z = Math.PI / 2;
      pen.position.set(-0.35 + i * 0.15, -this.size.height / 2 + 0.01, 0.04);
      this.group.add(pen);
    });

    this.scene.add(this.group);
  }

  drawInitialContent() {
    // Fill white/light grey glossy background
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Subtle grid lines
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 1;
    const gridStep = 40;
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

    // Header Title
    this.ctx.font = 'bold 26px sans-serif';
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillText("✨ Molly's AI & Algo Lab", 50, 60);

    this.ctx.font = '16px monospace';
    this.ctx.fillStyle = '#64748b';
    this.ctx.fillText('// Click & drag to sketch or select preset diagram below', 50, 90);

    // Draw a neat initial neural network sketch
    this.drawPreset('neural');
  }

  setColor(colorHex) {
    this.currentColor = colorHex;
  }

  setBrushSize(size) {
    this.brushSize = size;
  }

  startDraw(uvX, uvY) {
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

    if (this.currentColor === 'eraser') {
      this.ctx.strokeStyle = '#f8fafc';
      this.ctx.lineWidth = this.brushSize * 3;
    } else {
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.lineWidth = this.brushSize;
    }

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    this.lastPoint = { x, y };
    this.texture.needsUpdate = true;

    if (Math.random() > 0.6) {
      this.audioManager?.playMarkerDraw();
    }
  }

  stopDraw() {
    this.isDrawing = false;
    this.lastPoint = null;
  }

  clear() {
    this.drawInitialContent();
    this.texture.needsUpdate = true;
    this.audioManager?.playWhoosh();
  }

  drawPreset(type) {
    if (type === 'neural') {
      // Neural Net Diagram
      const layers = [3, 4, 4, 2];
      const startX = 220;
      const startY = 160;
      const layerSpacing = 160;
      const nodeSpacing = 70;

      const nodes = [];

      layers.forEach((count, lIdx) => {
        nodes[lIdx] = [];
        const offsetY = (4 - count) * (nodeSpacing / 2);
        for (let i = 0; i < count; i++) {
          const px = startX + lIdx * layerSpacing;
          const py = startY + offsetY + i * nodeSpacing;
          nodes[lIdx].push({ x: px, y: py });
        }
      });

      // Connections
      this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
      this.ctx.lineWidth = 2;
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
        layer.forEach((node, nIdx) => {
          this.ctx.beginPath();
          this.ctx.arc(node.x, node.y, 14, 0, Math.PI * 2);
          this.ctx.fillStyle = lIdx === 0 ? '#06b6d4' : (lIdx === 3 ? '#10b981' : '#6366f1');
          this.ctx.fill();
          this.ctx.strokeStyle = '#0f172a';
          this.ctx.lineWidth = 2.5;
          this.ctx.stroke();
        });
      });

      // Labels
      this.ctx.font = 'bold 15px sans-serif';
      this.ctx.fillStyle = '#334155';
      this.ctx.fillText("Inputs (X)", 190, 480);
      this.ctx.fillText("Hidden Layer (ReLU)", 350, 480);
      this.ctx.fillText("Predict (Y)", 700, 480);

      this.ctx.font = 'italic 16px sans-serif';
      this.ctx.fillStyle = '#0891b2';
      this.ctx.fillText("y_pred = σ(W₂ · ReLU(W₁x + b₁) + b₂)", 280, 540);
    } else if (type === 'tree') {
      // Binary Search Tree
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.fillRect(0, 120, this.canvas.width, this.canvas.height - 120);

      const treeNodes = [
        { val: "50", x: 500, y: 180, left: 1, right: 2 },
        { val: "30", x: 340, y: 280, left: 3, right: 4 },
        { val: "70", x: 660, y: 280, left: 5, right: 6 },
        { val: "20", x: 260, y: 380 },
        { val: "40", x: 420, y: 380 },
        { val: "60", x: 580, y: 380 },
        { val: "80", x: 740, y: 380 }
      ];

      this.ctx.strokeStyle = '#10b981';
      this.ctx.lineWidth = 3;
      treeNodes.forEach(n => {
        if (n.left !== undefined) {
          const child = treeNodes[n.left];
          this.ctx.beginPath();
          this.ctx.moveTo(n.x, n.y);
          this.ctx.lineTo(child.x, child.y);
          this.ctx.stroke();
        }
        if (n.right !== undefined) {
          const child = treeNodes[n.right];
          this.ctx.beginPath();
          this.ctx.moveTo(n.x, n.y);
          this.ctx.lineTo(child.x, child.y);
          this.ctx.stroke();
        }
      });

      treeNodes.forEach(n => {
        this.ctx.beginPath();
        this.ctx.arc(n.x, n.y, 22, 0, Math.PI * 2);
        this.ctx.fillStyle = '#10b981';
        this.ctx.fill();
        this.ctx.strokeStyle = '#065f46';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(n.val, n.x, n.y);
      });
      this.ctx.textAlign = 'left';

      this.ctx.font = 'bold 18px monospace';
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillText("Time: O(log N) • Balanced BST • LeetCode C++", 260, 490);
    }

    this.texture.needsUpdate = true;
  }
}

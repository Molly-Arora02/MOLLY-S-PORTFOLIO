import * as THREE from 'three';
import CoffeeSteam from './CoffeeSteam.js';
import RubiksCube from './RubiksCube.js';
import Whiteboard from './Whiteboard.js';
import ArcadeScreen from './ArcadeScreen.js';
import ServerRig from './ServerRig.js';
import CyberParticles from './CyberParticles.js';

export default class Room {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.audioManager = experience.audioManager;

    this.group = new THREE.Group();
    this.interactiveObjects = [];

    this.initLights();
    this.buildRoomStructure();
    this.buildAcousticHexPanels();
    this.buildDeskSetup();
    this.buildChair();
    this.buildRubikPedestal();
    this.buildServerRig();
    this.buildBookshelfAndTrophies();
    this.buildArcadeCabinet();
    this.buildDecorations();

    // Floating Cyber Particles
    this.cyberParticles = new CyberParticles(this.scene, 140);

    this.scene.add(this.group);
  }

  initLights() {
    // Soft base ambient with cool midnight tint
    const ambientLight = new THREE.AmbientLight(0x1e1b4b, 1.4);
    this.scene.add(ambientLight);

    // Warm Sunbeam / Key light through window
    const sunLight = new THREE.DirectionalLight(0xfff1e6, 2.2);
    sunLight.position.set(6, 10, 4);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.camera.left = -6;
    sunLight.shadow.camera.right = 6;
    sunLight.shadow.camera.top = 6;
    sunLight.shadow.camera.bottom = -6;
    sunLight.shadow.bias = -0.0004;
    this.scene.add(sunLight);

    // Contrasty Electric Cyan Rim Light
    const cyanRim = new THREE.DirectionalLight(0x00f5ff, 1.4);
    cyanRim.position.set(-6, 5, -4);
    this.scene.add(cyanRim);

    // Contrasty Neon Magenta Accent Light
    const magentaAccent = new THREE.PointLight(0xff007f, 2.2, 8);
    magentaAccent.position.set(2.8, 3.2, -1.8);
    this.scene.add(magentaAccent);

    // Neon Wall Sign Cyan Point Light
    const neonPoint = new THREE.PointLight(0x00f5ff, 2.4, 7);
    neonPoint.position.set(-0.3, 3.4, -2.9);
    this.scene.add(neonPoint);

    // Workstation Monitor Screen Ambilight
    const monitorGlow = new THREE.PointLight(0x38bdf8, 1.6, 4.0);
    monitorGlow.position.set(0, 1.5, -0.6);
    this.scene.add(monitorGlow);

    // Rubik Pedestal Spotlight
    const rubikSpot = new THREE.SpotLight(0x00f5ff, 2.5, 5, Math.PI / 4, 0.4);
    rubikSpot.position.set(1.65, 2.8, 0.75);
    rubikSpot.target.position.set(1.65, 0.85, 0.75);
    this.scene.add(rubikSpot);
    this.scene.add(rubikSpot.target);
  }

  buildRoomStructure() {
    // Floor (Dark Glossy Obsidian Tile with Chamfered Joints)
    const floorGeo = new THREE.BoxGeometry(7.2, 0.2, 7.2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.18,
      metalness: 0.35
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Neon Floor Boundary Inlay Strips (Electric Cyan & Neon Magenta)
    const stripMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
    const stripMatMagenta = new THREE.MeshBasicMaterial({ color: 0xff007f });

    const fStrip1 = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 0.03), stripMatCyan);
    fStrip1.rotation.x = -Math.PI / 2;
    fStrip1.position.set(0, 0.005, -3.2);
    this.group.add(fStrip1);

    const fStrip2 = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 6.8), stripMatMagenta);
    fStrip2.rotation.x = -Math.PI / 2;
    fStrip2.position.set(-3.2, 0.005, 0);
    this.group.add(fStrip2);

    // Back Wall (Deep Midnight Slate)
    const backWallGeo = new THREE.BoxGeometry(7.2, 4.6, 0.2);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.75,
      metalness: 0.15
    });
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 2.2, -3.5);
    backWall.receiveShadow = true;
    this.group.add(backWall);

    // Left Wall
    const leftWallGeo = new THREE.BoxGeometry(0.2, 4.6, 7.2);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-3.5, 2.2, 0);
    leftWall.receiveShadow = true;
    this.group.add(leftWall);

    // Ceiling Neon Recessed Light Strips
    const cStripBack = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.04, 0.06), stripMatCyan);
    cStripBack.position.set(0, 4.45, -3.38);
    this.group.add(cStripBack);

    const cStripLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 7.0), stripMatMagenta);
    cStripLeft.position.set(-3.38, 4.45, 0);
    this.group.add(cStripLeft);

    // Modern Corner Window
    this.buildWindow();

    // High-Contrast Cyber Rug
    const rugGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.02, 36);
    const rugMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.7,
      metalness: 0.2
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.position.set(0, 0.015, 0.1);
    rug.receiveShadow = true;
    this.group.add(rug);

    // Rug Outer Neon Trim Ring
    const rugRing = new THREE.Mesh(
      new THREE.RingGeometry(2.32, 2.38, 36),
      new THREE.MeshBasicMaterial({ color: 0x00f5ff, side: THREE.DoubleSide })
    );
    rugRing.rotation.x = -Math.PI / 2;
    rugRing.position.set(0, 0.026, 0.1);
    this.group.add(rugRing);
  }

  buildAcousticHexPanels() {
    // 3D Hexagonal Acoustic Wall Panels with contrasting backlit illumination
    const hexGroup = new THREE.Group();
    hexGroup.position.set(-0.2, 2.2, -3.38);

    const hexGeo = new THREE.CircleGeometry(0.18, 6);
    const hexMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.6
    });

    const hexColors = [0x00f5ff, 0xff007f, 0x8b5cf6, 0x38bdf8];

    // Grid of Hexagons
    for (let row = -1; row <= 1; row++) {
      for (let col = -3; col <= 3; col++) {
        if (Math.abs(col) + Math.abs(row) > 3) continue;
        const hMesh = new THREE.Mesh(hexGeo, hexMat);
        const xOffset = col * 0.32 + (row % 2) * 0.16;
        const yOffset = row * 0.28;
        hMesh.position.set(xOffset, yOffset, 0.01);
        hexGroup.add(hMesh);

        // Glowing border on selected hexagons
        if ((col + row) % 2 === 0) {
          const borderGeo = new THREE.RingGeometry(0.175, 0.19, 6);
          const borderMat = new THREE.MeshBasicMaterial({
            color: hexColors[(col + 3) % hexColors.length],
            side: THREE.DoubleSide
          });
          const border = new THREE.Mesh(borderGeo, borderMat);
          border.position.set(xOffset, yOffset, 0.015);
          hexGroup.add(border);
        }
      }
    }

    this.group.add(hexGroup);
  }

  buildWindow() {
    const windowFrameGeo = new THREE.BoxGeometry(2.4, 2.3, 0.1);
    const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.2, metalness: 0.9 });
    const windowFrame = new THREE.Mesh(windowFrameGeo, windowFrameMat);
    windowFrame.position.set(2.0, 2.4, -3.42);
    this.group.add(windowFrame);

    // Glowing Neon Glass looking out onto Cyber Skyline
    const glassGeo = new THREE.PlaneGeometry(2.2, 2.1);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.05,
      metalness: 0.95,
      emissive: 0x0369a1,
      emissiveIntensity: 0.45
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(2.0, 2.4, -3.36);
    this.group.add(glass);

    // Window Grids
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.1, 0.04), windowFrameMat);
    vBar.position.set(2.0, 2.4, -3.34);
    this.group.add(vBar);

    const hBar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 0.04), windowFrameMat);
    hBar.position.set(2.0, 2.4, -3.34);
    this.group.add(hBar);
  }

  buildDeskSetup() {
    this.deskGroup = new THREE.Group();
    this.deskGroup.position.set(0, 0, -0.8);

    // Desk Tabletop (Rich Dark Smoked Oak with Neon Cyan Bevel Edge)
    const topGeo = new THREE.BoxGeometry(3.3, 0.08, 1.4);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.25,
      metalness: 0.3
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.96;
    top.castShadow = true;
    top.receiveShadow = true;
    this.deskGroup.add(top);

    // Desk Front Edge Neon Strip
    const edgeStrip = new THREE.Mesh(
      new THREE.BoxGeometry(3.3, 0.02, 0.01),
      new THREE.MeshBasicMaterial({ color: 0x00f5ff })
    );
    edgeStrip.position.set(0, 0.96, 0.705);
    this.deskGroup.add(edgeStrip);

    // Desk Legs (Matte Black Titanium Frame with Triangular Truss)
    const legGeo = new THREE.BoxGeometry(0.06, 0.96, 1.25);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2, metalness: 0.9 });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-1.5, 0.48, 0);
    leftLeg.castShadow = true;
    this.deskGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(1.5, 0.48, 0);
    rightLeg.castShadow = true;
    this.deskGroup.add(rightLeg);

    // Ultra-Wide Desk Mat (Cyber Midnight with Laser Pink Border)
    const matGeo = new THREE.BoxGeometry(2.2, 0.01, 0.75);
    const matMaterial = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
    const deskMatMesh = new THREE.Mesh(matGeo, matMaterial);
    deskMatMesh.position.set(0, 1.005, 0.08);
    deskMatMesh.receiveShadow = true;
    this.deskGroup.add(deskMatMesh);

    // Desk Mat Border Glow
    const matBorder = new THREE.Mesh(
      new THREE.PlaneGeometry(2.22, 0.77),
      new THREE.MeshBasicMaterial({ color: 0xff007f, side: THREE.DoubleSide })
    );
    matBorder.rotation.x = -Math.PI / 2;
    matBorder.position.set(0, 1.002, 0.08);
    this.deskGroup.add(matBorder);

    // Dual Curved Ultra-Wide Monitors Setup
    this.buildDualMonitors();

    // Mechanical Keyboard (Backlit 75% Custom Board)
    const kbGeo = new THREE.BoxGeometry(0.72, 0.03, 0.26);
    const kbMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.25, metalness: 0.6 });
    const keyboard = new THREE.Mesh(kbGeo, kbMat);
    keyboard.position.set(0, 1.025, 0.16);
    keyboard.castShadow = true;
    this.deskGroup.add(keyboard);

    // RGB Keycap Underglow
    const rgbGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.74, 0.28),
      new THREE.MeshBasicMaterial({ color: 0x00f5ff, side: THREE.DoubleSide })
    );
    rgbGlow.rotation.x = -Math.PI / 2;
    rgbGlow.position.set(0, 1.012, 0.16);
    this.deskGroup.add(rgbGlow);

    // Wireless Precision Mouse with glowing laser wheel
    const mouseGeo = new THREE.BoxGeometry(0.09, 0.035, 0.14);
    const mouseMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.2, metalness: 0.7 });
    const mouse = new THREE.Mesh(mouseGeo, mouseMat);
    mouse.position.set(0.6, 1.025, 0.16);
    mouse.castShadow = true;
    this.deskGroup.add(mouse);

    // Studio Condenser Microphone on Boom Arm
    const micStandGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.28, 16);
    const micMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.2, metalness: 0.9 });
    const micStand = new THREE.Mesh(micStandGeo, micMat);
    micStand.position.set(-1.18, 1.14, -0.2);
    this.deskGroup.add(micStand);

    const micHeadGeo = new THREE.SphereGeometry(0.048, 16, 16);
    const micHeadMat = new THREE.MeshStandardMaterial({
      color: 0x00f5ff,
      roughness: 0.3,
      emissive: 0x00f5ff,
      emissiveIntensity: 0.4
    });
    const micHead = new THREE.Mesh(micHeadGeo, micHeadMat);
    micHead.position.set(-1.18, 1.32, -0.2);
    this.deskGroup.add(micHead);

    // Steaming Coffee Cup (Matte Black Ceramic with Glowing Accent)
    const cupGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.09, 20);
    const cupMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2, metalness: 0.8 });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.set(1.05, 1.05, -0.15);
    cup.castShadow = true;
    this.deskGroup.add(cup);

    // Animated Coffee Steam Shader
    this.coffeeSteam = new CoffeeSteam(new THREE.Vector3(1.05, 1.1, -0.95));
    this.scene.add(this.coffeeSteam.mesh);

    // Modern Bonsai / Cyber Succulent Plant
    const potGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.1, 16);
    const potMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(-1.28, 1.05, 0.35);
    this.deskGroup.add(pot);

    const plantLeavesGeo = new THREE.DodecahedronGeometry(0.09, 1);
    const plantLeavesMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.4,
      emissive: 0x059669,
      emissiveIntensity: 0.25
    });
    const plantLeaves = new THREE.Mesh(plantLeavesGeo, plantLeavesMat);
    plantLeaves.position.set(-1.28, 1.15, 0.35);
    this.deskGroup.add(plantLeaves);

    this.group.add(this.deskGroup);
  }

  buildDualMonitors() {
    const standBaseGeo = new THREE.BoxGeometry(0.42, 0.02, 0.26);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2, metalness: 0.9 });
    const standBase = new THREE.Mesh(standBaseGeo, standMat);
    standBase.position.set(0, 1.01, -0.4);
    this.deskGroup.add(standBase);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.48, 16), standMat);
    pole.position.set(0, 1.25, -0.4);
    this.deskGroup.add(pole);

    const monitorBezelGeo = new THREE.BoxGeometry(1.22, 0.74, 0.04);
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.15, metalness: 0.95 });

    // --- LEFT MONITOR (Shipped AI Products & Code Hub) ---
    const leftMonitorGroup = new THREE.Group();
    leftMonitorGroup.position.set(-0.7, 1.45, -0.32);
    leftMonitorGroup.rotation.y = 0.18;

    const leftBezel = new THREE.Mesh(monitorBezelGeo, bezelMat);
    leftBezel.castShadow = true;
    leftMonitorGroup.add(leftBezel);

    // Ambilight Backlight on Wall behind Left Monitor
    const leftAmbi = new THREE.Mesh(
      new THREE.PlaneGeometry(1.26, 0.78),
      new THREE.MeshBasicMaterial({ color: 0x00f5ff, side: THREE.DoubleSide })
    );
    leftAmbi.position.z = -0.025;
    leftMonitorGroup.add(leftAmbi);

    // Left Screen Texture
    this.leftScreenCanvas = document.createElement('canvas');
    this.leftScreenCanvas.width = 640;
    this.leftScreenCanvas.height = 380;
    this.drawLeftScreenTexture();

    this.leftScreenTexture = new THREE.CanvasTexture(this.leftScreenCanvas);
    const leftScreenMat = new THREE.MeshStandardMaterial({
      map: this.leftScreenTexture,
      emissive: 0xffffff,
      emissiveMap: this.leftScreenTexture,
      emissiveIntensity: 1.0,
      roughness: 0.1
    });

    const leftScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.7), leftScreenMat);
    leftScreen.position.z = 0.021;
    leftScreen.userData = { isLeftMonitor: true, targetView: 'monitors' };
    leftMonitorGroup.add(leftScreen);
    this.interactiveObjects.push(leftScreen);

    this.deskGroup.add(leftMonitorGroup);

    // --- RIGHT MONITOR (Profile, Certifications & Metrics) ---
    const rightMonitorGroup = new THREE.Group();
    rightMonitorGroup.position.set(0.7, 1.45, -0.32);
    rightMonitorGroup.rotation.y = -0.18;

    const rightBezel = new THREE.Mesh(monitorBezelGeo, bezelMat);
    rightBezel.castShadow = true;
    rightMonitorGroup.add(rightBezel);

    // Ambilight Backlight on Wall behind Right Monitor
    const rightAmbi = new THREE.Mesh(
      new THREE.PlaneGeometry(1.26, 0.78),
      new THREE.MeshBasicMaterial({ color: 0xff007f, side: THREE.DoubleSide })
    );
    rightAmbi.position.z = -0.025;
    rightMonitorGroup.add(rightAmbi);

    // Right Screen Texture
    this.rightScreenCanvas = document.createElement('canvas');
    this.rightScreenCanvas.width = 640;
    this.rightScreenCanvas.height = 380;
    this.drawRightScreenTexture();

    this.rightScreenTexture = new THREE.CanvasTexture(this.rightScreenCanvas);
    const rightScreenMat = new THREE.MeshStandardMaterial({
      map: this.rightScreenTexture,
      emissive: 0xffffff,
      emissiveMap: this.rightScreenTexture,
      emissiveIntensity: 1.0,
      roughness: 0.1
    });

    const rightScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.7), rightScreenMat);
    rightScreen.position.z = 0.021;
    rightScreen.userData = { isRightMonitor: true, targetView: 'monitors' };
    rightMonitorGroup.add(rightScreen);
    this.interactiveObjects.push(rightScreen);

    this.deskGroup.add(rightMonitorGroup);
  }

  drawLeftScreenTexture() {
    const ctx = this.leftScreenCanvas.getContext('2d');
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, 640, 380);

    // Window Header Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 640, 32);

    ctx.fillStyle = '#ff007f'; ctx.beginPath(); ctx.arc(20, 16, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(36, 16, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#00f08a'; ctx.beginPath(); ctx.arc(52, 16, 5, 0, Math.PI * 2); ctx.fill();

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('molly@ai-lab: ~/shipped-products [PROD]', 80, 20);

    // Contrast Section Header
    ctx.fillStyle = '#00f5ff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('⚡ SHIPPED AI PRODUCTS & REAL-TIME AGENTS', 28, 62);

    // Card 1: MUSE AI
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(25, 76, 590, 65);
    ctx.fillStyle = '#00f5ff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('1. MUSE AI • Conversational Voice AI Co-Producer', 40, 98);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('   → Agora Voice AI Platform | 5 Personas | Real-Time Melody Injection', 40, 118);
    ctx.fillStyle = '#00f08a';
    ctx.fillText('● LIVE ON VERCEL & AGORA', 480, 98);

    // Card 2: Focus Forge
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(25, 148, 590, 65);
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('2. Focus Forge • AI Concentration & Productivity Suite', 40, 170);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('   → React + TypeScript + AI Attention Modeling & Reward Engine', 40, 190);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('● PROTOTYPE ACTIVE', 480, 170);

    // Card 3: Satyadarshi & Phantom Mesh
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(25, 220, 590, 65);
    ctx.fillStyle = '#ff007f';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('3. Satyadarshi (AI Proctoring) & Phantom Mesh (Voice Spam Defense)', 40, 242);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('   → Computer Vision Gaze Anomaly Detection | Anthropic Voice Agent', 40, 262);

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#00f5ff';
    ctx.fillText('> Click monitor to inspect live product demos & Agora recipes_', 28, 350);
  }

  drawRightScreenTexture() {
    const ctx = this.rightScreenCanvas.getContext('2d');
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, 640, 380);

    // Header Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 640, 32);

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Molly Arora • AI/ML Engineer & Full-Stack Developer', 20, 20);

    // Profile Card UI
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(25, 48, 590, 84);

    ctx.font = 'bold 21px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('MOLLY ARORA', 45, 78);

    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#00f5ff';
    ctx.fillText('B.Tech CSE (AI) • React / TypeScript / LLM Agent Pipelines', 45, 100);
    ctx.fillStyle = '#00f08a';
    ctx.fillText('🟢 Ranked 8th PAN India @ DevSummit 2026', 45, 120);

    // Verified Badges Grid
    const badges = [
      { t: '🏆 8th PAN India DevSummit', c: '#f59e0b', sub: 'National Hackathon' },
      { t: '⭐ Google Certified', c: '#38bdf8', sub: 'Prompt Engineering' },
      { t: '🎓 IIT Mandi (8.0 CGPA)', c: '#00f08a', sub: 'Minor in DS & ML' },
      { t: '🌲 Stanford University', c: '#ec4899', sub: 'Code in Place (Python)' }
    ];

    badges.forEach((b, i) => {
      const bx = 25 + (i % 2) * 300;
      const by = 142 + Math.floor(i / 2) * 85;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(bx, by, 290, 72);

      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = b.c;
      ctx.fillText(b.t, bx + 16, by + 30);

      ctx.font = '11px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(b.sub, bx + 16, by + 52);
    });

    ctx.font = 'italic 12px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Click monitor to open full resume, experience & contact modal →', 120, 355);
  }

  buildChair() {
    this.chairGroup = new THREE.Group();
    this.chairGroup.position.set(0, 0, 0.45);

    const baseMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2, metalness: 0.9 });
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const spokeGeo = new THREE.BoxGeometry(0.04, 0.03, 0.35);
      const spoke = new THREE.Mesh(spokeGeo, baseMat);
      spoke.position.set(Math.sin(angle) * 0.175, 0.06, Math.cos(angle) * 0.175);
      spoke.rotation.y = angle;
      this.chairGroup.add(spoke);
    }

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 16), baseMat);
    stem.position.y = 0.25;
    this.chairGroup.add(stem);

    // Ergonomic Cushion (Deep Indigo with Neon Blue stitching)
    const seatGeo = new THREE.BoxGeometry(0.58, 0.08, 0.55);
    const cushionMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.5, metalness: 0.3 });
    const seat = new THREE.Mesh(seatGeo, cushionMat);
    seat.position.y = 0.52;
    seat.castShadow = true;
    this.chairGroup.add(seat);

    const backGeo = new THREE.BoxGeometry(0.52, 0.65, 0.05);
    const back = new THREE.Mesh(backGeo, cushionMat);
    back.position.set(0, 0.86, 0.26);
    back.rotation.x = -0.08;
    back.castShadow = true;
    this.chairGroup.add(back);

    const headGeo = new THREE.BoxGeometry(0.3, 0.14, 0.06);
    const head = new THREE.Mesh(headGeo, cushionMat);
    head.position.set(0, 1.24, 0.28);
    this.chairGroup.add(head);

    const armMat = new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.2, metalness: 0.7 });
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.3), armMat);
    leftArm.position.set(-0.32, 0.66, 0.08);
    this.chairGroup.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.3), armMat);
    rightArm.position.set(0.32, 0.66, 0.08);
    this.chairGroup.add(rightArm);

    this.chairGroup.userData = { isChair: true };
    this.interactiveObjects.push(this.chairGroup);
    this.group.add(this.chairGroup);
  }

  buildRubikPedestal() {
    // Dedicated Sci-Fi Hexagonal Pedestal for Rubik's Cube on the Front-Right
    // Placed at (1.65, 0, 0.75) — completely separated from the desk monitors!
    const pedGroup = new THREE.Group();
    pedGroup.position.set(1.65, 0, 0.75);

    // Pedestal Base Column
    const baseGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.78, 6);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.2
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.39;
    base.castShadow = true;
    base.receiveShadow = true;
    pedGroup.add(base);

    // Glowing Neon Cyan Ring on Top of Plinth
    const ringGeo = new THREE.RingGeometry(0.2, 0.28, 6);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.785;
    pedGroup.add(ring);

    // Little Holo Title Tag Plaque
    const plaqueGeo = new THREE.BoxGeometry(0.36, 0.08, 0.02);
    const plaqueMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
    const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaque.position.set(0, 0.65, 0.28);
    pedGroup.add(plaque);

    this.group.add(pedGroup);

    // Interactive 3D Rubik's Cube floating on top of this dedicated pedestal
    this.rubiksCube = new RubiksCube(this.experience, new THREE.Vector3(1.65, 1.05, 0.75));
  }

  buildServerRig() {
    // AI Neural Server Rig next to left desk leg
    this.serverRig = new ServerRig(this.group, new THREE.Vector3(-1.75, 0, 0.4));
  }

  buildBookshelfAndTrophies() {
    this.shelfGroup = new THREE.Group();
    this.shelfGroup.position.set(-1.8, 1.8, -3.35);

    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.7 });
    const metalBracketMat = new THREE.MeshStandardMaterial({ color: 0x030712, metalness: 0.95 });

    // 2 Floating Shelves with Neon Edge Highlights
    [0, 0.6].forEach(offsetY => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.34), shelfMat);
      shelf.position.y = offsetY;
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      this.shelfGroup.add(shelf);

      const sStrip = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.015, 0.01),
        new THREE.MeshBasicMaterial({ color: offsetY === 0 ? 0x00f5ff : 0xff007f })
      );
      sStrip.position.set(0, offsetY, 0.175);
      this.shelfGroup.add(sStrip);
    });

    // Golden DevSummit 2026 Trophy (Ranked 8th PAN India)
    const trophyGroup = new THREE.Group();
    trophyGroup.position.set(-0.45, 0.62, 0.02);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.98,
      roughness: 0.1,
      emissive: 0xb45309,
      emissiveIntensity: 0.5
    });

    const trophyBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.06, 16), metalBracketMat);
    trophyGroup.add(trophyBase);

    const trophyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 16), goldMat);
    trophyStem.position.y = 0.09;
    trophyGroup.add(trophyStem);

    const trophyCup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.04, 0.16, 16), goldMat);
    trophyCup.position.y = 0.22;
    trophyGroup.add(trophyCup);

    // Glowing Star on Top of Trophy
    const starGeo = new THREE.OctahedronGeometry(0.05);
    const starMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 1.0 });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.y = 0.35;
    trophyGroup.add(star);

    trophyGroup.userData = { isTrophy: true, targetView: 'trophy' };
    this.interactiveObjects.push(trophyGroup);
    this.shelfGroup.add(trophyGroup);

    // Vibrant Computer Science Books on bottom shelf
    const bookColors = [0x00f5ff, 0xff007f, 0x10b981, 0x8b5cf6, 0xf59e0b];
    bookColors.forEach((col, i) => {
      const bookGeo = new THREE.BoxGeometry(0.055, 0.28, 0.22);
      const bookMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.2 });
      const book = new THREE.Mesh(bookGeo, bookMat);
      book.position.set(0.1 + i * 0.065, 0.16, 0);
      book.castShadow = true;
      this.shelfGroup.add(book);
    });

    // Certificate Plaque (IIT Mandi 8.0 CGPA & Stanford Python)
    const certFrame = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.02), metalBracketMat);
    certFrame.position.set(0.5, 0.74, 0);
    this.shelfGroup.add(certFrame);

    const certPaper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8, emissive: 0xfef3c7, emissiveIntensity: 0.1 })
    );
    certPaper.position.set(0.5, 0.74, 0.012);
    this.shelfGroup.add(certPaper);

    this.group.add(this.shelfGroup);
  }

  buildArcadeCabinet() {
    this.arcadeGroup = new THREE.Group();
    this.arcadeGroup.position.set(2.6, 0, -2.2);
    this.arcadeGroup.rotation.y = -Math.PI / 4;

    const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2, metalness: 0.6 });
    const neonTrimMat = new THREE.MeshStandardMaterial({ color: 0xff007f, emissive: 0xff007f, emissiveIntensity: 1.0 });

    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.2, 0.8), cabinetMat);
    lowerBody.position.y = 0.6;
    lowerBody.castShadow = true;
    this.arcadeGroup.add(lowerBody);

    const cp = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 0.4), cabinetMat);
    cp.position.set(0, 0.95, 0.28);
    cp.rotation.x = 0.2;
    this.arcadeGroup.add(cp);

    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 12), cabinetMat);
    stick.position.set(-0.2, 1.04, 0.3);
    this.arcadeGroup.add(stick);

    const stickBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xff007f, roughness: 0.1, emissive: 0xff007f, emissiveIntensity: 0.5 })
    );
    stickBall.position.set(-0.2, 1.1, 0.3);
    this.arcadeGroup.add(stickBall);

    const btnCols = [0x00f5ff, 0x10b981, 0xf59e0b, 0xff007f, 0x8b5cf6, 0x38bdf8];
    btnCols.forEach((c, idx) => {
      const bx = 0.05 + (idx % 3) * 0.08;
      const bz = 0.26 + Math.floor(idx / 3) * 0.06;
      const btn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.02, 12),
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.2, emissive: c, emissiveIntensity: 0.4 })
      );
      btn.position.set(bx, 1.02, bz);
      this.arcadeGroup.add(btn);
    });

    const marquee = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.25, 0.4), neonTrimMat);
    marquee.position.set(0, 1.95, 0.1);
    this.arcadeGroup.add(marquee);

    this.arcadeScreen = new ArcadeScreen(this.experience, new THREE.Vector3(2.6, 1.45, -2.2));
    this.interactiveObjects.push(this.arcadeScreen.mesh);

    this.group.add(this.arcadeGroup);
  }

  buildDecorations() {
    this.whiteboard = new Whiteboard(this.experience, new THREE.Vector3(-3.38, 1.8, 0.4));
    this.interactiveObjects.push(this.whiteboard.mesh);

    // Glowing Neon Wall Sign "MOLLY • AI LAB"
    const signGroup = new THREE.Group();
    signGroup.position.set(-0.3, 3.4, -3.35);

    const signBackGeo = new THREE.BoxGeometry(1.8, 0.48, 0.04);
    const signBackMat = new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.2, metalness: 0.9 });
    const signBack = new THREE.Mesh(signBackGeo, signBackMat);
    signGroup.add(signBack);

    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 140;
    const sCtx = signCanvas.getContext('2d');
    sCtx.fillStyle = '#030712';
    sCtx.fillRect(0, 0, 512, 140);
    sCtx.font = 'bold 36px monospace';
    sCtx.fillStyle = '#00f5ff';
    sCtx.shadowColor = '#00f5ff';
    sCtx.shadowBlur = 18;
    sCtx.fillText('⚡ MOLLY • AI LAB ⚡', 30, 82);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 0.42),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signScreen.position.z = 0.025;
    signGroup.add(signScreen);

    this.group.add(signGroup);
  }

  update(delta, isRubikInspecting = false) {
    if (this.coffeeSteam) {
      this.coffeeSteam.update(delta);
    }
    if (this.rubiksCube) {
      this.rubiksCube.update(delta, isRubikInspecting);
    }
    if (this.serverRig) {
      this.serverRig.update(delta);
    }
    if (this.cyberParticles) {
      this.cyberParticles.update(delta);
    }
  }
}

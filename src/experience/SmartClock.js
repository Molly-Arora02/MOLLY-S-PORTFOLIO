import * as THREE from 'three';

export default class SmartClock {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.audioManager = experience.audioManager;

    this.group = new THREE.Group();

    this.initWallClock();
    this.initDeskSmartCalendar();

    this.scene.add(this.group);
  }

  initWallClock() {
    // Wall Clock Position: on back wall above left side (-2.2, 2.8, -3.36)
    this.clockGroup = new THREE.Group();
    this.clockGroup.position.set(-2.2, 2.8, -3.36);

    const radius = 0.32;

    // 1. Sleek Outer Bezel (Brushed Dark Gunmetal / Titanium)
    const bezelGeo = new THREE.CylinderGeometry(radius, radius, 0.035, 48);
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.85,
      roughness: 0.25
    });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.rotation.x = Math.PI / 2;
    this.clockGroup.add(bezel);

    // 2. Clock Face Canvas (Crisp Bauhaus Modern Design)
    this.faceCanvas = document.createElement('canvas');
    this.faceCanvas.width = 512;
    this.faceCanvas.height = 512;
    this.faceCtx = this.faceCanvas.getContext('2d');
    this.renderClockFace();

    this.faceTexture = new THREE.CanvasTexture(this.faceCanvas);
    this.faceTexture.colorSpace = THREE.SRGBColorSpace;

    const faceGeo = new THREE.CircleGeometry(radius * 0.94, 48);
    const faceMat = new THREE.MeshStandardMaterial({
      map: this.faceTexture,
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0xffffff,
      emissiveMap: this.faceTexture,
      emissiveIntensity: 0.12
    });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.z = 0.019;
    face.userData = { isClock: true, targetView: 'calendar_modal' };
    this.clockGroup.add(face);

    // 3. Ambient LED Glow Ring behind clock
    const glowGeo = new THREE.RingGeometry(radius * 0.98, radius * 1.08, 36);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = -0.01;
    this.clockGroup.add(glow);

    // 4. Center Cap
    const capGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.01, 24);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 0.026;
    this.clockGroup.add(cap);

    // 5. Hour Hand (Dark Charcoal Titanium)
    const hourHandGeo = new THREE.BoxGeometry(0.016, 0.15, 0.005);
    hourHandGeo.translate(0, 0.075, 0);
    const handMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7 });
    this.hourHand = new THREE.Mesh(hourHandGeo, handMat);
    this.hourHand.position.z = 0.021;
    this.clockGroup.add(this.hourHand);

    // 6. Minute Hand (Slightly longer & slimmer)
    const minHandGeo = new THREE.BoxGeometry(0.012, 0.22, 0.005);
    minHandGeo.translate(0, 0.11, 0);
    this.minHand = new THREE.Mesh(minHandGeo, handMat);
    this.minHand.position.z = 0.022;
    this.clockGroup.add(this.minHand);

    // 7. Second Hand (Vibrant Amber Gold with counterbalance)
    const secHandGeo = new THREE.BoxGeometry(0.006, 0.25, 0.004);
    secHandGeo.translate(0, 0.08, 0);
    const secHandMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.5,
      roughness: 0.2
    });
    this.secHand = new THREE.Mesh(secHandGeo, secHandMat);
    this.secHand.position.z = 0.024;
    this.clockGroup.add(this.secHand);

    this.clockGroup.userData = { isClock: true, targetView: 'calendar_modal' };
    this.group.add(this.clockGroup);
  }

  renderClockFace() {
    const ctx = this.faceCtx;
    const w = this.faceCanvas.width;
    const h = this.faceCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = w / 2 - 16;

    // Dial background (Warm frosted slate white)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Subtle inner ring
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
    ctx.stroke();

    // Hour Markers & Numbers
    for (let i = 1; i <= 12; i++) {
      const angle = (i * Math.PI) / 6;
      const markerR = r - 28;
      const x = cx + Math.sin(angle) * markerR;
      const y = cy - Math.cos(angle) * markerR;

      // Hour Numbers
      ctx.fillStyle = i % 3 === 0 ? '#0f172a' : '#475569';
      ctx.font = i % 3 === 0 ? 'bold 36px "Outfit", sans-serif' : '600 28px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i.toString(), x, y);

      // Minor tick marks
      const tickOuter = r - 4;
      const tickInner = r - (i % 3 === 0 ? 16 : 10);
      const x1 = cx + Math.sin(angle) * tickInner;
      const y1 = cy - Math.cos(angle) * tickInner;
      const x2 = cx + Math.sin(angle) * tickOuter;
      const y2 = cy - Math.cos(angle) * tickOuter;

      ctx.strokeStyle = i % 3 === 0 ? '#f59e0b' : '#94a3b8';
      ctx.lineWidth = i % 3 === 0 ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Brand / Subtitle
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("AI STUDIO", cx, cy - 65);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 12px monospace';
    ctx.fillText("SWISS PRECISION", cx, cy + 70);
  }

  initDeskSmartCalendar() {
    // Smart E-Ink Desk Stand at right side of desk (0.88, 0.94, -0.45)
    this.deskCalendarGroup = new THREE.Group();
    this.deskCalendarGroup.position.set(0.88, 0.94, -0.45);
    this.deskCalendarGroup.rotation.y = -Math.PI / 4; // angled toward user chair

    // 1. Matte Aluminum Stand Frame
    const standGeo = new THREE.BoxGeometry(0.26, 0.18, 0.016);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.3, metalness: 0.8 });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.set(0, 0.09, 0);
    stand.rotation.x = -0.15; // tilted back slightly
    this.deskCalendarGroup.add(stand);

    // Stand base foot
    const footGeo = new THREE.BoxGeometry(0.18, 0.01, 0.12);
    const foot = new THREE.Mesh(footGeo, standMat);
    foot.position.set(0, 0.005, 0.03);
    this.deskCalendarGroup.add(foot);

    // 2. High-Res E-Ink Smart Display Canvas
    this.calendarCanvas = document.createElement('canvas');
    this.calendarCanvas.width = 512;
    this.calendarCanvas.height = 360;
    this.calendarCtx = this.calendarCanvas.getContext('2d');

    this.calendarTexture = new THREE.CanvasTexture(this.calendarCanvas);
    this.calendarTexture.colorSpace = THREE.SRGBColorSpace;

    const screenGeo = new THREE.PlaneGeometry(0.24, 0.16);
    const screenMat = new THREE.MeshStandardMaterial({
      map: this.calendarTexture,
      roughness: 0.15,
      metalness: 0.05,
      emissive: 0xffffff,
      emissiveMap: this.calendarTexture,
      emissiveIntensity: 0.15
    });
    this.calendarMesh = new THREE.Mesh(screenGeo, screenMat);
    this.calendarMesh.position.set(0, 0.09, 0.009);
    this.calendarMesh.rotation.x = -0.15;
    this.calendarMesh.userData = { isCalendar: true, targetView: 'calendar_modal' };
    this.deskCalendarGroup.add(this.calendarMesh);

    this.deskCalendarGroup.userData = { isCalendar: true, targetView: 'calendar_modal' };
    this.group.add(this.deskCalendarGroup);

    this.updateDeskCalendarDisplay();
  }

  updateDeskCalendarDisplay() {
    const ctx = this.calendarCtx;
    const w = this.calendarCanvas.width;
    const h = this.calendarCanvas.height;
    const now = new Date();

    // Clear background (Dark Cyber Smart Display)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Header bar (Amber Gold Accent)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
    ctx.fillRect(0, 0, w, 44);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px "Outfit", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("⚡ SMART DESK CALENDAR", 16, 28);

    // Day of week & date
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const dateNum = now.getDate();

    // Large Live Digital Clock
    const hours24 = now.getHours();
    const hours12 = hours24 % 12 || 12;
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${String(hours12).padStart(2, '0')}:${mins}:${secs}`;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px monospace';
    ctx.fillText(timeStr, 16, 110);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 22px "Outfit", sans-serif';
    ctx.fillText(ampm, 295, 85);

    // Date & Day Card on Right
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.beginPath();
    ctx.roundRect(360, 58, 136, 110, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(monthName.toUpperCase(), 428, 82);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Outfit", sans-serif';
    ctx.fillText(String(dateNum), 428, 128);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 13px "Outfit", sans-serif';
    ctx.fillText(dayName.slice(0, 3), 428, 154);

    // Bottom Agenda / Milestone Ticker
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(16, 185, 480, 155, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px "Outfit", sans-serif';
    ctx.fillText("📅 TODAY'S AGENDA & GOALS:", 30, 215);

    const agenda = [
      "• 🚀 Ship Multi-Agent Swarm Orchestrator",
      "• 🧠 Train Vision RAG on Deep Learning benchmarks",
      "• 🌸 Plan Japan & Mercedes Vision Milestones"
    ];

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 14px "Outfit", sans-serif';
    agenda.forEach((item, idx) => {
      ctx.fillText(item, 30, 248 + idx * 28);
    });

    this.calendarTexture.needsUpdate = true;
  }

  update(delta) {
    const now = new Date();
    const ms = now.getMilliseconds();
    const secs = now.getSeconds() + ms / 1000;
    const mins = now.getMinutes() + secs / 60;
    const hours = (now.getHours() % 12) + mins / 60;

    // Rotate Wall Clock Hands (Z-axis rotation in Three.js)
    if (this.secHand) {
      this.secHand.rotation.z = -secs * (Math.PI / 30);
    }
    if (this.minHand) {
      this.minHand.rotation.z = -mins * (Math.PI / 30);
    }
    if (this.hourHand) {
      this.hourHand.rotation.z = -hours * (Math.PI / 6);
    }

    // Refresh desk smart calendar display
    this.updateDeskCalendarDisplay();
  }
}

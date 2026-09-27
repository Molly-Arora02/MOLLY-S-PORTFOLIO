import * as THREE from 'three';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import Camera from './Camera.js';
import Room from './Room.js';
import AudioManager from './AudioManager.js';

export default class Experience {
  constructor(canvas) {
    // Singleton
    if (window.experienceInstance) {
      return window.experienceInstance;
    }
    window.experienceInstance = this;

    this.canvas = canvas;
    this.audioManager = new AudioManager();

    // Dimensions
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: Math.min(window.devicePixelRatio, 2)
    };

    // Raycasting & Pointer
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.isMouseDown = false;
    this.hoveredObject = null;

    this.initScene();
    this.initRenderer();
    this.camera = new Camera(this);
    this.room = new Room(this);

    this.setupEvents();
    this.startLoop();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0f17); // Dark aesthetic void
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
  }

  setupEvents() {
    window.addEventListener('resize', () => this.resize());

    const updatePointer = (clientX, clientY) => {
      this.mouse.x = (clientX / this.sizes.width) * 2 - 1;
      this.mouse.y = -(clientY / this.sizes.height) * 2 + 1;
    };

    window.addEventListener('mousemove', (e) => {
      updatePointer(e.clientX, e.clientY);
      this.checkHover();

      // If zoomed into whiteboard and mouse is pressed, draw directly on 3D board
      if (this.camera.currentView === 'whiteboard' && this.isMouseDown && this.room?.whiteboard) {
        this.raycastWhiteboardDraw();
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      updatePointer(e.clientX, e.clientY);
      if (this.camera.currentView === 'whiteboard' && this.room?.whiteboard) {
        this.raycastWhiteboardDraw(true);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      if (this.room?.whiteboard) {
        this.room.whiteboard.stopDraw();
      }
    });

    // Touch event support for drawing and interactions
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
        if (this.camera.currentView === 'whiteboard' && this.room?.whiteboard) {
          this.raycastWhiteboardDraw(true);
        } else {
          this.handleClick(e);
        }
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0 && this.camera.currentView === 'whiteboard' && this.room?.whiteboard) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
        this.raycastWhiteboardDraw(false);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (this.room?.whiteboard) {
        this.room.whiteboard.stopDraw();
      }
    });

    this.canvas.addEventListener('click', (e) => {
      updatePointer(e.clientX, e.clientY);
      this.handleClick(e);
    });
  }

  checkHover() {
    if (!this.room) return;
    this.raycaster.setFromCamera(this.mouse, this.camera.instance);

    // If currently focused on whiteboard, show precision drawing crosshair
    if (this.camera.currentView === 'whiteboard' && this.room.whiteboard) {
      const wbHits = this.raycaster.intersectObject(this.room.whiteboard.mesh);
      if (wbHits.length > 0) {
        this.canvas.style.cursor = 'crosshair';
        return;
      }
    }
    
    // Check intersection with interactive objects or rubik cubies
    const candidates = [
      ...this.room.interactiveObjects,
      ...(this.room.rubiksCube ? this.room.rubiksCube.cubies : [])
    ];

    const intersects = this.raycaster.intersectObjects(candidates, true);

    if (intersects.length > 0) {
      let hit = intersects[0].object;
      while (hit && !hit.userData?.targetView && !hit.userData?.isRubikCubie && !hit.userData?.isChair && !hit.userData?.isWhiteboard && !hit.userData?.isArcadeScreen && !hit.userData?.isArcadeCabinet && hit.parent && hit !== this.scene) {
        hit = hit.parent;
      }
      this.canvas.style.cursor = 'pointer';
      this.hoveredObject = hit;
    } else {
      this.canvas.style.cursor = 'default';
      this.hoveredObject = null;
    }
  }

  raycastWhiteboardDraw(isStart = false) {
    this.raycaster.setFromCamera(this.mouse, this.camera.instance);
    const intersects = this.raycaster.intersectObject(this.room.whiteboard.mesh);
    if (intersects.length > 0 && intersects[0].uv) {
      const uv = intersects[0].uv;
      if (isStart) {
        this.room.whiteboard.startDraw(uv.x, uv.y);
      } else {
        this.room.whiteboard.draw(uv.x, uv.y);
      }
    }
  }

  handleClick(e) {
    this.raycaster.setFromCamera(this.mouse, this.camera.instance);

    // 1. Check Rubik's cube first
    if (this.room?.rubiksCube) {
      const rubikHits = this.raycaster.intersectObjects(this.room.rubiksCube.cubies);
      if (rubikHits.length > 0) {
        if (this.camera.currentView !== 'rubik') {
          this.camera.setView('rubik');
          window.dispatchEvent(new CustomEvent('viewchange', { detail: { view: 'rubik' } }));
        } else {
          const result = this.room.rubiksCube.handleStickerClick(rubikHits[0]);
          if (result) {
            window.dispatchEvent(new CustomEvent('rubikfact', { detail: result }));
          }
        }
        return;
      }
    }

    // 2. Check general interactive objects
    const intersects = this.raycaster.intersectObjects(this.room.interactiveObjects, true);
    if (intersects.length > 0) {
      let hit = intersects[0].object;
      while (hit && !hit.userData?.targetView && !hit.userData?.isChair && !hit.userData?.isWhiteboard && !hit.userData?.isArcadeScreen && !hit.userData?.isArcadeCabinet && !hit.userData?.isFloorLamp && hit.parent && hit !== this.scene) {
        hit = hit.parent;
      }

      if (hit?.userData?.isFloorLamp) {
        this.room.toggleFloorLamp();
        return;
      }

      if (hit?.userData?.isChair) {
        this.spinChair();
        return;
      }

      if (hit?.userData?.isTrophy) {
        this.celebrateTrophy();
        this.camera.setView('trophy');
        window.dispatchEvent(new CustomEvent('viewchange', { detail: { view: 'trophy' } }));
        return;
      }

      if (hit?.userData?.isWhiteboard) {
        this.camera.setView('whiteboard');
        window.dispatchEvent(new CustomEvent('viewchange', { detail: { view: 'whiteboard' } }));
        return;
      }

      if (hit?.userData?.isClock || hit?.userData?.isCalendar || hit?.userData?.targetView === 'calendar_modal') {
        window.dispatchEvent(new CustomEvent('showcalendarmodal'));
        return;
      }

      if (hit?.userData?.isArcadeScreen || hit?.userData?.isArcadeCabinet || hit?.userData?.targetView === 'arcade') {
        this.camera.setView('arcade');
        window.dispatchEvent(new CustomEvent('viewchange', { detail: { view: 'arcade' } }));
        return;
      }

      if (hit?.userData?.targetView) {
        const view = hit.userData.targetView;
        if (view === 'calendar_modal') {
          window.dispatchEvent(new CustomEvent('showcalendarmodal'));
        } else {
          this.camera.setView(view);
          window.dispatchEvent(new CustomEvent('viewchange', { detail: { view } }));
        }
      }
    }
  }

  spinChair() {
    this.audioManager?.playWhoosh();
    gsap.to(this.room.chairGroup.rotation, {
      y: this.room.chairGroup.rotation.y + Math.PI * 2,
      duration: 1.2,
      ease: "power2.out"
    });
  }

  celebrateTrophy() {
    this.audioManager?.playTrophyFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    window.dispatchEvent(new CustomEvent('showtrophymodal'));
  }

  resize() {
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;
    this.sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

    this.camera.resize();
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
  }

  startLoop() {
    this.clock = new THREE.Clock();

    const tick = () => {
      const delta = this.clock.getDelta();

      const isRubik = this.camera.currentView === 'rubik';
      this.room.update(delta, isRubik);
      this.camera.update(delta);

      this.renderer.render(this.scene, this.camera.instance);
      window.requestAnimationFrame(tick);
    };

    tick();
  }
}

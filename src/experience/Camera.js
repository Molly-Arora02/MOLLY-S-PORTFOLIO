import * as THREE from 'three';
import gsap from 'gsap';

export default class Camera {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.sizes = experience.sizes;
    this.canvas = experience.canvas;
    this.audioManager = experience.audioManager;

    this.currentView = 'overview';
    this.isTransitioning = false;

    // Viewpoint Presets
    this.views = {
      overview: {
        position: new THREE.Vector3(5.8, 5.2, 5.8),
        target: new THREE.Vector3(0, 1.1, 0),
        fov: 42
      },
      monitors: {
        position: new THREE.Vector3(0, 1.55, 0.95),
        target: new THREE.Vector3(0, 1.45, -0.6),
        fov: 45
      },
      rubik: {
        position: new THREE.Vector3(1.65, 1.15, 1.8),
        target: new THREE.Vector3(1.65, 0.85, 0.75),
        fov: 38
      },
      whiteboard: {
        position: new THREE.Vector3(-1.3, 1.8, 0.4),
        target: new THREE.Vector3(-3.28, 1.8, 0.4),
        fov: 48
      },
      arcade: {
        position: new THREE.Vector3(1.4, 1.45, -1.0),
        target: new THREE.Vector3(2.6, 1.45, -2.2),
        fov: 40
      },
      trophy: {
        position: new THREE.Vector3(-0.6, 2.1, -1.8),
        target: new THREE.Vector3(-1.8, 2.0, -3.25),
        fov: 38
      },
      vision: {
        position: new THREE.Vector3(-0.15, 2.85, -1.0),
        target: new THREE.Vector3(-0.15, 2.85, -3.36),
        fov: 42
      }
    };

    // Parallax mouse offsets
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.currentTarget = this.views.overview.target.clone();

    this.initCamera();
    this.setupParallax();
  }

  initCamera() {
    const aspect = this.sizes.width / this.sizes.height;
    this.instance = new THREE.PerspectiveCamera(
      this.views.overview.fov,
      aspect,
      0.1,
      100
    );

    this.instance.position.copy(this.views.overview.position);
    this.instance.lookAt(this.currentTarget);
    this.scene.add(this.instance);
  }

  setupParallax() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / this.sizes.width - 0.5) * 2;
      this.mouse.targetY = -(e.clientY / this.sizes.height - 0.5) * 2;
    });
  }

  setView(viewName, onCompleteCallback) {
    if (!this.views[viewName] || (this.currentView === viewName && !this.isTransitioning)) return;
    
    this.isTransitioning = true;
    this.currentView = viewName;
    this.audioManager?.playWhoosh();

    const targetView = this.views[viewName];

    // Animate position
    gsap.to(this.instance.position, {
      x: targetView.position.x,
      y: targetView.position.y,
      z: targetView.position.z,
      duration: 1.4,
      ease: "power3.inOut"
    });

    // Animate lookAt target
    gsap.to(this.currentTarget, {
      x: targetView.target.x,
      y: targetView.target.y,
      z: targetView.target.z,
      duration: 1.4,
      ease: "power3.inOut"
    });

    // Animate FOV
    gsap.to(this.instance, {
      fov: targetView.fov,
      duration: 1.4,
      ease: "power3.inOut",
      onUpdate: () => {
        this.instance.updateProjectionMatrix();
        this.instance.lookAt(this.currentTarget);
      },
      onComplete: () => {
        this.isTransitioning = false;
        if (onCompleteCallback) onCompleteCallback();
      }
    });
  }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height;
    this.instance.updateProjectionMatrix();
  }

  update(delta) {
    // Parallax damping when in overview mode
    if (this.currentView === 'overview' && !this.isTransitioning) {
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

      const basePos = this.views.overview.position;
      this.instance.position.x = basePos.x + this.mouse.x * 0.45;
      this.instance.position.y = basePos.y + this.mouse.y * 0.35;
      this.instance.lookAt(this.currentTarget);
    } else {
      this.instance.lookAt(this.currentTarget);
    }
  }
}

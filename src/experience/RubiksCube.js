import * as THREE from 'three';
import gsap from 'gsap';
import { mollyData } from '../data/mollyData.js';

export default class RubiksCube {
  constructor(experience, position = new THREE.Vector3(0, 0, 0)) {
    this.experience = experience;
    this.scene = experience.scene;
    this.audioManager = experience.audioManager;
    this.position = position;
    
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.scene.add(this.group);

    this.cubies = [];
    this.isRotating = false;
    this.rubikData = mollyData.rubikFacts;

    this.cubieSize = 0.088;
    this.spacing = 0.094;

    this.colors = {
      F: 0xf59e0b, // Front - Warm Amber Gold (MUSE AI Live Product)
      B: 0x38bdf8, // Back - Sky Blue (Google Prompt Certified)
      U: 0xfef08a, // Up - Radiant Cream Gold (DevSummit 8th)
      D: 0x10b981, // Down - Emerald Sage (IIT Mandi 8.0 CGPA)
      L: 0xec4899, // Left - Rose Quartz (Stanford Python)
      R: 0x8b5cf6, // Right - Electric Purple (Coding Blocks / Full-Stack)
      inside: 0x18181b // Matte Charcoal inner core plastic
    };

    this.initCube();
  }

  initCube() {
    // Clear any existing cubies
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.cubies = [];

    const geometry = new THREE.BoxGeometry(this.cubieSize, this.cubieSize, this.cubieSize);

    // Create 3x3x3 = 27 cubies
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const materials = [
            // Right (x = +1)
            new THREE.MeshStandardMaterial({ 
              color: x === 1 ? this.colors.R : this.colors.inside, 
              roughness: 0.3, metalness: 0.1 
            }),
            // Left (x = -1)
            new THREE.MeshStandardMaterial({ 
              color: x === -1 ? this.colors.L : this.colors.inside, 
              roughness: 0.3, metalness: 0.1 
            }),
            // Top (y = +1)
            new THREE.MeshStandardMaterial({ 
              color: y === 1 ? this.colors.U : this.colors.inside, 
              roughness: 0.3, metalness: 0.1 
            }),
            // Bottom (y = -1)
            new THREE.MeshStandardMaterial({ 
              color: y === -1 ? this.colors.D : this.colors.inside, 
              roughness: 0.3, metalness: 0.1 
            }),
            // Front (z = +1)
            new THREE.MeshStandardMaterial({ 
              color: z === 1 ? this.colors.F : this.colors.inside, 
              roughness: 0.3, metalness: 0.1 
            }),
            // Back (z = -1)
            new THREE.MeshStandardMaterial({ 
              color: z === -1 ? this.colors.B : this.colors.inside, 
              roughness: 0.3, metalness: 0.1 
            }),
          ];

          const cubie = new THREE.Mesh(geometry, materials);
          const px = x * this.spacing;
          const py = y * this.spacing;
          const pz = z * this.spacing;
          cubie.position.set(px, py, pz);
          cubie.castShadow = true;
          cubie.receiveShadow = true;
          cubie.userData = { 
            gridCoord: { x, y, z },
            isRubikCubie: true,
            targetView: 'rubik',
            initialPos: new THREE.Vector3(px, py, pz)
          };

          this.cubies.push(cubie);
          this.group.add(cubie);
        }
      }
    }
  }

  rotateSlice(axis, layer, angle = Math.PI / 2, duration = 0.28) {
    if (this.isRotating) return Promise.resolve();
    this.isRotating = true;

    this.audioManager?.playRubikTurn();

    const pivot = new THREE.Group();
    this.group.add(pivot);

    const activeCubies = [];
    const targetCoord = layer * this.spacing;
    const threshold = this.spacing * 0.45;

    // Accurately find the 9 cubies located on this slice
    this.cubies.forEach(cubie => {
      // Get position relative to the Rubik's cube group
      const pos = cubie.position;
      let match = false;
      if (axis === 'x' && Math.abs(pos.x - targetCoord) < threshold) match = true;
      if (axis === 'y' && Math.abs(pos.y - targetCoord) < threshold) match = true;
      if (axis === 'z' && Math.abs(pos.z - targetCoord) < threshold) match = true;

      if (match) {
        activeCubies.push(cubie);
      }
    });

    activeCubies.forEach(c => pivot.attach(c));

    return new Promise(resolve => {
      gsap.to(pivot.rotation, {
        [axis]: pivot.rotation[axis] + angle,
        duration,
        ease: "power2.out",
        onComplete: () => {
          pivot.updateMatrixWorld();
          activeCubies.forEach(c => {
            this.group.attach(c);
            // Snap position to exact grid increments to prevent precision drift
            c.position.x = Math.round(c.position.x / this.spacing) * this.spacing;
            c.position.y = Math.round(c.position.y / this.spacing) * this.spacing;
            c.position.z = Math.round(c.position.z / this.spacing) * this.spacing;
          });
          this.group.remove(pivot);
          this.isRotating = false;
          resolve();
        }
      });
    });
  }

  async scramble() {
    if (this.isRotating) return;
    const axes = ['x', 'y', 'z'];
    const layers = [-1, 1]; // Rotate outer faces for clean scramble
    const moves = 8;
    
    for (let i = 0; i < moves; i++) {
      const axis = axes[Math.floor(Math.random() * axes.length)];
      const layer = layers[Math.floor(Math.random() * layers.length)];
      const dir = Math.random() > 0.5 ? 1 : -1;
      await this.rotateSlice(axis, layer, (Math.PI / 2) * dir, 0.16);
    }
  }

  async resetSolved() {
    if (this.isRotating) return;
    this.isRotating = true;
    this.audioManager?.playWhoosh();

    // Smoothly animate all 27 cubies back to their clean initial solved positions & zero rotation
    const promises = this.cubies.map(cubie => {
      return new Promise(res => {
        gsap.to(cubie.position, {
          x: cubie.userData.initialPos.x,
          y: cubie.userData.initialPos.y,
          z: cubie.userData.initialPos.z,
          duration: 0.45,
          ease: "back.out(1.4)"
        });
        gsap.to(cubie.rotation, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.45,
          ease: "power2.out",
          onComplete: () => res()
        });
      });
    });

    await Promise.all(promises);
    this.isRotating = false;
  }

  handleStickerClick(intersection) {
    if (!intersection || !intersection.face) return null;
    const normal = intersection.face.normal.clone();
    normal.transformDirection(intersection.object.matrixWorld);

    let faceKey = 'F';
    if (Math.abs(normal.z - 1) < 0.5) faceKey = 'F';
    else if (Math.abs(normal.z + 1) < 0.5) faceKey = 'B';
    else if (Math.abs(normal.y - 1) < 0.5) faceKey = 'U';
    else if (Math.abs(normal.y + 1) < 0.5) faceKey = 'D';
    else if (Math.abs(normal.x - 1) < 0.5) faceKey = 'R';
    else if (Math.abs(normal.x + 1) < 0.5) faceKey = 'L';

    this.audioManager?.playClick();

    // Pulse animation on the clicked cubie
    gsap.fromTo(intersection.object.scale, 
      { x: 1.15, y: 1.15, z: 1.15 }, 
      { x: 1, y: 1, z: 1, duration: 0.35, ease: "elastic.out(1.2, 0.4)" }
    );

    return {
      faceKey,
      fact: this.rubikData[faceKey]
    };
  }

  update(delta, isInspecting = false) {
    if (isInspecting) {
      this.group.rotation.y += delta * 0.35;
      this.group.rotation.x = Math.sin(Date.now() * 0.001) * 0.12;
    } else {
      this.group.rotation.y = 0.35;
      this.group.rotation.x = 0.15;
    }
  }
}

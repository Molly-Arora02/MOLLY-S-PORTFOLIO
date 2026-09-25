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

    this.colors = {
      F: 0x00f5ff, // Front - Electric Cyan (MUSE AI Live Product)
      B: 0xf59e0b, // Back - Amber Gold (8th PAN India DevSummit)
      U: 0x38bdf8, // Up - Sky Blue (Google Prompt Certified)
      D: 0x00f08a, // Down - Laser Emerald (IIT Mandi 8.0 CGPA)
      L: 0xff007f, // Left - Neon Magenta (Stanford Python)
      R: 0x8b5cf6, // Right - Electric Purple (Coding Blocks / Full-Stack)
      inside: 0x09090b // Deep Obsidian inner plastic
    };

    this.initCube();
  }

  initCube() {
    const cubieSize = 0.22;
    const spacing = 0.235;
    const geometry = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);

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
          cubie.position.set(x * spacing, y * spacing, z * spacing);
          cubie.castShadow = true;
          cubie.receiveShadow = true;
          cubie.userData = { 
            gridPos: new THREE.Vector3(x, y, z),
            isRubikCubie: true,
            origPos: new THREE.Vector3(x * spacing, y * spacing, z * spacing)
          };

          this.cubies.push(cubie);
          this.group.add(cubie);
        }
      }
    }

    // Add subtle pedestal for the Rubik's cube on the desk
    const standGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.04, 24);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4, metalness: 0.5 });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.set(0, -0.42, 0);
    this.group.add(stand);
  }

  rotateSlice(axis, layer, angle = Math.PI / 2, duration = 0.35) {
    if (this.isRotating) return Promise.resolve();
    this.isRotating = true;

    this.audioManager?.playRubikTurn();

    const pivot = new THREE.Group();
    this.group.add(pivot);

    const activeCubies = [];
    const threshold = 0.1;

    this.cubies.forEach(cubie => {
      const worldPos = new THREE.Vector3();
      cubie.getWorldPosition(worldPos);
      const localPos = this.group.worldToLocal(worldPos.clone());

      let match = false;
      if (axis === 'x' && Math.abs(localPos.x - layer * 0.235) < threshold) match = true;
      if (axis === 'y' && Math.abs(localPos.y - layer * 0.235) < threshold) match = true;
      if (axis === 'z' && Math.abs(localPos.z - layer * 0.235) < threshold) match = true;

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
    const layers = [-1, 0, 1];
    for (let i = 0; i < 6; i++) {
      const axis = axes[Math.floor(Math.random() * axes.length)];
      const layer = layers[Math.floor(Math.random() * layers.length)];
      const dir = Math.random() > 0.5 ? 1 : -1;
      await this.rotateSlice(axis, layer, (Math.PI / 2) * dir, 0.18);
    }
  }

  async resetSolved() {
    if (this.isRotating) return;
    this.audioManager?.playWhoosh();
    // Animate all cubies back to initial positions
    const spacing = 0.235;
    let idx = 0;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cubie = this.cubies[idx++];
          gsap.to(cubie.position, {
            x: x * spacing,
            y: y * spacing,
            z: z * spacing,
            duration: 0.4,
            ease: "back.out(1.5)"
          });
          gsap.to(cubie.rotation, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.4
          });
        }
      }
    }
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
      this.group.rotation.y += delta * 0.3;
      this.group.rotation.x = Math.sin(Date.now() * 0.001) * 0.15;
    } else {
      this.group.rotation.y = 0.35;
      this.group.rotation.x = 0.15;
    }
  }
}

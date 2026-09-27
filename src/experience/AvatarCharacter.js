import * as THREE from 'three';
import gsap from 'gsap';

export default class AvatarCharacter {
  constructor(experience, position = new THREE.Vector3(0.9, 0, 0.45)) {
    this.experience = experience;
    this.scene = experience.scene;
    this.audioManager = experience.audioManager;
    this.position = position;

    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.group.rotation.y = -Math.PI / 5; // Angled gracefully towards the camera

    this.isWaving = false;
    this.time = 0;
    this.isSpeaking = false;

    this.buildCharacter();
    this.setupSpeechBubbleUI();
    this.scene.add(this.group);

    // Initial entrance wave & voice greeting after a short delay
    setTimeout(() => {
      this.wave();
      this.speak("Hi there! Welcome to my 3D developer lab. I'm Molly Arora. Click around to explore my shipped AI products, try my interactive Rubik's cube, or sketch on the whiteboard!");
    }, 1200);
  }

  buildCharacter() {
    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, roughness: 0.5, metalness: 0.05 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1f1712, roughness: 0.7, metalness: 0.1 });
    const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.05 }); // Navy tech hoodie
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 }); // Dark denim
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }); // Clean white sneakers
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 }); // Sky blue accents

    // 1. Shoes & Feet
    [-0.11, 0.11].forEach(lx => {
      const shoeGroup = new THREE.Group();
      shoeGroup.position.set(lx, 0.05, 0.02);

      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.22), shoeMat);
      sole.castShadow = true;
      shoeGroup.add(sole);

      const shoeTop = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.18), accentMat);
      shoeTop.position.set(0, 0.04, -0.01);
      shoeGroup.add(shoeTop);

      this.group.add(shoeGroup);
    });

    // 2. Legs / Pants
    [-0.11, 0.11].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.048, 0.68, 16), pantsMat);
      leg.position.set(lx, 0.42, 0);
      leg.castShadow = true;
      this.group.add(leg);
    });

    // 3. Torso / Tech Hoodie
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.96, 0);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.46, 20), hoodieMat);
    torso.castShadow = true;
    this.torsoGroup.add(torso);

    // Hoodie Pocket
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.04), hoodieMat);
    pocket.position.set(0, -0.08, 0.14);
    this.torsoGroup.add(pocket);

    // Hoodie Drawstrings
    [-0.03, 0.03].forEach(sx => {
      const string = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 0.12, 8),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8 })
      );
      string.position.set(sx, 0.12, 0.16);
      this.torsoGroup.add(string);
    });

    // Chest "MA AI" Logo
    const logoBadge = new THREE.Mesh(
      new THREE.CircleGeometry(0.028, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })
    );
    logoBadge.position.set(-0.06, 0.12, 0.16);
    this.torsoGroup.add(logoBadge);

    // 4. Head & Neck
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.32, 0);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.1, 16), skinMat);
    neck.position.y = -0.05;
    this.headGroup.add(neck);

    // Cute Stylized Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 24, 24), skinMat);
    head.scale.set(1.0, 1.1, 1.05);
    head.castShadow = true;
    this.headGroup.add(head);

    // Expressive Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-0.05, 0.05].forEach(ex => {
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), eyeWhiteMat);
      eyeWhite.scale.set(1.0, 1.2, 0.5);
      eyeWhite.position.set(ex, 0.02, 0.135);
      this.headGroup.add(eyeWhite);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 10), eyeMat);
      pupil.position.set(ex, 0.02, 0.148);
      this.headGroup.add(pupil);

      // Eye catchlight
      const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 8), eyeWhiteMat);
      catchlight.position.set(ex + 0.004, 0.025, 0.155);
      this.headGroup.add(catchlight);
    });

    // Friendly Smile
    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.025, 0.004, 8, 16, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xbe185d })
    );
    smile.rotation.z = Math.PI;
    smile.position.set(0, -0.045, 0.142);
    this.headGroup.add(smile);

    // Stylish Wireframe Glasses
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
    [-0.05, 0.05].forEach(gx => {
      const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.0035, 12, 24), frameMat);
      lensRing.position.set(gx, 0.02, 0.146);
      this.headGroup.add(lensRing);
    });
    // Bridge between glasses
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.004, 0.004), frameMat);
    bridge.position.set(0, 0.025, 0.148);
    this.headGroup.add(bridge);

    // Hair: Stylized Bun & Front Strands
    const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.152, 20, 20), hairMat);
    hairBase.position.set(0, 0.03, -0.02);
    this.headGroup.add(hairBase);

    const hairBun = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), hairMat);
    hairBun.position.set(0, 0.16, -0.08);
    this.headGroup.add(hairBun);

    // Front Hair Bangs/Strands
    const bang1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.03), hairMat);
    bang1.position.set(-0.06, 0.1, 0.12);
    bang1.rotation.z = 0.2;
    this.headGroup.add(bang1);

    const bang2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.03), hairMat);
    bang2.position.set(0.06, 0.1, 0.12);
    bang2.rotation.z = -0.2;
    this.headGroup.add(bang2);

    this.torsoGroup.add(this.headGroup);

    // 5. Left Arm (Resting naturally)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.21, 0.18, 0);

    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.38, 12), hoodieMat);
    leftArm.position.set(-0.04, -0.16, 0.04);
    leftArm.rotation.z = 0.2;
    leftArmGroup.add(leftArm);

    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 12), skinMat);
    leftHand.position.set(-0.08, -0.34, 0.06);
    leftArmGroup.add(leftHand);

    this.torsoGroup.add(leftArmGroup);

    // 6. Right Arm (Waving Arm Rigged with Pivot)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.21, 0.18, 0);

    // Upper Arm
    this.rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.038, 0.24, 12), hoodieMat);
    this.rightUpperArm.position.set(0.06, 0.06, 0.04);
    this.rightUpperArm.rotation.z = -1.2;
    this.rightArmGroup.add(this.rightUpperArm);

    // Forearm & Hand Pivot for Waving
    this.forearmPivot = new THREE.Group();
    this.forearmPivot.position.set(0.14, 0.14, 0.06);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.032, 0.22, 12), hoodieMat);
    forearm.position.set(0, 0.1, 0);
    this.forearmPivot.add(forearm);

    // Waving Hand
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.075, 0.02), skinMat);
    hand.position.set(0, 0.22, 0);
    this.forearmPivot.add(hand);

    // 4 Fingers
    for (let f = 0; f < 4; f++) {
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.028, 0.015), skinMat);
      finger.position.set(-0.022 + f * 0.015, 0.265, 0);
      this.forearmPivot.add(finger);
    }

    this.rightArmGroup.add(this.forearmPivot);
    this.torsoGroup.add(this.rightArmGroup);

    this.group.add(this.torsoGroup);

    // Make character interactive on click
    this.group.userData = { isAvatar: true };
    if (this.experience.room?.interactiveObjects) {
      this.experience.room.interactiveObjects.push(this.group);
    }
  }

  setupSpeechBubbleUI() {
    // Create HTML speech bubble anchored over the 3D character
    let bubble = document.getElementById('avatar-speech-bubble');
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.id = 'avatar-speech-bubble';
      bubble.className = 'avatar-speech-bubble glass-panel hidden';
      bubble.innerHTML = `
        <div class="speech-header">
          <span class="avatar-badge">👩‍💻 Molly Arora (AI Host)</span>
          <button id="speech-audio-toggle" class="bubble-btn" title="Toggle Voice Sound">🔊 Voice ON</button>
        </div>
        <p id="speech-text" class="speech-text"></p>
      `;
      document.body.appendChild(bubble);

      const toggleBtn = document.getElementById('speech-audio-toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.experience.audioManager?.toggleMute();
          const isMuted = this.experience.audioManager?.isMuted;
          toggleBtn.innerText = isMuted ? '🔇 Voice OFF' : '🔊 Voice ON';
        });
      }
    }
    this.bubbleElement = bubble;
  }

  wave() {
    if (this.isWaving) return;
    this.isWaving = true;
    this.audioManager?.playWhoosh();

    const tl = gsap.timeline({
      onComplete: () => {
        this.isWaving = false;
      }
    });

    // Waving hand oscillation
    tl.to(this.forearmPivot.rotation, { z: 0.35, duration: 0.25, ease: "power1.inOut" })
      .to(this.forearmPivot.rotation, { z: -0.35, duration: 0.25, yoyo: true, repeat: 5, ease: "power1.inOut" })
      .to(this.forearmPivot.rotation, { z: 0, duration: 0.3, ease: "power2.out" });
  }

  speak(text) {
    if (!this.bubbleElement) return;

    if (this.typeInterval) {
      clearInterval(this.typeInterval);
      this.typeInterval = null;
    }

    const textEl = document.getElementById('speech-text');
    if (textEl) textEl.innerText = '';

    this.bubbleElement.classList.remove('hidden');
    this.bubbleElement.classList.add('active');

    // Typewriter effect in speech bubble
    let i = 0;
    const typeSpeed = 18;
    this.typeInterval = setInterval(() => {
      if (textEl && i < text.length) {
        textEl.innerText += text[i];
        i++;
      } else {
        clearInterval(this.typeInterval);
        this.typeInterval = null;
      }
    }, typeSpeed);

    // Play TTS Web Speech Synthesis if audio is enabled
    if ('speechSynthesis' in window && !this.experience.audioManager?.isMuted) {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.15;
      utterance.volume = 0.9;

      // Select natural female voice if available
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Zira') || (v.lang.startsWith('en') && v.name.includes('Female')));
      if (femaleVoice) utterance.voice = femaleVoice;

      window.speechSynthesis.speak(utterance);
    }

    // Auto-hide bubble after reading duration
    clearTimeout(this.bubbleTimer);
    const readingTime = Math.max(5000, text.length * 65);
    this.bubbleTimer = setTimeout(() => {
      this.bubbleElement.classList.remove('active');
      setTimeout(() => this.bubbleElement.classList.add('hidden'), 300);
    }, readingTime);
  }

  update(delta) {
    this.time += delta;

    // Idle breathing & natural torso bobbing
    if (this.torsoGroup) {
      this.torsoGroup.position.y = 0.96 + Math.sin(this.time * 2.0) * 0.006;
      this.headGroup.rotation.y = Math.sin(this.time * 1.2) * 0.08;
      this.headGroup.rotation.x = Math.sin(this.time * 1.5) * 0.04;
    }

    // Screen projection position for speech bubble
    if (this.bubbleElement && this.bubbleElement.classList.contains('active')) {
      const headPos = new THREE.Vector3(this.position.x, this.position.y + 1.45, this.position.z);
      headPos.project(this.experience.camera.instance);

      const x = (headPos.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-(headPos.y * 0.5) + 0.5) * window.innerHeight;

      // Check if in front of camera
      if (headPos.z < 1) {
        this.bubbleElement.style.left = `${Math.min(window.innerWidth - 340, Math.max(20, x - 80))}px`;
        this.bubbleElement.style.top = `${Math.max(80, y - 170)}px`;
      }
    }
  }
}

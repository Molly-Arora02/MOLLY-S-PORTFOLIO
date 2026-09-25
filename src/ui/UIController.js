import confetti from 'canvas-confetti';
import { mollyData } from '../data/mollyData.js';

export default class UIController {
  constructor(experience) {
    this.experience = experience;
    this.camera = experience.camera;
    this.audioManager = experience.audioManager;
    this.data = mollyData;

    this.currentView = 'overview';
    this.is2DMode = false;

    this.initElements();
    this.setupListeners();
    this.populateData();
  }

  initElements() {
    this.navButtons = document.querySelectorAll('.nav-btn');
    this.viewOverlay = document.getElementById('view-context-overlay');
    this.monitorsPanel = document.getElementById('monitors-panel');
    this.rubikPanel = document.getElementById('rubik-panel');
    this.whiteboardPanel = document.getElementById('whiteboard-panel');
    this.arcadePanel = document.getElementById('arcade-panel');
    this.trophyModal = document.getElementById('trophy-modal');
    this.resumeModal = document.getElementById('resume-modal');
    this.contactModal = document.getElementById('contact-modal');
    this.factToast = document.getElementById('fact-toast');
    this.audioBtn = document.getElementById('audio-toggle-btn');
    this.mode2DBtn = document.getElementById('mode-toggle-btn');
    this.mode2DContainer = document.getElementById('mode-2d-container');
    this.backToRoomBtn = document.getElementById('back-to-room-btn');
  }

  setupListeners() {
    // Nav buttons
    this.navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (view === 'resume') {
          this.openModal('resume-modal');
        } else if (view === 'contact') {
          this.openModal('contact-modal');
        } else if (view === 'trophy') {
          this.switchView('trophy');
          this.experience.celebrateTrophy();
        } else {
          this.switchView(view);
        }
      });
    });

    // Back to room overview button
    if (this.backToRoomBtn) {
      this.backToRoomBtn.addEventListener('click', () => {
        this.switchView('overview');
      });
    }

    // Audio toggle
    if (this.audioBtn) {
      this.audioBtn.addEventListener('click', () => {
        const isPlaying = this.audioManager.toggleMute();
        this.audioBtn.innerHTML = isPlaying
          ? `<span class="icon">🔊</span> Sound: ON`
          : `<span class="icon">🔇</span> Sound: OFF`;
        this.audioBtn.classList.toggle('active', isPlaying);
      });
    }

    // 2D / 3D Mode toggle
    if (this.mode2DBtn) {
      this.mode2DBtn.addEventListener('click', () => {
        this.is2DMode = !this.is2DMode;
        if (this.is2DMode) {
          this.mode2DContainer.classList.remove('hidden');
          this.mode2DBtn.innerHTML = `<span>🧊 Switch to 3D Room</span>`;
          document.body.classList.add('mode-2d-active');
        } else {
          this.mode2DContainer.classList.add('hidden');
          this.mode2DBtn.innerHTML = `<span>📄 Accessible 2D View</span>`;
          document.body.classList.remove('mode-2d-active');
        }
      });
    }

    // Listen for custom viewchange events from 3D raycaster
    window.addEventListener('viewchange', (e) => {
      this.updateViewUI(e.detail.view);
    });

    // Listen for Rubik sticker facts
    window.addEventListener('rubikfact', (e) => {
      this.showFactToast(e.detail);
    });

    // Listen for Trophy click
    window.addEventListener('showtrophymodal', () => {
      this.openModal('trophy-modal');
    });

    // Rubik slice controls
    document.querySelectorAll('.rubik-turn-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const axis = btn.dataset.axis;
        const layer = parseInt(btn.dataset.layer, 10);
        const dir = parseInt(btn.dataset.dir || '1', 10);
        this.experience.room?.rubiksCube?.rotateSlice(axis, layer, (Math.PI / 2) * dir);
      });
    });

    document.getElementById('rubik-scramble-btn')?.addEventListener('click', () => {
      this.experience.room?.rubiksCube?.scramble();
    });

    document.getElementById('rubik-solve-btn')?.addEventListener('click', () => {
      this.experience.room?.rubiksCube?.resetSolved();
    });

    // Whiteboard drawing toolbar
    document.querySelectorAll('.wb-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.wb-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const color = btn.dataset.color;
        this.experience.room?.whiteboard?.setColor(color);
      });
    });

    document.querySelectorAll('.wb-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        this.experience.room?.whiteboard?.drawPreset(preset);
      });
    });

    document.getElementById('wb-clear-btn')?.addEventListener('click', () => {
      this.experience.room?.whiteboard?.clear();
    });

    // Arcade controls
    document.querySelectorAll('.arcade-game-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.arcade-game-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const game = btn.dataset.game;
        this.experience.room?.arcadeScreen?.initGame(game);
      });
    });

    document.querySelectorAll('.arcade-dpad-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        this.experience.room?.arcadeScreen?.handleKey(key);
      });
    });

    // Keyboard controls for arcade
    window.addEventListener('keydown', (e) => {
      if (this.currentView === 'arcade') {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) {
          e.preventDefault();
          this.experience.room?.arcadeScreen?.handleKey(e.key);
        }
      }
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          el.closest('.modal-container')?.classList.remove('active');
        }
      });
    });

    // Contact form submit simulation
    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.target;
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending Message...';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Message Sent Successfully! ✨';
        submitBtn.style.background = '#10b981';
        this.audioManager.playTrophyFanfare();
        confetti({ particleCount: 50, spread: 60 });
        setTimeout(() => {
          this.closeModal('contact-modal');
          form.reset();
          submitBtn.textContent = 'Send Message';
          submitBtn.style.background = '';
        }, 2000);
      }, 1000);
    });
  }

  switchView(viewName) {
    this.camera.setView(viewName, () => {
      this.updateViewUI(viewName);
    });
    this.updateViewUI(viewName);
  }

  updateViewUI(viewName) {
    this.currentView = viewName;

    // Update active nav button
    this.navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Hide all contextual panels first
    if (this.monitorsPanel) this.monitorsPanel.classList.add('hidden');
    if (this.rubikPanel) this.rubikPanel.classList.add('hidden');
    if (this.whiteboardPanel) this.whiteboardPanel.classList.add('hidden');
    if (this.arcadePanel) this.arcadePanel.classList.add('hidden');

    // Show back button if zoomed in
    if (this.backToRoomBtn) {
      if (viewName !== 'overview') {
        this.backToRoomBtn.classList.remove('hidden');
      } else {
        this.backToRoomBtn.classList.add('hidden');
      }
    }

    // Show corresponding contextual panel
    if (viewName === 'monitors' && this.monitorsPanel) {
      this.monitorsPanel.classList.remove('hidden');
    } else if (viewName === 'rubik' && this.rubikPanel) {
      this.rubikPanel.classList.remove('hidden');
    } else if (viewName === 'whiteboard' && this.whiteboardPanel) {
      this.whiteboardPanel.classList.remove('hidden');
    } else if (viewName === 'arcade' && this.arcadePanel) {
      this.arcadePanel.classList.remove('hidden');
    }
  }

  showFactToast({ faceKey, fact }) {
    if (!this.factToast || !fact) return;
    const titleEl = this.factToast.querySelector('.fact-title');
    const descEl = this.factToast.querySelector('.fact-desc');
    const tagEl = this.factToast.querySelector('.fact-tag');

    if (titleEl) titleEl.textContent = fact.title;
    if (descEl) descEl.textContent = fact.desc;
    if (tagEl) {
      tagEl.textContent = `Facet: [${faceKey}]`;
      tagEl.style.backgroundColor = fact.color;
    }

    this.factToast.classList.add('active');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.factToast.classList.remove('active');
    }, 4500);
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      this.audioManager?.playClick();
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  populateData() {
    // Populate Projects Grid in Monitor Drawer & 2D view
    const projectsContainer = document.getElementById('projects-grid-container');
    const projects2D = document.getElementById('projects-2d-grid');

    const projectCardsHtml = this.data.projects.map(p => `
      <div class="project-card ${p.featured ? 'featured' : ''}">
        <div class="project-header">
          <span class="project-category" style="background:${p.color}22; color:${p.color}; border:1px solid ${p.color}44;">
            ${p.category}
          </span>
          ${p.featured ? '<span class="featured-badge">⭐ Star Product</span>' : ''}
        </div>
        <h3 class="project-title">${p.title}</h3>
        <p class="project-tagline">${p.tagline}</p>
        <p class="project-desc">${p.description}</p>
        <div class="project-tech-pills">
          ${p.tech.map(t => `<span class="tech-pill">${t}</span>`).join('')}
        </div>
        <div class="project-links" style="display:flex; flex-wrap:wrap; gap:6px;">
          ${p.live && p.live !== '#' ? `
            <a href="${p.live}" target="_blank" rel="noreferrer" class="project-link-btn primary">
              <span>🚀 Live Demo</span>
            </a>
          ` : ''}
          ${p.recipe ? `
            <a href="${p.recipe}" target="_blank" rel="noreferrer" class="project-link-btn" style="background:rgba(6,182,212,0.2); border-color:var(--accent-cyan); color:var(--accent-cyan);">
              <span>🎙️ Agora Recipe</span>
            </a>
          ` : ''}
          <a href="${p.github}" target="_blank" rel="noreferrer" class="project-link-btn">
            <span>🐙 GitHub</span>
          </a>
        </div>
      </div>
    `).join('');

    if (projectsContainer) projectsContainer.innerHTML = projectCardsHtml;
    if (projects2D) projects2D.innerHTML = projectCardsHtml;

    // Populate Experience & Timeline
    const expContainer = document.getElementById('experience-timeline-container');
    const exp2D = document.getElementById('experience-2d-timeline');

    const expHtml = this.data.experience.map(e => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-header">
            <h4>${e.role}</h4>
            <span class="timeline-badge">${e.badge}</span>
          </div>
          <p class="timeline-company">${e.company} • <span class="timeline-period">${e.period}</span></p>
          <p class="timeline-loc">${e.location}</p>
          <ul class="timeline-bullets">
            ${e.highlights.map(h => `<li>${h}</li>`).join('')}
          </ul>
        </div>
      </div>
    `).join('');

    if (expContainer) expContainer.innerHTML = expHtml;
    if (exp2D) exp2D.innerHTML = expHtml;

    // Populate Education
    const eduContainer = document.getElementById('education-list-container');
    const edu2D = document.getElementById('education-2d-list');

    const eduHtml = this.data.education.map(ed => `
      <div class="edu-card">
        <div class="edu-icon">🎓</div>
        <div class="edu-details">
          <h4>${ed.degree}</h4>
          <p class="edu-inst">${ed.institution}</p>
          <p class="edu-meta">${ed.period} | ${ed.location}</p>
          <p class="edu-desc">${ed.description}</p>
        </div>
      </div>
    `).join('');

    if (eduContainer) eduContainer.innerHTML = eduHtml;
    if (edu2D) edu2D.innerHTML = eduHtml;

    // Populate Skills
    const skillsContainer = document.getElementById('skills-2d-grid');
    if (skillsContainer) {
      skillsContainer.innerHTML = Object.entries(this.data.skills).map(([category, list]) => `
        <div class="skill-category-card">
          <h4 class="skill-cat-title">${category}</h4>
          <div class="skill-bars">
            ${list.map(s => `
              <div class="skill-row">
                <div class="skill-info">
                  <span class="skill-name">${s.name}</span>
                  <span class="skill-tag">${s.tag}</span>
                </div>
                <div class="skill-bar-bg">
                  <div class="skill-bar-fill" style="width:${s.level}%;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    }

    // Populate Certifications
    const certsContainer = document.getElementById('certs-2d-grid');
    if (certsContainer) {
      certsContainer.innerHTML = this.data.certifications.map(c => `
        <div class="cert-card">
          <div class="cert-badge">${c.badge}</div>
          <h4 class="cert-title">${c.title}</h4>
          <p class="cert-org">${c.organization}</p>
          <p class="cert-desc">${c.desc}</p>
        </div>
      `).join('');
    }
  }
}

import confetti from 'canvas-confetti';
import { mollyData } from '../data/mollyData.js';
import ChatbotAssistant from './ChatbotAssistant.js';

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
    this.initClockAndCalendar();
    this.initChatbot();
  }

  initChatbot() {
    this.chatbot = new ChatbotAssistant(this.experience, this);
  }

  initElements() {
    this.navButtons = document.querySelectorAll('.nav-btn');
    this.viewOverlay = document.getElementById('view-context-overlay');
    this.monitorsPanel = document.getElementById('monitors-panel');
    this.rubikPanel = document.getElementById('rubik-panel');
    this.whiteboardPanel = document.getElementById('whiteboard-panel');
    this.arcadePanel = document.getElementById('arcade-panel');
    this.visionPanel = document.getElementById('vision-panel');
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

    // Listen for Corner Lamp mode toggle
    window.addEventListener('showlamptoast', (e) => {
      this.showFactToast({
        color: 'Lamp',
        title: e.detail.title,
        fact: e.detail.desc
      });
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

    // --- AI Smart Board Studio Controls ---
    // 1. Tab Switching
    document.querySelectorAll('.sb-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sb-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.sb-tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tabId = `sb-tab-${btn.dataset.tab}`;
        document.getElementById(tabId)?.classList.add('active');
      });
    });

    // 2. Drawing Tools & Markers
    const setWbTool = (toolName, activeBtn) => {
      document.querySelectorAll('.wb-tool-btn').forEach(b => b.classList.remove('active'));
      activeBtn?.classList.add('active');
      this.experience.room?.whiteboard?.setTool(toolName);
    };

    document.getElementById('wb-tool-pen')?.addEventListener('click', (e) => setWbTool('pen', e.currentTarget));
    document.getElementById('wb-tool-highlighter')?.addEventListener('click', (e) => setWbTool('highlighter', e.currentTarget));
    document.getElementById('wb-tool-eraser')?.addEventListener('click', (e) => setWbTool('eraser', e.currentTarget));

    // Color buttons
    document.querySelectorAll('.wb-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.wb-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const color = btn.dataset.color;
        this.experience.room?.whiteboard?.setColor(color);
      });
    });

    // Undo & Clear
    document.getElementById('wb-undo-btn')?.addEventListener('click', () => {
      this.experience.room?.whiteboard?.undo();
    });

    document.getElementById('wb-clear-btn')?.addEventListener('click', () => {
      this.experience.room?.whiteboard?.clear();
    });

    // 3. Text Placement
    const handleAddText = () => {
      const input = document.getElementById('wb-text-input');
      if (input && input.value.trim()) {
        this.experience.room?.whiteboard?.addText(input.value.trim());
        input.value = '';
      }
    };
    document.getElementById('wb-add-text-btn')?.addEventListener('click', handleAddText);
    document.getElementById('wb-text-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAddText();
    });

    // Sticky note color selection & pinning
    let currentStickyColor = '#fef08a';
    document.querySelectorAll('.wb-note-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.wb-note-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentStickyColor = btn.dataset.color || '#fef08a';
      });
    });

    document.getElementById('wb-add-sticky-btn')?.addEventListener('click', () => {
      const titleInput = document.getElementById('wb-sticky-title');
      const bodyInput = document.getElementById('wb-sticky-text');
      const title = titleInput?.value.trim() || 'Quick Note';
      const body = bodyInput?.value.trim() || '• Brainstorm item\n• High priority action';
      
      this.experience.room?.whiteboard?.addStickyNote(title, body, currentStickyColor);
      if (titleInput) titleInput.value = '';
      if (bodyInput) bodyInput.value = '';
    });

    // 4. Image Upload & Sticker Stamping
    const fileInput = document.getElementById('wb-image-upload');
    document.getElementById('wb-upload-trigger-btn')?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          this.experience.room?.whiteboard?.insertImage(loadEvent.target.result, file.name);
        };
        reader.readAsDataURL(file);
        // Reset file input so user can re-upload same file if desired
        fileInput.value = '';
      }
    });

    document.querySelectorAll('.wb-sticker-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.dataset.emoji || '💡';
        const label = btn.dataset.label || 'Brainstorm';
        this.experience.room?.whiteboard?.drawSticker(emoji, label);
      });
    });

    // 5. Brainstorming Presets
    document.querySelectorAll('.wb-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        this.experience.room?.whiteboard?.drawPreset(preset);
      });
    });

    // 6. YouTube Music Player & Audio Visualizer
    const ytFrame = document.getElementById('youtube-smart-frame');
    const ytNowPlaying = document.getElementById('yt-now-playing');
    let isVisualizerEnabled = true;
    let currentMusicTitle = 'Lofi Girl • Study/Relax';

    const extractYouTubeId = (input) => {
      if (!input) return 'jfKfPfyJRdk';
      const clean = input.trim();
      if (clean.length === 11 && !clean.includes('/') && !clean.includes('?')) return clean;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = clean.match(regExp);
      return (match && match[2].length === 11) ? match[2] : clean;
    };

    const playYouTubeVideo = (videoId, title) => {
      if (!ytFrame) return;
      ytFrame.src = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&autoplay=1`;
      currentMusicTitle = title || 'Custom YouTube Stream';
      if (ytNowPlaying) ytNowPlaying.textContent = `🎵 ${currentMusicTitle}`;
      if (isVisualizerEnabled) {
        this.experience.room?.whiteboard?.setPlayingMusic(true, currentMusicTitle);
      }
    };

    document.getElementById('yt-load-btn')?.addEventListener('click', () => {
      const input = document.getElementById('yt-url-input');
      if (input && input.value.trim()) {
        const videoId = extractYouTubeId(input.value.trim());
        document.querySelectorAll('.yt-preset-btn').forEach(b => b.classList.remove('active'));
        playYouTubeVideo(videoId, 'YouTube Music Stream');
        input.value = '';
      }
    });

    document.querySelectorAll('.yt-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.yt-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const ytid = btn.dataset.ytid;
        const title = btn.dataset.title;
        playYouTubeVideo(ytid, title);
      });
    });

    document.getElementById('yt-toggle-visualizer')?.addEventListener('click', (e) => {
      isVisualizerEnabled = !isVisualizerEnabled;
      const btn = e.currentTarget;
      if (btn) {
        btn.textContent = isVisualizerEnabled ? '📊 3D Visualizer: ON' : '📊 3D Visualizer: OFF';
      }
      this.experience.room?.whiteboard?.setPlayingMusic(isVisualizerEnabled, currentMusicTitle);
    });

    // 7. Save to LocalStorage, Restore & Export PNG to Desktop
    document.getElementById('wb-save-storage-btn')?.addEventListener('click', () => {
      this.experience.room?.whiteboard?.saveToLocalStorage(false);
    });

    document.getElementById('wb-load-storage-btn')?.addEventListener('click', () => {
      this.experience.room?.whiteboard?.loadFromLocalStorage();
    });

    document.getElementById('wb-export-png-btn')?.addEventListener('click', () => {
      const filename = `molly_smartboard_brainstorm_${new Date().toISOString().slice(0, 10)}.png`;
      this.experience.room?.whiteboard?.exportToDesktop(filename);
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

    // Direct Mail App delivery
    const handleMailDraft = (isWebGmail = false) => {
      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const msgInput = document.getElementById('message');

      const name = nameInput?.value.trim() || 'Recruiter / Hiring Manager';
      const email = emailInput?.value.trim() || '';
      const message = msgInput?.value.trim() || 'Hi Molly, I would love to connect with you regarding an opportunity.';

      const subject = `🚀 Portfolio Opportunity for Molly Arora from ${name}`;
      const body = `Hi Molly,\n\n${message}\n\nBest regards,\n${name}\nEmail: ${email}`;

      // Copy drafted message to clipboard for convenience
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`To: aroramolly180@gmail.com\nSubject: ${subject}\n\n${body}`);
      }

      this.audioManager.playTrophyFanfare();
      confetti({ particleCount: 60, spread: 70 });

      if (isWebGmail) {
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=aroramolly180@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(gmailUrl, '_blank');
      } else {
        const mailtoUrl = `mailto:aroramolly180@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
      }
    };

    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleMailDraft(false);
      const submitBtn = document.getElementById('send-mail-btn');
      if (submitBtn) {
        submitBtn.textContent = 'Opened in Mail App! ✨';
        submitBtn.style.background = '#10b981';
        setTimeout(() => {
          this.closeModal('contact-modal');
          submitBtn.textContent = '🚀 Send via Default Mail App (Apple Mail / Outlook)';
          submitBtn.style.background = '';
        }, 2500);
      }
    });

    document.getElementById('send-web-gmail-btn')?.addEventListener('click', () => {
      handleMailDraft(true);
      const gmailBtn = document.getElementById('send-web-gmail-btn');
      if (gmailBtn) {
        gmailBtn.textContent = 'Opened in Gmail Web! 🔴';
        gmailBtn.style.borderColor = '#10b981';
        gmailBtn.style.color = '#10b981';
        setTimeout(() => {
          this.closeModal('contact-modal');
          gmailBtn.textContent = '🔴 Compose in Web Gmail Directly';
          gmailBtn.style.borderColor = '';
          gmailBtn.style.color = '';
        }, 2500);
      }
    });

    // One-click Copy Email Button
    document.getElementById('copy-email-btn')?.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText('aroramolly180@gmail.com');
      }
      const copyBtn = document.getElementById('copy-email-btn');
      if (copyBtn) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied: aroramolly180@gmail.com';
        copyBtn.style.borderColor = '#10b981';
        copyBtn.style.color = '#10b981';
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.borderColor = '';
          copyBtn.style.color = '';
        }, 2500);
      }
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
    if (this.visionPanel) this.visionPanel.classList.add('hidden');

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
    } else if (viewName === 'vision' && this.visionPanel) {
      this.visionPanel.classList.remove('hidden');
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
            <a href="${p.recipe}" target="_blank" rel="noreferrer" class="project-link-btn" style="background:rgba(245,158,11,0.15); border-color:var(--accent-amber); color:var(--accent-gold);">
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

    // Populate Vision Board in 3D Contextual Drawer
    const visionContainer = document.getElementById('vision-grid-container');

    if (this.data.visionBoard && visionContainer) {
      const visionHtml = this.data.visionBoard.map(v => `
        <div class="vision-card">
          <div class="vision-img-wrap">
            <img src="${v.image}" alt="${v.title}" loading="lazy" class="vision-img">
            <span class="vision-tag" style="background:${v.accent || '#f59e0b'}; color:#111215;">
              ${v.tag}
            </span>
          </div>
          <div class="vision-content">
            <h3 class="vision-title">${v.title}</h3>
            <p class="vision-subtitle">${v.subtitle}</p>
            <p class="vision-mantra">${v.mantra}</p>
            <p class="vision-desc">${v.desc}</p>
          </div>
        </div>
      `).join('');

      visionContainer.innerHTML = visionHtml;
    }
  }

  initClockAndCalendar() {
    // 1. Calendar Events Dictionary (Load from localStorage or use defaults)
    const saved = localStorage.getItem('molly_calendar_events');
    this.calendarEvents = saved ? JSON.parse(saved) : {
      '2026-09-27': ['🚀 DevSummit 2026 Finalist (8th Rank PAN India)', '⚡ Smart Board & Clock Live Deployment'],
      '2026-09-30': ['🧠 Multi-Agent Swarm Orchestrator Launch', '🧪 Audio Anomaly Detection Benchmark'],
      '2026-10-05': ['🎵 MUSE AI v2 Real-Time Chord Progression', '📱 Agora Voice AI SDK Demo'],
      '2026-10-12': ['👁️ Focus Forge Gaze Vector Model Evaluation', '🏆 IIT Mandi Winter AI Lab Showcase'],
      '2026-10-20': ['🌸 Tokyo / Japan AI Research & Travel Booking', '🏎️ Mercedes AMG Vision Goal Review']
    };

    const today = new Date();
    this.calCurrentYear = today.getFullYear();
    this.calCurrentMonth = today.getMonth();
    this.calSelectedDate = new Date(today);

    // 2. Real-time Live Clock & Timezones Ticker
    const updateTimeUI = () => {
      const now = new Date();
      const hours24 = now.getHours();
      const hours12 = hours24 % 12 || 12;
      const ampm = hours24 >= 12 ? 'PM' : 'AM';
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      const timeStr = `${String(hours12).padStart(2, '0')}:${mins}:${secs} ${ampm}`;

      const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const daysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthsLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      const dateStrNav = `${daysShort[now.getDay()]}, ${monthsShort[now.getMonth()]} ${now.getDate()}`;
      const fullDateModal = `${daysLong[now.getDay()]}, ${monthsLong[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

      // Update Nav Bar Clock & Date
      const navClockEl = document.getElementById('nav-live-clock');
      const navDateEl = document.getElementById('nav-live-date');
      if (navClockEl) navClockEl.textContent = timeStr;
      if (navDateEl) navDateEl.textContent = dateStrNav;

      // Update Modal Clock & Full Date
      const modalClockEl = document.getElementById('modal-digital-clock');
      const modalDateEl = document.getElementById('modal-full-date');
      if (modalClockEl) modalClockEl.textContent = timeStr;
      if (modalDateEl) modalDateEl.textContent = fullDateModal;

      // World Timezones Format
      const formatTZ = (timeZone) => {
        try {
          return now.toLocaleTimeString('en-US', {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });
        } catch (e) {
          return timeStr;
        }
      };

      const delhiEl = document.getElementById('tz-time-delhi');
      const tokyoEl = document.getElementById('tz-time-tokyo');
      const sfEl = document.getElementById('tz-time-sf');
      const londonEl = document.getElementById('tz-time-london');
      const nyEl = document.getElementById('tz-time-ny');

      if (delhiEl) delhiEl.textContent = formatTZ('Asia/Kolkata');
      if (tokyoEl) tokyoEl.textContent = formatTZ('Asia/Tokyo');
      if (sfEl) sfEl.textContent = formatTZ('America/Los_Angeles');
      if (londonEl) londonEl.textContent = formatTZ('Europe/London');
      if (nyEl) nyEl.textContent = formatTZ('America/New_York');
    };

    updateTimeUI();
    setInterval(updateTimeUI, 1000);

    // 3. Calendar Month Renderer
    const monthsLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const renderCalendar = () => {
      const titleEl = document.getElementById('cal-month-title');
      if (titleEl) {
        titleEl.textContent = `${monthsLong[this.calCurrentMonth]} ${this.calCurrentYear}`;
      }

      const gridEl = document.getElementById('calendar-grid-cells');
      if (!gridEl) return;
      gridEl.innerHTML = '';

      const firstDayIndex = new Date(this.calCurrentYear, this.calCurrentMonth, 1).getDay();
      const daysInMonth = new Date(this.calCurrentYear, this.calCurrentMonth + 1, 0).getDate();
      const prevMonthDays = new Date(this.calCurrentYear, this.calCurrentMonth, 0).getDate();

      const todayDate = new Date();
      const isCurrentMonth = todayDate.getFullYear() === this.calCurrentYear && todayDate.getMonth() === this.calCurrentMonth;

      // Previous month trailing days
      for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = prevMonthDays - i;
        const cell = document.createElement('div');
        cell.className = 'cal-cell other-month';
        cell.innerHTML = `<span class="cal-date-num">${d}</span>`;
        gridEl.appendChild(cell);
      }

      // Current month days
      for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell';
        const dateKey = `${this.calCurrentYear}-${String(this.calCurrentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        const isToday = isCurrentMonth && d === todayDate.getDate();
        if (isToday) cell.classList.add('today');

        const isSelected = this.calSelectedDate.getFullYear() === this.calCurrentYear &&
                           this.calSelectedDate.getMonth() === this.calCurrentMonth &&
                           this.calSelectedDate.getDate() === d;
        if (isSelected) cell.classList.add('selected');

        const events = this.calendarEvents[dateKey] || [];
        let dotsHtml = '';
        if (events.length > 0) {
          dotsHtml = `<div class="cal-dot-container">${events.map(() => '<span class="cal-dot"></span>').join('')}</div>`;
        }

        cell.innerHTML = `
          <span class="cal-date-num">${d}</span>
          ${dotsHtml}
        `;

        cell.addEventListener('click', () => {
          this.calSelectedDate = new Date(this.calCurrentYear, this.calCurrentMonth, d);
          document.querySelectorAll('.cal-cell').forEach(c => c.classList.remove('selected'));
          cell.classList.add('selected');
          renderSelectedEvents();
        });

        gridEl.appendChild(cell);
      }

      renderSelectedEvents();
    };

    const renderSelectedEvents = () => {
      const headingEl = document.getElementById('cal-selected-date-heading');
      const listEl = document.getElementById('cal-events-list');
      if (!listEl) return;

      const y = this.calSelectedDate.getFullYear();
      const m = String(this.calSelectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(this.calSelectedDate.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;

      const dateReadable = this.calSelectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      if (headingEl) {
        headingEl.textContent = `📅 Selected: ${dateReadable}`;
      }

      const events = this.calendarEvents[dateKey] || [];
      if (events.length === 0) {
        listEl.innerHTML = `
          <div style="font-size:0.8rem; color:var(--text-muted); font-style:italic; padding:6px 0;">
            No scheduled milestones for this date yet. Add an event below!
          </div>
        `;
      } else {
        listEl.innerHTML = events.map((ev, idx) => `
          <div class="cal-event-item">
            <span>${ev}</span>
            <button class="cal-del-btn" data-key="${dateKey}" data-idx="${idx}" style="background:none; border:none; color:#f87171; cursor:pointer; font-size:0.85rem;" title="Remove event">✕</button>
          </div>
        `).join('');

        // Delete event listeners
        listEl.querySelectorAll('.cal-del-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const key = btn.dataset.key;
            const index = parseInt(btn.dataset.idx, 10);
            if (this.calendarEvents[key]) {
              this.calendarEvents[key].splice(index, 1);
              if (this.calendarEvents[key].length === 0) delete this.calendarEvents[key];
              localStorage.setItem('molly_calendar_events', JSON.stringify(this.calendarEvents));
              renderCalendar();
            }
          });
        });
      }
    };

    renderCalendar();

    // 4. Month Navigation Buttons
    document.getElementById('cal-prev-month-btn')?.addEventListener('click', () => {
      this.calCurrentMonth--;
      if (this.calCurrentMonth < 0) {
        this.calCurrentMonth = 11;
        this.calCurrentYear--;
      }
      renderCalendar();
    });

    document.getElementById('cal-next-month-btn')?.addEventListener('click', () => {
      this.calCurrentMonth++;
      if (this.calCurrentMonth > 11) {
        this.calCurrentMonth = 0;
        this.calCurrentYear++;
      }
      renderCalendar();
    });

    document.getElementById('cal-today-btn')?.addEventListener('click', () => {
      const now = new Date();
      this.calCurrentYear = now.getFullYear();
      this.calCurrentMonth = now.getMonth();
      this.calSelectedDate = new Date(now);
      renderCalendar();
    });

    // 5. Add Custom Event
    const handleAddEvent = () => {
      const input = document.getElementById('cal-new-task-input');
      if (input && input.value.trim()) {
        const y = this.calSelectedDate.getFullYear();
        const m = String(this.calSelectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(this.calSelectedDate.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${d}`;

        if (!this.calendarEvents[dateKey]) {
          this.calendarEvents[dateKey] = [];
        }
        this.calendarEvents[dateKey].push(`• ${input.value.trim()}`);
        localStorage.setItem('molly_calendar_events', JSON.stringify(this.calendarEvents));
        input.value = '';
        this.audioManager?.playClick();
        renderCalendar();
      }
    };

    document.getElementById('cal-add-task-btn')?.addEventListener('click', handleAddEvent);
    document.getElementById('cal-new-task-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAddEvent();
    });

    // 6. Stamp Agenda to 3D Smart Board in Room
    document.getElementById('stamp-agenda-to-board-btn')?.addEventListener('click', () => {
      const y = this.calSelectedDate.getFullYear();
      const m = String(this.calSelectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(this.calSelectedDate.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;
      const events = this.calendarEvents[dateKey] || ['• Sprint brainstorming & coding'];

      const dateReadable = this.calSelectedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      const noteTitle = `📅 Agenda (${dateReadable})`;
      const noteBody = events.join('\n');

      this.experience.room?.whiteboard?.addStickyNote(noteTitle, noteBody, '#fef08a', 280, 240);
      this.closeModal('calendar-modal');
      this.switchView('whiteboard');
      this.experience.room?.whiteboard?.showToast('📋 Stamped Agenda to Smart Board!');
    });

    // 7. Navbar Clock Button Open Modal
    document.getElementById('nav-clock-btn')?.addEventListener('click', () => {
      this.openModal('calendar-modal');
    });

    // 8. 3D Room Raycaster Click Listener
    window.addEventListener('showcalendarmodal', () => {
      this.openModal('calendar-modal');
    });
  }
}

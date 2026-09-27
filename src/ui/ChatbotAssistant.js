import { mollyData } from '../data/mollyData.js';

export default class ChatbotAssistant {
  constructor(experience, uiController) {
    this.experience = experience;
    this.camera = experience.camera;
    this.audioManager = experience.audioManager;
    this.uiController = uiController;
    this.data = mollyData;

    this.isOpen = false;
    this.voiceEnabled = true;
    this.isSpeaking = false;
    this.isListening = false;
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
    this.cachedVoices = [];
    this.selectedVoice = null;
    this.hasSpokenWelcome = false;

    // Web Audio Context for AI chimes
    this.initAudioContext();

    this.initDOM();
    this.setupKnowledgeBase();
    this.setupVoiceSynthesis();
    this.setupSpeechRecognition();
    this.setupListeners();

    // Trigger welcoming greeting badge
    setTimeout(() => {
      this.triggerWelcomeBadge();
    }, 1500);
  }

  initAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    } catch (e) {
      console.warn('AudioContext not supported', e);
    }
  }

  playAiChime(pitch = 587.33) {
    if (!this.voiceEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, this.audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, this.audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.3);
    } catch (e) {
      // Ignore audio chime errors
    }
  }

  initDOM() {
    // 1. Floating AI Avatar Trigger Button (Bottom Right)
    this.triggerBtn = document.createElement('div');
    this.triggerBtn.id = 'ai-chatbot-trigger';
    this.triggerBtn.className = 'ai-chat-trigger-btn';
    this.triggerBtn.innerHTML = `
      <div class="ai-avatar-ring" id="ai-avatar-ring">
        <span class="ai-avatar-emoji">👩‍💻</span>
        <span class="ai-wave-hand" id="ai-wave-badge">👋</span>
        <span class="ai-pulse-dot"></span>
        <div class="ai-speaking-ripples" id="ai-speaking-ripples">
          <span></span><span></span><span></span>
        </div>
      </div>
      <div class="ai-trigger-label">
        <span class="ai-trigger-title">Molly AI • Voice Guide</span>
        <span class="ai-trigger-sub">Tap to Talk & Explore 3D</span>
      </div>
    `;
    document.body.appendChild(this.triggerBtn);

    // 2. Main AI Chat Assistant Window
    this.chatContainer = document.createElement('div');
    this.chatContainer.id = 'ai-chatbot-window';
    this.chatContainer.className = 'ai-chat-window glass-panel hidden';
    this.chatContainer.innerHTML = `
      <!-- Header -->
      <div class="ai-chat-header">
        <div class="ai-chat-header-info">
          <div class="ai-chat-avatar-mini" id="ai-mini-avatar">👩‍💻</div>
          <div>
            <h3 class="ai-chat-title">Molly's AI Voice Guide</h3>
            <span class="ai-chat-status">
              <span class="ai-status-indicator" id="ai-voice-status-dot"></span> 
              <span id="ai-voice-status-text">Voice Synthesis & Mic Ready</span>
            </span>
          </div>
        </div>
        <div class="ai-chat-header-actions">
          <button id="ai-voice-toggle-btn" class="ai-header-btn" title="Toggle Voice Narration">
            <span id="ai-voice-icon">🔊</span>
          </button>
          <button id="ai-chat-close-btn" class="ai-header-btn" title="Close Assistant">
            &times;
          </button>
        </div>
      </div>

      <!-- Live Voice Captions Bar -->
      <div id="ai-caption-bar" class="ai-caption-bar hidden">
        <div class="ai-caption-wave">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <div id="ai-caption-text" class="ai-caption-text">Speaking...</div>
        <button id="ai-caption-stop-btn" class="ai-caption-stop" title="Stop Speaking">⏹</button>
      </div>

      <!-- Quick Action Prompt Chips -->
      <div class="ai-prompt-chips" id="ai-prompt-chips">
        <button class="ai-chip" data-query="projects">🚀 Top AI Projects</button>
        <button class="ai-chip" data-query="hackathons">🏆 DevSummit #8 Rank</button>
        <button class="ai-chip" data-query="tour">🧭 3D Room Tour</button>
        <button class="ai-chip" data-query="vision">🎯 Vision Board</button>
        <button class="ai-chip" data-query="skills">💻 Tech Stack</button>
        <button class="ai-chip" data-query="contact">✉️ Hire / Contact</button>
      </div>

      <!-- Messages History Container -->
      <div class="ai-chat-messages" id="ai-chat-messages">
        <!-- Message bubbles dynamically injected -->
      </div>

      <!-- Voice Listening Status Bar (When Mic active) -->
      <div id="ai-mic-bar" class="ai-mic-bar hidden">
        <div class="ai-mic-pulse"></div>
        <span id="ai-mic-text">Listening... Speak now into your microphone</span>
        <button id="ai-mic-cancel-btn" class="ai-mic-cancel-btn">&times;</button>
      </div>

      <!-- Input Area -->
      <form class="ai-chat-input-form" id="ai-chat-form">
        <button type="button" id="ai-mic-btn" class="ai-mic-btn" title="Speak with Voice (Microphone)">
          <span>🎙️</span>
        </button>
        <input type="text" id="ai-chat-input" placeholder="Type or click mic to ask about Molly, projects, vision..." autocomplete="off">
        <button type="submit" id="ai-chat-send-btn" class="ai-send-btn" title="Send Message">
          <span>➤</span>
        </button>
      </form>
    `;
    document.body.appendChild(this.chatContainer);

    this.messagesList = document.getElementById('ai-chat-messages');
    this.captionBar = document.getElementById('ai-caption-bar');
    this.captionText = document.getElementById('ai-caption-text');
    this.inputField = document.getElementById('ai-chat-input');
    this.voiceToggleBtn = document.getElementById('ai-voice-toggle-btn');
    this.voiceIcon = document.getElementById('ai-voice-icon');
    this.micBtn = document.getElementById('ai-mic-btn');
    this.micBar = document.getElementById('ai-mic-bar');
    this.micText = document.getElementById('ai-mic-text');
    this.micCancelBtn = document.getElementById('ai-mic-cancel-btn');
    this.speakingRipples = document.getElementById('ai-speaking-ripples');
    this.captionStopBtn = document.getElementById('ai-caption-stop-btn');
  }

  setupVoiceSynthesis() {
    if (!this.synth) return;

    const loadVoices = () => {
      this.cachedVoices = this.synth.getVoices();
      if (this.cachedVoices && this.cachedVoices.length > 0) {
        // Find best natural female English voice
        const preferred = this.cachedVoices.find(v => 
          (v.name.includes('Samantha') || 
           v.name.includes('Google US English') || 
           v.name.includes('Google UK English Female') || 
           v.name.includes('Natural') || 
           v.name.includes('Zira') || 
           v.name.includes('Jenny') || 
           v.name.includes('Karen') || 
           v.name.includes('Victoria')) && 
          v.lang.startsWith('en')
        ) || this.cachedVoices.find(v => v.lang.startsWith('en')) || this.cachedVoices[0];

        this.selectedVoice = preferred;
      }
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }

    // Global unlock on first user gesture
    const unlockSpeech = () => {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      loadVoices();
      window.removeEventListener('pointerdown', unlockSpeech);
      window.removeEventListener('keydown', unlockSpeech);
    };
    window.addEventListener('pointerdown', unlockSpeech);
    window.addEventListener('keydown', unlockSpeech);
  }

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.micBtn?.classList.add('listening');
        this.micBar?.classList.remove('hidden');
        if (this.micText) this.micText.textContent = 'Listening... Speak now!';
        if (this.synth) this.synth.cancel();
      };

      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (this.inputField) {
          this.inputField.value = transcript;
        }
        if (this.micText) {
          this.micText.textContent = `"${transcript}"`;
        }
      };

      this.recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e);
        this.stopListening();
      };

      this.recognition.onend = () => {
        this.stopListening();
        const text = this.inputField?.value.trim();
        if (text) {
          this.handleUserMessage(text);
          if (this.inputField) this.inputField.value = '';
        }
      };
    } else {
      if (this.micBtn) {
        this.micBtn.title = 'Voice input not supported in this browser';
      }
    }
  }

  startListening() {
    if (!this.recognition) {
      alert("Speech recognition isn't supported in your current browser. You can type your question or use Chrome/Safari!");
      return;
    }
    try {
      this.recognition.start();
    } catch (e) {
      this.recognition.stop();
    }
  }

  stopListening() {
    this.isListening = false;
    this.micBtn?.classList.remove('listening');
    this.micBar?.classList.add('hidden');
    try {
      if (this.recognition) this.recognition.stop();
    } catch (e) {}
  }

  setupKnowledgeBase() {
    this.knowledge = {
      greeting: {
        keywords: ['hi', 'hello', 'hey', 'greetings', 'who are you', 'what can you do', 'start', 'help'],
        text: "Hi there! I'm Molly's AI Portfolio Guide 👋 I'm here to walk you through her 3D AI Developer Lab, showcase her live projects, hackathon wins, skills, and vision board. What would you like to explore?",
        spokenText: "Hi there! I'm Molly's AI Portfolio Guide. I can walk you through her 3D AI Lab, live projects, hackathon wins, skills, and vision board. Ask me anything or choose a tour!",
        actions: [
          { label: "🚀 View AI Projects", action: "view_projects" },
          { label: "🧭 3D Room Tour", action: "tour_room" },
          { label: "🎯 Vision Board", action: "view_vision" },
          { label: "🏆 DevSummit Win", action: "view_trophy" }
        ]
      },
      projects: {
        keywords: ['project', 'projects', 'muse', 'satyadarshi', 'focus forge', 'vision rag', 'work', 'portfolio', 'code', 'app'],
        text: "🚀 **Molly's Top AI & Web Projects**:\n\n" +
              "1. **MUSE AI — Multi-Agent Studio**: Autonomous workflow orchestration using LangGraph, Gemini 2.0 & Next.js.\n" +
              "2. **Satyadarshi (सत्यदर्शी)**: AI-driven multilingual fake news & fact-checking system with deep credibility scoring.\n" +
              "3. **Focus Forge**: Real-time developer productivity suite with AI telemetry & gaze tracking.\n" +
              "4. **Vision RAG**: Multimodal document search powered by embedding models & vector DB.\n\n" +
              "You can click below to zoom straight into the dual-screen workstation in the 3D room!",
        spokenText: "Molly has built high-impact AI projects including MUSE AI multi-agent studio, Satyadarshi fact-checking system, Focus Forge productivity lab, and Vision RAG multimodal search. Let me take you to her dual-screen workstation!",
        actions: [
          { label: "🖥️ Zoom to Workstation", action: "view_monitors" },
          { label: "🎨 Open Smart Board", action: "view_whiteboard" },
          { label: "📂 View Code on GitHub", action: "open_github" }
        ]
      },
      hackathons: {
        keywords: ['hackathon', 'devsummit', 'award', 'trophy', 'rank', 'contest', 'coding blocks', 'achievement', 'win'],
        text: "🏆 **Hackathon & Contest Honors**:\n\n" +
              "• **DevSummit 2026**: 8th Rank PAN India out of 1,200+ teams for building an autonomous multi-agent system.\n" +
              "• **Coding Blocks C++ Star**: Mastered Data Structures, Graph Algorithms & Dynamic Programming.\n" +
              "• **Google Prompt Engineering**: Certified in LLM Agent architectures & prompt chains.",
        spokenText: "Molly achieved 8th Rank PAN India at DevSummit 2026 out of over 1,200 teams, earned the Coding Blocks C++ Star honor, and is certified in Google Prompt Engineering. Let's inspect her trophy shelf!",
        actions: [
          { label: "🏆 Celebrate on Trophy Shelf", action: "view_trophy" },
          { label: "📜 View Full Resume", action: "open_resume" }
        ]
      },
      skills: {
        keywords: ['skill', 'stack', 'languages', 'tech', 'react', 'three', 'python', 'c++', 'ai', 'frameworks'],
        text: "💻 **Technical Stack**:\n\n" +
              "• **AI & ML**: PyTorch, LangChain, LangGraph, Gemini API, RAG, HuggingFace, Vector DBs.\n" +
              "• **Frontend & 3D**: Three.js, React, TypeScript, TailwindCSS, WebGL, Canvas API, GSAP.\n" +
              "• **Backend & Systems**: Python, FastAPI, Node.js, PostgreSQL, Docker, Redis.\n" +
              "• **Core**: C++, Data Structures & Algorithms, Git, Linux.",
        spokenText: "Molly's tech stack combines PyTorch, LangChain, Gemini API, and Vector DBs with Three.js, React, TypeScript, and high-performance C++ algorithms.",
        actions: [
          { label: "🎨 Open Smart Board", action: "view_whiteboard" },
          { label: "📜 Check Resume", action: "open_resume" }
        ]
      },
      education: {
        keywords: ['education', 'college', 'degree', 'iit', 'iit mandi', 'cgpa', 'school', 'university'],
        text: "🎓 **Education & Background**:\n\n" +
              "• **IIT Mandi** — B.Tech with an outstanding **8.0 CGPA**.\n" +
              "• Coursework in Artificial Intelligence, Computer Vision, Distributed Systems, Algorithms, and Software Engineering.\n" +
              "• Active technical lead in university developer and robotics clubs.",
        spokenText: "Molly is studying at IIT Mandi with an outstanding 8.0 CGPA, focusing on Artificial Intelligence, Computer Vision, and Distributed Systems.",
        actions: [
          { label: "📜 View Resume", action: "open_resume" },
          { label: "✉️ Contact Molly", action: "open_contact" }
        ]
      },
      vision: {
        keywords: ['vision', 'board', 'dream', 'emirates', 'business class', 'travel', 'home', 'peace', 'seva', 'radha', 'jaap', 'ego', 'friends', 'youtube', 'instagram', 'startup', 'apple', 'parents', 'wardrobe'],
        text: "🎯 **Molly's Grand Vision Board**:\n\n" +
              "• ✈️ **Emirates Business Class**: Flying luxury sky lounges around the globe.\n" +
              "• 🌍 **198 Countries & Beyond**: Full world exploration across Asia, Europe & beyond.\n" +
              "• 🏡 **Dream Sanctuary Home**: Architectural modern luxury villa with zen gardens.\n" +
              "• 🕊️ **Peace, Seva & Radha Nam Jaap**: Pure Seva, no ego, no revenge, no anger issues, God's favourite child.\n" +
              "• 🤝 **Genuine Friend Circle**: Loyal, inspiring, and uplifted soul connections.\n" +
              "• 📱 **Creator Stardom**: 10M+ community on YouTube & Instagram.\n" +
              "• 🦄 **Billion-Dollar AI Startup**: High-scale unicorn generating billions in revenue per year.\n" +
              "• 🍎 **The Apple Kingdom**: Full Pro studio ecosystem.\n" +
              "• 👨‍👩‍👧 **Happy & Proud Parents**: Honoring family with boundless love & pride.",
        spokenText: "Molly's Vision Board manifests Emirates business class travels across 198 countries, a serene dream home, Radha Nam Jaap, pure seva, zero ego, a genuine friend circle, 10 million creator community, a billion-dollar AI startup, and making her parents supremely happy and proud!",
        actions: [
          { label: "🎯 View 3D Vision Board", action: "view_vision" },
          { label: "🖼️ Open Full Vision Board", action: "open_vision_panel" }
        ]
      },
      whiteboard: {
        keywords: ['whiteboard', 'smart board', 'draw', 'sketch', 'write', 'sticky', 'lo-fi', 'music', 'youtube', 'youtube song', 'brainstorm'],
        text: "🎨 **AI Smart Board Studio**:\n\n" +
              "This is a full interactive smart studio! You can:\n" +
              "• Draw, doodle, and sketch manually with customizable brushes and colors.\n" +
              "• Add draggable Sticky Notes and Type text.\n" +
              "• Load System Architecture blueprints.\n" +
              "• Play Lo-Fi coding beats and YouTube songs.\n" +
              "• Save your brainstorming work directly to LocalStorage or export high-res PNG to your desktop!",
        spokenText: "The AI Smart Board Studio lets you write, draw, post sticky notes, load architecture blueprints, play Lo-Fi music, and save or export your creations directly to your computer.",
        actions: [
          { label: "🎨 Open Smart Board Studio", action: "view_whiteboard" }
        ]
      },
      arcade: {
        keywords: ['game', 'arcade', 'play', 'snake', 'tetris', 'invaders', 'retro', 'cabinet'],
        text: "🕹️ Step up to the 3D Arcade Machine! It is fully playable with:\n\n• 🐍 **Retro Cyber Snake**\n• 🧱 **Neon Block Tetris**\n• 👾 **Retro Space Invaders**\n\nUse arrow keys or on-screen controls to set high scores!",
        spokenText: "Step up to the 3D Arcade Machine to play retro Cyber Snake, Neon Tetris, and Space Invaders!",
        actions: [
          { label: "🕹️ Step Up to Arcade", action: "view_arcade" }
        ]
      },
      rubik: {
        keywords: ['rubik', 'cube', 'puzzle', 'scramble', 'solve'],
        text: "🎲 On the wooden side table sits an interactive 3D Rubik's Cube! You can rotate any face/slice, scramble it, solve it, and click any facet to reveal hidden engineering facts about Molly.",
        spokenText: "On the side table sits an interactive 3D Rubik's Cube. You can rotate faces, scramble, solve, and click facets to reveal hidden engineering milestones.",
        actions: [
          { label: "🎲 Inspect Rubik's Cube", action: "view_rubik" }
        ]
      },
      clock: {
        keywords: ['clock', 'time', 'calendar', 'schedule', 'date', 'agenda', 'timezone', 'delhi', 'tokyo'],
        text: "🕒 Look up at the Bauhaus Wall Clock and E-Ink Desk Stand! They tick with real-time accuracy and show world clocks across New Delhi, Tokyo, San Francisco, London, and New York. You can also view the full monthly calendar and stamp agendas to the Smart Board.",
        spokenText: "The Bauhaus Wall Clock and E-Ink Desk Stand tick with real-time accuracy and show world clocks across Delhi, Tokyo, San Francisco, London, and New York.",
        actions: [
          { label: "🕒 Open Calendar & Clocks", action: "open_calendar" }
        ]
      },
      tour: {
        keywords: ['tour', 'guide', 'walkthrough', 'room', 'explore', 'look around', 'where'],
        text: "🧭 Welcome to Molly's 3D AI Studio! Here is what you can interact with:\n\n1. 🖥️ **Workstation**: Dual screens with live project cards & timeline.\n2. 🎨 **Smart Board Studio**: Live drawing, sticky notes, blueprints & Lo-Fi music.\n3. 🎯 **Vision Board**: Spiritual manifestations, Emirates, 198 countries, $1B AI Startup & Apple Kingdom.\n4. 🕹️ **Arcade Cabinet**: Playable retro Snake, Tetris & Invaders.\n5. 🎲 **Rubik's Cube**: Interactive puzzle with career facts.\n6. 🏆 **Trophy Shelf**: National DevSummit 8th Rank & awards.\n7. 🕒 **Smart Clock & Calendar**: Real-time ticking wall clock and world time zones.",
        spokenText: "Welcome to Molly's 3D AI Studio! You can interact with the dual-monitor workstation, Smart Board Studio, Vision Board, Arcade Cabinet, Rubik's Cube, Trophy Shelf, and Wall Clock. Let me show you around!",
        actions: [
          { label: "🖥️ Workstation", action: "view_monitors" },
          { label: "🎨 Smart Board", action: "view_whiteboard" },
          { label: "🎯 Vision Board", action: "view_vision" },
          { label: "🏆 Trophies", action: "view_trophy" }
        ]
      },
      contact: {
        keywords: ['contact', 'email', 'hire', 'call', 'phone', 'reach', 'linkedin', 'github', 'message', 'interview', 'internship', 'mobile', 'number'],
        text: "✉️ Molly is actively seeking AI Engineer and Frontend Developer internships! You can reach her directly via:\n\n• **Email**: aroramolly180@gmail.com\n• **Phone**: 🔒 Available upon Recruiter Request (click below to request direct access)\n• **LinkedIn**: linkedin.com/in/molly-arora-20b11124a\n• **GitHub**: github.com/Molly-Arora02",
        spokenText: "Molly is actively seeking AI Engineer and Frontend Developer roles. You can contact her at aroramolly180@gmail.com, request her direct phone number, or connect on LinkedIn and GitHub!",
        actions: [
          { label: "📱 Request Phone Number", action: "open_phone_request" },
          { label: "✉️ Send Message Now", action: "open_contact" }
        ]
      }
    };
  }

  setupListeners() {
    // 1. Toggle Chat Window
    this.triggerBtn.addEventListener('click', () => {
      this.toggleChat();
    });

    document.getElementById('ai-chat-close-btn')?.addEventListener('click', () => {
      this.closeChat();
    });

    // 2. Toggle Voice
    this.voiceToggleBtn?.addEventListener('click', () => {
      this.voiceEnabled = !this.voiceEnabled;
      if (this.voiceIcon) {
        this.voiceIcon.textContent = this.voiceEnabled ? '🔊' : '🔇';
      }
      const statusDot = document.getElementById('ai-voice-status-dot');
      const statusText = document.getElementById('ai-voice-status-text');
      if (statusText) {
        statusText.textContent = this.voiceEnabled ? 'Voice Synthesis & Mic Ready' : 'Voice Narration Muted';
      }
      if (statusDot) {
        statusDot.style.background = this.voiceEnabled ? '#10b981' : '#6b7280';
      }

      if (!this.voiceEnabled && this.synth) {
        this.synth.cancel();
        this.hideCaption();
      } else if (this.voiceEnabled) {
        this.speak("Voice narration enabled.");
      }
      this.audioManager?.playClick();
    });

    // 3. Prompt Chips
    document.querySelectorAll('.ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.query;
        let questionText = chip.textContent;
        this.handleUserMessage(questionText, query);
      });
    });

    // 4. Form Submit
    document.getElementById('ai-chat-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.inputField?.value.trim();
      if (text) {
        this.handleUserMessage(text);
        if (this.inputField) this.inputField.value = '';
      }
    });

    // 5. Microphone Button
    this.micBtn?.addEventListener('click', () => {
      if (this.isListening) {
        this.stopListening();
      } else {
        this.startListening();
      }
    });

    this.micCancelBtn?.addEventListener('click', () => {
      this.stopListening();
    });

    // 6. Stop Caption Button
    this.captionStopBtn?.addEventListener('click', () => {
      if (this.synth) this.synth.cancel();
      this.hideCaption();
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.chatContainer.classList.remove('hidden');
      this.triggerBtn.classList.add('active');
      this.audioManager?.playClick();
      if (this.inputField) this.inputField.focus();

      if (!this.hasSpokenWelcome) {
        this.triggerWelcomeGreeting();
        this.hasSpokenWelcome = true;
      }

      this.scrollToBottom();
    } else {
      this.closeChat();
    }
  }

  closeChat() {
    this.isOpen = false;
    this.chatContainer.classList.add('hidden');
    this.triggerBtn.classList.remove('active');
    if (this.synth) this.synth.cancel();
    this.stopListening();
    this.hideCaption();
  }

  triggerWelcomeBadge() {
    const waveBadge = document.getElementById('ai-wave-badge');
    if (waveBadge) {
      waveBadge.classList.add('animate-wave');
    }
  }

  triggerWelcomeGreeting() {
    const welcome = this.knowledge.greeting;
    this.addBotMessage(welcome.text, welcome.actions, welcome.spokenText);

    // Speak welcome aloud
    this.speak(welcome.spokenText || welcome.text);
  }

  handleUserMessage(userText, forceCategory = null) {
    this.addUserMessage(userText);
    this.audioManager?.playClick();

    // Show typing indicator
    const typingId = this.showTypingIndicator();

    setTimeout(() => {
      this.removeTypingIndicator(typingId);
      const response = this.generateResponse(userText, forceCategory);
      this.addBotMessage(response.text, response.actions, response.spokenText);
      this.speak(response.spokenText || response.text);
    }, 400);
  }

  addUserMessage(text) {
    const msgEl = document.createElement('div');
    msgEl.className = 'ai-msg user';
    msgEl.innerHTML = `
      <div class="ai-msg-bubble">${this.escapeHTML(text)}</div>
    `;
    this.messagesList.appendChild(msgEl);
    this.scrollToBottom();
  }

  addBotMessage(text, actions = [], spokenText = '') {
    const msgEl = document.createElement('div');
    msgEl.className = 'ai-msg bot';

    // Format markdown bold & bullet points into clean HTML
    const formattedText = this.formatMarkdown(text);
    const textToSpeak = spokenText || text;

    let actionsHtml = '';
    if (actions && actions.length > 0) {
      actionsHtml = `
        <div class="ai-msg-actions">
          ${actions.map(a => `<button class="ai-action-btn" data-action="${a.action}">${a.label}</button>`).join('')}
        </div>
      `;
    }

    msgEl.innerHTML = `
      <div class="ai-msg-avatar">👩‍💻</div>
      <div class="ai-msg-content">
        <div class="ai-msg-bubble">
          ${formattedText}
          <div class="ai-msg-footer">
            <button class="ai-speak-bubble-btn" title="Replay Voice Speech">
              <span>🔊</span> Listen
            </button>
          </div>
        </div>
        ${actionsHtml}
      </div>
    `;

    // Bind speak button inside message bubble
    const speakBtn = msgEl.querySelector('.ai-speak-bubble-btn');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        this.speak(textToSpeak);
        this.audioManager?.playClick();
      });
    }

    // Bind action buttons
    msgEl.querySelectorAll('.ai-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.executeAction(action);
      });
    });

    this.messagesList.appendChild(msgEl);
    this.scrollToBottom();
  }

  showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const typingEl = document.createElement('div');
    typingEl.id = id;
    typingEl.className = 'ai-msg bot typing';
    typingEl.innerHTML = `
      <div class="ai-msg-avatar">👩‍💻</div>
      <div class="ai-msg-bubble">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>
    `;
    this.messagesList.appendChild(typingEl);
    this.scrollToBottom();
    return id;
  }

  removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  generateResponse(userText, forceCategory = null) {
    const clean = userText.toLowerCase().trim();

    if (forceCategory && this.knowledge[forceCategory]) {
      return this.knowledge[forceCategory];
    }

    // Keyword matching algorithm
    let bestMatch = null;
    let maxScore = 0;

    for (const [key, category] of Object.entries(this.knowledge)) {
      let score = 0;
      for (const kw of category.keywords) {
        if (clean.includes(kw)) {
          score += kw.length; // weight longer specific matches
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = category;
      }
    }

    if (bestMatch && maxScore > 0) {
      return bestMatch;
    }

    // Default Fallback with intelligent suggestions
    return {
      text: "I'd love to help you explore that! Molly specializes in **AI/ML Agent Engineering**, **Prompt Engineering (Google Certified)**, and **Full-Stack Development** (React/TypeScript/Three.js). Would you like to check out her top projects, hackathon achievements, 3D room features, or contact details?",
      spokenText: "Molly specializes in AI Agent Engineering, Google Certified Prompt Engineering, and Full-Stack Development. Let's explore her projects, hackathon wins, or vision board!",
      actions: [
        { label: "🚀 Top AI Projects", action: "view_projects" },
        { label: "🏆 DevSummit #8 Win", action: "view_trophy" },
        { label: "🎯 Vision Board", action: "view_vision" },
        { label: "✉️ Get in Touch", action: "open_contact" }
      ]
    };
  }

  executeAction(action) {
    this.audioManager?.playClick();

    switch (action) {
      case 'view_monitors':
      case 'view_projects':
        this.camera.setView('monitors');
        this.uiController.updateViewUI('monitors');
        this.speak("Focusing on Molly's Dual Monitor workstation showcasing MUSE AI, Focus Forge, and project timelines.");
        break;

      case 'view_whiteboard':
        this.camera.setView('whiteboard');
        this.uiController.updateViewUI('whiteboard');
        this.speak("Here is the Interactive AI Smart Board. You can draw, type notes, load architecture blueprints, and stream Lo-Fi music.");
        break;

      case 'view_vision':
        this.camera.setView('vision');
        this.uiController.updateViewUI('vision');
        this.speak("Here is Molly's Vision Board featuring Radha Nam Jaap, Emirates business class, 198 countries travel, $1B AI Startup, and the Apple Kingdom.");
        break;

      case 'open_vision_panel':
        this.camera.setView('vision');
        this.uiController.updateViewUI('vision');
        this.speak("Opening the full Vision Board with all 17 manifestations.");
        break;

      case 'view_arcade':
        this.camera.setView('arcade');
        this.uiController.updateViewUI('arcade');
        this.speak("Stepping up to the retro arcade machine. Enjoy playable Snake, Tetris, and Space Invaders!");
        break;

      case 'view_rubik':
        this.camera.setView('rubik');
        this.uiController.updateViewUI('rubik');
        this.speak("Here is the 3D Rubik's cube. Click on any colored facet to reveal career and engineering milestones.");
        break;

      case 'view_trophy':
        this.camera.setView('trophy');
        this.experience.celebrateTrophy();
        this.uiController.updateViewUI('trophy');
        this.uiController.openModal('trophy-modal');
        this.speak("Celebrating Molly's 8th Rank PAN India at DevSummit 2026 and Coding Blocks C++ Star honors!");
        break;

      case 'open_calendar':
        this.uiController.openModal('calendar-modal');
        this.speak("Opening the Smart Clock and Interactive Calendar Planner with world time zones and milestone tracking.");
        break;

      case 'open_resume':
        this.uiController.openModal('resume-modal');
        this.speak("Opening Molly's full interactive resume with verified certifications and experience highlights.");
        break;

      case 'open_contact':
        this.uiController.openModal('contact-modal');
        this.speak("Opening the contact modal. Feel free to draft a direct message or copy Molly's email!");
        break;

      case 'open_phone_request':
        this.uiController.openModal('phone-request-modal');
        this.speak("Opening the Recruiter Phone Access gateway. Enter your details and Molly will receive your request immediately!");
        break;

      case 'open_github':
        window.open('https://github.com/Molly-Arora02', '_blank');
        this.speak("Opening Molly's GitHub profile in a new tab.");
        break;

      case 'tour_room':
        this.startGuidedTour();
        break;

      default:
        break;
    }
  }

  startGuidedTour() {
    this.speak("Starting your tour! First stop: The Dual Monitors workstation with live AI systems.");
    this.camera.setView('monitors');
    this.uiController.updateViewUI('monitors');

    setTimeout(() => {
      this.camera.setView('whiteboard');
      this.uiController.updateViewUI('whiteboard');
      this.speak("Next: The AI Smart Board Studio for live brainstorms and music.");
    }, 4500);

    setTimeout(() => {
      this.camera.setView('vision');
      this.uiController.updateViewUI('vision');
      this.speak("And the 3D Vision Board of faith, travel, and billion-dollar AI startup dreams.");
    }, 9000);
  }

  speak(text) {
    if (!this.voiceEnabled || !this.synth) return;

    // Clean text for natural speech (remove markdown symbols, emojis, bullets, links)
    const cleanSpeech = text
      .replace(/[*_#`~•]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    if (!cleanSpeech) return;

    try {
      this.synth.cancel();
      this.playAiChime(659.25); // E5 chime

      this.currentUtterance = new SpeechSynthesisUtterance(cleanSpeech);
      this.currentUtterance.rate = 1.02;
      this.currentUtterance.pitch = 1.08;
      this.currentUtterance.volume = 1.0;

      // Make sure voices are loaded
      if (!this.selectedVoice) {
        const voices = this.synth.getVoices();
        this.selectedVoice = voices.find(v => 
          (v.name.includes('Samantha') || 
           v.name.includes('Google US English') || 
           v.name.includes('Google UK English Female') || 
           v.name.includes('Natural') || 
           v.name.includes('Zira') || 
           v.name.includes('Jenny') || 
           v.name.includes('Karen') || 
           v.name.includes('Victoria')) && 
          v.lang.startsWith('en')
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      }

      if (this.selectedVoice) {
        this.currentUtterance.voice = this.selectedVoice;
      }

      this.currentUtterance.onstart = () => {
        this.isSpeaking = true;
        this.showCaption(cleanSpeech);
        this.startSpeakingAnimation();
      };

      this.currentUtterance.onend = () => {
        this.isSpeaking = false;
        this.hideCaption();
        this.stopSpeakingAnimation();
      };

      this.currentUtterance.onerror = (err) => {
        console.warn('Speech synthesis utterance error:', err);
        this.isSpeaking = false;
        this.hideCaption();
        this.stopSpeakingAnimation();
      };

      this.synth.speak(this.currentUtterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  startSpeakingAnimation() {
    this.speakingRipples?.classList.add('active');
    document.getElementById('ai-mini-avatar')?.classList.add('pulse-speaking');
    document.getElementById('ai-avatar-ring')?.classList.add('pulse-speaking');
  }

  stopSpeakingAnimation() {
    this.speakingRipples?.classList.remove('active');
    document.getElementById('ai-mini-avatar')?.classList.remove('pulse-speaking');
    document.getElementById('ai-avatar-ring')?.classList.remove('pulse-speaking');
  }

  showCaption(text) {
    if (!this.captionBar || !this.captionText) return;
    this.captionText.textContent = text.length > 95 ? text.substring(0, 95) + '...' : text;
    this.captionBar.classList.remove('hidden');
  }

  hideCaption() {
    if (!this.captionBar) return;
    this.captionBar.classList.add('hidden');
  }

  scrollToBottom() {
    if (this.messagesList) {
      this.messagesList.scrollTop = this.messagesList.scrollHeight;
    }
  }

  formatMarkdown(text) {
    let html = this.escapeHTML(text);
    // Bold **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bullet points
    html = html.replace(/\n• (.*?)(?=\n|$)/g, '<div class="ai-bullet"><span>•</span> $1</div>');
    // Newlines
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

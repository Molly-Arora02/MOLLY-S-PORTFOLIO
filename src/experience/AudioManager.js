/**
 * Audio Manager supporting YouTube IFrame Player for custom music & 24/7 streams,
 * alongside procedural Web Audio synthesizer ambiance and interactive SFX.
 */
export const MUSIC_STATIONS = [
  {
    id: 'lofi-girl',
    title: 'Lofi Girl • 24/7 Chill Beats',
    category: 'Lofi / Study',
    type: 'youtube',
    videoId: 'jfKfPfyJRdk',
    icon: '☕'
  },
  {
    id: 'synthwave',
    title: 'Synthwave Radio • Cyberpunk & Retro',
    category: 'Synthwave / Chill',
    type: 'youtube',
    videoId: '4xDzrJKXOOY',
    icon: '🌌'
  },
  {
    id: 'chillhop',
    title: 'Chillhop Cafe • Jazzy Relaxing Beats',
    category: 'Jazz / Lofi',
    type: 'youtube',
    videoId: '5yx6BWlEVcY',
    icon: '🎷'
  },
  {
    id: 'deep-focus',
    title: 'Coding & Deep Focus Flow',
    category: 'Ambient / Coding',
    type: 'youtube',
    videoId: '5qap5aO4i9A',
    icon: '🎧'
  },
  {
    id: 'ghibli-piano',
    title: 'Studio Ghibli Piano Melodies',
    category: 'Peaceful Piano',
    type: 'youtube',
    videoId: 'tfwV4Y8f_a4',
    icon: '🎹'
  },
  {
    id: 'procedural-synth',
    title: 'Procedural Ambient Synthesizer',
    category: 'Web Audio Synth',
    type: 'synth',
    videoId: null,
    icon: '🎛️'
  }
];

export default class AudioManager {
  constructor() {
    this.audioCtx = null;
    this.isMuted = true;
    this.volume = 70; // 0 - 100
    
    // Web Audio Procedural Ambiance State
    this.ambientGain = null;
    this.isAmbiancePlaying = false;
    this.ambientInterval = null;

    // YouTube Player State
    this.ytPlayer = null;
    this.isYtReady = false;
    this.currentStation = MUSIC_STATIONS[0];
    this.currentTrackTitle = MUSIC_STATIONS[0].title;
    this.isPlaying = false;
    this.onStateChangeCallback = null;

    this.initYouTubeAPI();
  }

  initAudioContext() {
    if (this.audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  // -------------------------------------------------------------
  // YouTube IFrame API Integration
  // -------------------------------------------------------------
  initYouTubeAPI() {
    // If YouTube API is already loaded
    if (window.YT && window.YT.Player) {
      this.mountYouTubePlayer();
      return;
    }

    // Set up global callback for when YT API is ready
    const prevOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevOnReady) prevOnReady();
      this.mountYouTubePlayer();
    };

    // Dynamically insert YouTube iframe API script if not already present
    if (!document.getElementById('yt-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }

  mountYouTubePlayer() {
    let mountEl = document.getElementById('youtube-player-mount');
    if (!mountEl) {
      mountEl = document.createElement('div');
      mountEl.id = 'youtube-player-mount';
      mountEl.style.cssText = 'position:fixed; bottom:-200px; left:-200px; width:100px; height:100px; opacity:0.001; pointer-events:none; z-index:-1;';
      document.body.appendChild(mountEl);
    }

    try {
      this.ytPlayer = new window.YT.Player('youtube-player-mount', {
        height: '100',
        width: '100',
        videoId: this.currentStation.videoId || 'jfKfPfyJRdk',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            this.isYtReady = true;
            this.ytPlayer.setVolume(this.volume);
            if (this.isPlaying && this.currentStation.type === 'youtube') {
              event.target.playVideo();
            }
          },
          onStateChange: (event) => {
            // YT.PlayerState.PLAYING = 1, PAUSED = 2, BUFFERING = 3, ENDED = 0
            if (event.data === window.YT.PlayerState.PLAYING) {
              this.isPlaying = true;
              this.isMuted = false;
            } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
              if (this.currentStation.type === 'youtube') {
                this.isPlaying = false;
              }
            }
            this.notifyState();
          },
          onError: (event) => {
            console.warn("YouTube Player error:", event.data, "Falling back to procedural Lo-Fi synth.");
            // Graceful fallback to procedural synth
            this.playProceduralSynth();
            this.notifyState();
          }
        }
      });
    } catch (e) {
      console.warn("Error mounting YouTube Player", e);
    }
  }

  setOnStateChange(cb) {
    this.onStateChangeCallback = cb;
  }

  notifyState() {
    if (typeof this.onStateChangeCallback === 'function') {
      this.onStateChangeCallback({
        isPlaying: this.isPlaying,
        isMuted: this.isMuted,
        station: this.currentStation,
        title: this.currentTrackTitle,
        volume: this.volume
      });
    }
  }

  // Helper to extract clean video ID from various YouTube URL formats
  extractYouTubeId(urlOrId) {
    if (!urlOrId) return null;
    const cleanStr = urlOrId.trim();
    
    // Direct 11 character ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanStr)) {
      return cleanStr;
    }

    // Standard YouTube URL formats
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|watch)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = cleanStr.match(regExp);
    return (match && match[1]) ? match[1] : null;
  }

  // Play a custom YouTube URL or Video ID
  loadCustomYouTube(urlOrId, customTitle = null) {
    const videoId = this.extractYouTubeId(urlOrId);
    if (!videoId) {
      return { success: false, message: 'Invalid YouTube URL or Video ID.' };
    }

    const title = customTitle || `Custom Track (${videoId})`;
    this.currentStation = {
      id: `custom-${videoId}`,
      title: title,
      category: 'Custom YouTube Stream',
      type: 'youtube',
      videoId: videoId,
      icon: '▶️'
    };
    this.currentTrackTitle = title;

    this.playCurrentStation();
    return { success: true, videoId: videoId, title: title };
  }

  // Switch to a preset station or synth
  selectStation(stationId) {
    const station = MUSIC_STATIONS.find(s => s.id === stationId);
    if (!station) return;

    this.currentStation = station;
    this.currentTrackTitle = station.title;
    this.playCurrentStation();
  }

  playCurrentStation() {
    this.initAudioContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.currentStation.type === 'youtube') {
      this.stopAmbiance();
      if (this.isYtReady && this.ytPlayer) {
        try {
          this.ytPlayer.loadVideoById(this.currentStation.videoId);
          this.ytPlayer.setVolume(this.volume);
          this.ytPlayer.playVideo();
          this.isPlaying = true;
          this.isMuted = false;
        } catch (e) {
          console.warn("Could not load YouTube video", e);
          this.playProceduralSynth();
        }
      } else {
        this.isPlaying = true;
        this.isMuted = false;
      }
    } else {
      // Procedural Synth
      if (this.isYtReady && this.ytPlayer) {
        try { this.ytPlayer.pauseVideo(); } catch (e) {}
      }
      this.playProceduralSynth();
    }

    this.notifyState();
  }

  playProceduralSynth() {
    this.initAudioContext();
    this.isMuted = false;
    this.isPlaying = true;
    this.startAmbiance();
  }

  togglePlayPause() {
    this.initAudioContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  play() {
    this.initAudioContext();
    this.isMuted = false;
    this.isPlaying = true;

    if (this.currentStation.type === 'youtube' && this.isYtReady && this.ytPlayer) {
      try {
        this.ytPlayer.playVideo();
      } catch (e) {
        this.startAmbiance();
      }
    } else {
      this.startAmbiance();
    }
    this.notifyState();
  }

  pause() {
    this.isPlaying = false;
    if (this.isYtReady && this.ytPlayer) {
      try { this.ytPlayer.pauseVideo(); } catch (e) {}
    }
    this.stopAmbiance();
    this.notifyState();
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(100, vol));
    if (this.isYtReady && this.ytPlayer) {
      try {
        this.ytPlayer.setVolume(this.volume);
      } catch (e) {}
    }
    if (this.ambientGain && this.audioCtx) {
      const normalizedGain = (this.volume / 100) * 0.12;
      this.ambientGain.gain.setValueAtTime(normalizedGain, this.audioCtx.currentTime);
    }
    this.notifyState();
  }

  // -------------------------------------------------------------
  // Procedural Lo-Fi Chords Generator (Fallback & Offline)
  // -------------------------------------------------------------
  startAmbiance() {
    if (!this.audioCtx || this.isAmbiancePlaying) return;
    this.isAmbiancePlaying = true;
    
    // Master ambient gain
    this.ambientGain = this.audioCtx.createGain();
    const normalizedGain = (this.volume / 100) * 0.12;
    this.ambientGain.gain.setValueAtTime(normalizedGain, this.audioCtx.currentTime);
    this.ambientGain.connect(this.audioCtx.destination);

    // Warm Lo-Fi chord progression generator: Cmaj7 -> Am7 -> Dm7 -> G7
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [293.66, 349.23, 440.00, 523.25], // Dm7
      [196.00, 246.94, 293.66, 349.23]  // G7
    ];
    let chordIdx = 0;

    const playChord = () => {
      if (!this.isAmbiancePlaying || !this.isPlaying || !this.audioCtx) return;
      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;

      currentChord.forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800 + Math.random() * 200, this.audioCtx.currentTime);

        const now = this.audioCtx.currentTime;
        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.06, now + 1.2 + i * 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 5.5);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.ambientGain);

        osc.start(now);
        osc.stop(now + 6.0);
      });
    };

    playChord();
    this.ambientInterval = setInterval(playChord, 5000);
  }

  stopAmbiance() {
    this.isAmbiancePlaying = false;
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    if (this.ambientGain && this.audioCtx) {
      try {
        this.ambientGain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);
      } catch (e) {}
    }
  }

  // -------------------------------------------------------------
  // UI & Interactive Sound Effects
  // -------------------------------------------------------------
  playWhoosh() {
    this.initAudioContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.Q.setValueAtTime(3, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  playClick() {
    this.initAudioContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  playRubikTurn() {
    this.initAudioContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  playMarkerDraw() {
    this.initAudioContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + Math.random() * 200, now);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  playArcadeBeep(type = 'blip') {
    this.initAudioContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'square';
      if (type === 'blip') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'score') {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        osc.frequency.setValueAtTime(1174.66, now + 0.16);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (type === 'gameover') {
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.4);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.46);
      }

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
    } catch (e) {}
  }

  playTrophyFanfare() {
    this.initAudioContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.65);
      });
    } catch (e) {}
  }
}


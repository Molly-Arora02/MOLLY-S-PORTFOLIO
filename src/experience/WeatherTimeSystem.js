import * as THREE from 'three';
import gsap from 'gsap';
import { TextureGenerator } from './TextureGenerator.js';

export default class WeatherTimeSystem {
  constructor(room) {
    this.room = room;
    this.experience = room.experience;
    this.scene = room.scene;

    this.currentMode = 'day';
    this.isAuto = true;
    this.weatherData = null;

    // Cache textures for snappy seamless switching
    this.textures = {
      morning: TextureGenerator.createWindowViewTexture('morning'),
      day: TextureGenerator.createWindowViewTexture('day'),
      evening: TextureGenerator.createWindowViewTexture('evening'),
      night: TextureGenerator.createWindowViewTexture('night'),
      rain: TextureGenerator.createWindowViewTexture('rain')
    };

    this.setupUIControls();
    this.detectLocalTimeAndWeather();
    
    // Refresh weather & time check every 5 minutes
    this.timer = setInterval(() => {
      if (this.isAuto) {
        this.detectLocalTimeAndWeather();
      }
    }, 5 * 60 * 1000);
  }

  setupUIControls() {
    const pill = document.getElementById('weather-pill-btn');
    const dropdown = document.getElementById('weather-dropdown');

    if (pill && dropdown) {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
      });

      document.addEventListener('click', () => {
        dropdown.classList.add('hidden');
      });

      dropdown.querySelectorAll('.dropdown-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const mode = btn.getAttribute('data-mode');
          dropdown.querySelectorAll('.dropdown-item').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          dropdown.classList.add('hidden');

          if (mode === 'auto') {
            this.isAuto = true;
            this.detectLocalTimeAndWeather();
          } else {
            this.isAuto = false;
            this.applyEnvironment(mode, true);
            this.updatePillLabel(mode, false);
          }
        });
      });
    }
  }

  updatePillLabel(mode, isLive = true) {
    const iconEl = document.getElementById('weather-icon');
    const labelEl = document.getElementById('weather-label');
    if (!iconEl || !labelEl) return;

    const icons = {
      morning: '🌅',
      day: '☀️',
      evening: '🌇',
      night: '🌙',
      rain: '🌧️'
    };

    const names = {
      morning: 'Morning',
      day: 'Day (High Sun)',
      evening: 'Evening',
      night: 'Night (Lamps ON)',
      rain: 'Raining'
    };

    iconEl.innerText = icons[mode] || '☀️';
    labelEl.innerText = isLive ? `Live: ${names[mode] || mode}` : `${names[mode] || mode}`;
  }

  async detectLocalTimeAndWeather() {
    const now = new Date();
    const hour = now.getHours();

    let targetMode = 'day';
    if (hour >= 5 && hour < 11) {
      targetMode = 'morning';
    } else if (hour >= 11 && hour < 17) {
      targetMode = 'day';
    } else if (hour >= 17 && hour < 20) {
      targetMode = 'evening';
    } else {
      targetMode = 'night';
    }

    // Try fetching real-time precipitation from Open-Meteo IP / Geo API
    try {
      const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const lat = geoData.latitude;
        const lon = geoData.longitude;
        if (lat && lon) {
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,is_day,precipitation,rain`);
          if (weatherRes.ok) {
            const weather = await weatherRes.json();
            const current = weather.current;
            const code = current?.weather_code || 0;
            const rain = current?.rain || current?.precipitation || 0;

            // WMO Rain codes: 51, 53, 55 (drizzle), 61, 63, 65 (rain), 80, 81, 82 (showers), 95 (thunderstorm)
            const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99];
            if (rain > 0.1 || rainCodes.includes(code)) {
              targetMode = 'rain';
            }
          }
        }
      }
    } catch (err) {
      // Fallback cleanly to hour-based mode
      console.log('Using local time mode:', targetMode);
    }

    if (this.isAuto) {
      this.applyEnvironment(targetMode, false);
      this.updatePillLabel(targetMode, true);
    }
  }

  applyEnvironment(mode) {
    this.currentMode = mode;
    const r = this.room;
    if (!r) return;

    // Swap window scenic texture
    if (r.windowViewMat && this.textures[mode]) {
      r.windowViewMat.map = this.textures[mode];
      r.windowViewMat.needsUpdate = true;
    }

    // Toggle 3D Rain & Glass droplets
    if (r.rainEffect) {
      r.rainEffect.setActive(mode === 'rain');
    }

    const duration = 1.0;

    switch (mode) {
      case 'morning':
        if (r.hemiLight) gsap.to(r.hemiLight, { intensity: 1.25, duration });
        if (r.hemiLight) r.hemiLight.color.setHex(0xffedd5);
        if (r.sunLight) {
          gsap.to(r.sunLight, { intensity: 2.2, duration });
          gsap.to(r.sunLight.position, { x: 6.5, y: 7.5, z: -1.0, duration });
          r.sunLight.color.setHex(0xfed7aa);
        }
        if (r.skyFill) {
          gsap.to(r.skyFill, { intensity: 1.0, duration });
          r.skyFill.color.setHex(0x93c5fd);
        }
        if (r.warmBounce) gsap.to(r.warmBounce, { intensity: 0.5, duration });
        if (r.deskTaskLight) gsap.to(r.deskTaskLight, { intensity: 0.0, duration });
        if (r.tableLampLight) gsap.to(r.tableLampLight, { intensity: 0.4, duration });
        if (r.monitorGlow) gsap.to(r.monitorGlow, { intensity: 0.0, duration });
        // Lights OFF during morning
        if (r.starLightsMat) gsap.to(r.starLightsMat, { emissiveIntensity: 0.0, duration });
        if (r.fairyLightBulbMat) gsap.to(r.fairyLightBulbMat, { emissiveIntensity: 0.0, duration });
        if (r.fairyPointLight) gsap.to(r.fairyPointLight, { intensity: 0.0, duration });
        if (r.fairyRoomReflectionLight) gsap.to(r.fairyRoomReflectionLight, { intensity: 0.0, duration });
        break;

      case 'day':
        if (r.hemiLight) gsap.to(r.hemiLight, { intensity: 1.4, duration });
        if (r.hemiLight) r.hemiLight.color.setHex(0xfff7ed);
        if (r.sunLight) {
          gsap.to(r.sunLight, { intensity: 2.8, duration });
          gsap.to(r.sunLight.position, { x: 6.5, y: 9.5, z: 2.5, duration });
          r.sunLight.color.setHex(0xfffaed);
        }
        if (r.skyFill) {
          gsap.to(r.skyFill, { intensity: 0.9, duration });
          r.skyFill.color.setHex(0xbae6fd);
        }
        if (r.warmBounce) gsap.to(r.warmBounce, { intensity: 0.6, duration });
        if (r.deskTaskLight) gsap.to(r.deskTaskLight, { intensity: 0.0, duration });
        if (r.tableLampLight) gsap.to(r.tableLampLight, { intensity: 0.2, duration });
        if (r.monitorGlow) gsap.to(r.monitorGlow, { intensity: 0.0, duration });
        // Lights OFF during day
        if (r.starLightsMat) gsap.to(r.starLightsMat, { emissiveIntensity: 0.0, duration });
        if (r.fairyLightBulbMat) gsap.to(r.fairyLightBulbMat, { emissiveIntensity: 0.0, duration });
        if (r.fairyPointLight) gsap.to(r.fairyPointLight, { intensity: 0.0, duration });
        if (r.fairyRoomReflectionLight) gsap.to(r.fairyRoomReflectionLight, { intensity: 0.0, duration });
        break;

      case 'evening':
        if (r.hemiLight) gsap.to(r.hemiLight, { intensity: 0.95, duration });
        if (r.hemiLight) r.hemiLight.color.setHex(0xfde047);
        if (r.sunLight) {
          gsap.to(r.sunLight, { intensity: 2.2, duration });
          gsap.to(r.sunLight.position, { x: 6.5, y: 6.5, z: -0.5, duration });
          r.sunLight.color.setHex(0xf97316); // Amber Sunset
        }
        if (r.skyFill) {
          gsap.to(r.skyFill, { intensity: 0.75, duration });
          r.skyFill.color.setHex(0xa855f7);
        }
        if (r.warmBounce) gsap.to(r.warmBounce, { intensity: 0.8, duration });
        if (r.deskTaskLight) gsap.to(r.deskTaskLight, { intensity: 0.0, duration });
        if (r.tableLampLight) gsap.to(r.tableLampLight, { intensity: 1.8, duration });
        if (r.monitorGlow) gsap.to(r.monitorGlow, { intensity: 0.0, duration });
        // Star Curtain lights start glowing in evening
        if (r.starLightsMat) gsap.to(r.starLightsMat, { emissiveIntensity: 2.5, duration });
        if (r.fairyLightBulbMat) gsap.to(r.fairyLightBulbMat, { emissiveIntensity: 2.0, duration });
        if (r.fairyPointLight) gsap.to(r.fairyPointLight, { intensity: 0.8, duration });
        if (r.fairyRoomReflectionLight) gsap.to(r.fairyRoomReflectionLight, { intensity: 0.45, duration });
        break;

      case 'night':
        if (r.hemiLight) gsap.to(r.hemiLight, { intensity: 0.45, duration });
        if (r.hemiLight) r.hemiLight.color.setHex(0x1e293b);
        if (r.sunLight) {
          gsap.to(r.sunLight, { intensity: 0.35, duration });
          gsap.to(r.sunLight.position, { x: 5.0, y: 8.0, z: 1.0, duration });
          r.sunLight.color.setHex(0x38bdf8); // Moonlight
        }
        if (r.skyFill) {
          gsap.to(r.skyFill, { intensity: 0.25, duration });
          r.skyFill.color.setHex(0x0f172a);
        }
        if (r.warmBounce) gsap.to(r.warmBounce, { intensity: 0.7, duration });
        // Cozy night lamps on!
        if (r.deskTaskLight) gsap.to(r.deskTaskLight, { intensity: 0.0, duration });
        if (r.tableLampLight) gsap.to(r.tableLampLight, { intensity: 3.2, duration });
        if (r.monitorGlow) gsap.to(r.monitorGlow, { intensity: 0.0, duration });
        // Star Waterfall Curtain glow with beautiful dim room reflection!
        if (r.starLightsMat) gsap.to(r.starLightsMat, { emissiveIntensity: 3.8, duration });
        if (r.fairyLightBulbMat) gsap.to(r.fairyLightBulbMat, { emissiveIntensity: 2.8, duration });
        if (r.fairyPointLight) gsap.to(r.fairyPointLight, { intensity: 1.4, duration });
        if (r.fairyRoomReflectionLight) gsap.to(r.fairyRoomReflectionLight, { intensity: 0.85, duration });
        break;

      case 'rain':
        if (r.hemiLight) gsap.to(r.hemiLight, { intensity: 0.68, duration });
        if (r.hemiLight) r.hemiLight.color.setHex(0x64748b);
        if (r.sunLight) {
          gsap.to(r.sunLight, { intensity: 0.8, duration });
          gsap.to(r.sunLight.position, { x: 5.5, y: 7.5, z: 0.0, duration });
          r.sunLight.color.setHex(0x94a3b8);
        }
        if (r.skyFill) {
          gsap.to(r.skyFill, { intensity: 0.55, duration });
          r.skyFill.color.setHex(0x38bdf8);
        }
        if (r.warmBounce) gsap.to(r.warmBounce, { intensity: 0.85, duration });
        if (r.deskTaskLight) gsap.to(r.deskTaskLight, { intensity: 0.0, duration });
        if (r.tableLampLight) gsap.to(r.tableLampLight, { intensity: 2.4, duration });
        if (r.monitorGlow) gsap.to(r.monitorGlow, { intensity: 0.0, duration });
        if (r.starLightsMat) gsap.to(r.starLightsMat, { emissiveIntensity: 1.8, duration });
        if (r.fairyLightBulbMat) gsap.to(r.fairyLightBulbMat, { emissiveIntensity: 1.4, duration });
        if (r.fairyPointLight) gsap.to(r.fairyPointLight, { intensity: 0.5, duration });
        if (r.fairyRoomReflectionLight) gsap.to(r.fairyRoomReflectionLight, { intensity: 0.35, duration });
        break;
    }
  }
}

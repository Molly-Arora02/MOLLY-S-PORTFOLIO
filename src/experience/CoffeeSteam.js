import * as THREE from 'three';

export default class CoffeeSteam {
  constructor(position = new THREE.Vector3(0, 0, 0)) {
    this.position = position;
    this.time = 0;
    this.mesh = null;
    this.init();
  }

  init() {
    const geometry = new THREE.CylinderGeometry(0.04, 0.12, 0.45, 16, 20, true);
    geometry.translate(0, 0.225, 0);

    const vertexShader = `
      uniform float uTime;
      varying vec2 vUv;
      varying float vNoise;

      // Simple 2D pseudo-random
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        vUv = uv;
        vec3 pos = position;
        
        // Steam wave animation
        float displacement = noise(vec2(pos.y * 3.0 - uTime * 0.8, pos.x * 2.0)) * 0.06;
        pos.x += displacement * smoothstep(0.0, 0.8, uv.y);
        pos.z += displacement * 0.7 * smoothstep(0.0, 0.8, uv.y);

        vNoise = displacement;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      varying vec2 vUv;
      varying float vNoise;

      void main() {
        // Soft gradient alpha along height and edges
        float edgeFade = sin(vUv.x * 3.14159265);
        float heightFade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.4, vUv.y);
        float alpha = edgeFade * heightFade * 0.38;

        vec3 steamColor = vec3(0.92, 0.95, 1.0);
        gl_FragColor = vec4(steamColor, alpha);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 }
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.copy(this.position);
  }

  update(delta) {
    this.time += delta;
    if (this.material) {
      this.material.uniforms.uTime.value = this.time;
    }
  }
}

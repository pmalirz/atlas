import type { ShaderPreset } from '../types';

const vertexSource = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const fragmentSource = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform float u_dripSpeed;
uniform float u_blobCount;

#define MAX_BLOBS 12

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float metaballField(vec2 p, float t, float speed, float count) {
  float energy = 0.0;
  float numBlobs = 4.0 + count * 8.0;

  for (int i = 0; i < MAX_BLOBS; i++) {
    if (float(i) >= numBlobs) break;
    float fi = float(i);
    float phase = fi * 1.618 + fi * fi * 0.13;

    float riseSpeed = (0.3 + 0.4 * fract(fi * 0.618)) * speed;
    float riseCycle = mod(t * riseSpeed + phase * 0.7, 3.5) - 1.0;

    float xBase = sin(phase * 2.39996) * 0.45;
    float xWobble = sin(t * speed * 0.8 + phase * 3.1) * 0.12;
    float xDrift = sin(riseCycle * 2.0 + phase) * 0.08;
    float bx = xBase + xWobble + xDrift;
    float by = -0.7 + riseCycle * 0.9;

    float baseSize = 0.04 + 0.03 * fract(phase * 0.317);
    float pulse = 1.0 + 0.15 * sin(t * speed * 1.5 + phase * 4.7);
    float radius = baseSize * pulse;

    float d = length(p - vec2(bx, by));
    energy += (radius * radius) / (d * d + 0.0001);
  }

  return energy;
}

float tendrilField(vec2 p, float t, float speed) {
  float n1 = vnoise(vec2(p.x * 6.0, p.y * 2.0 - t * speed * 0.6) + 10.0);
  float n2 = vnoise(vec2(p.x * 12.0 + 3.7, p.y * 4.0 - t * speed * 0.8) + 20.0);
  float n3 = vnoise(vec2(p.x * 3.0 + 7.1, p.y * 1.5 - t * speed * 0.4));

  float tendrils = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
  tendrils = smoothstep(0.35, 0.65, tendrils);
  tendrils *= smoothstep(0.6, -0.3, p.y);
  tendrils *= 0.6 + 0.4 * smoothstep(0.0, -0.5, p.y);

  return tendrils;
}

float vignette(vec2 uv) {
  float d = length(uv * vec2(0.9, 1.0));
  return smoothstep(1.3, 0.4, d);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_res * 0.5) / u_res.y;
  float t = u_time;
  float speed = u_dripSpeed;
  float count = u_blobCount;

  float bgDist = length(uv * vec2(0.8, 1.0));
  vec3 col = vec3(0.025, 0.018, 0.015) * (1.0 - bgDist * 0.3);
  col = max(col, vec3(0.0));

  float field = metaballField(uv, t, speed, count);
  float tendrils = tendrilField(uv, t, speed);
  float combinedField = field + tendrils * 0.6;

  float threshold = 1.0;
  float outerGlow = smoothstep(threshold * 0.15, threshold * 0.5, combinedField);
  float surface = smoothstep(threshold * 0.4, threshold * 0.7, combinedField);
  float inner = smoothstep(threshold * 0.8, threshold * 1.8, combinedField);
  float core = smoothstep(threshold * 2.0, threshold * 4.0, combinedField);

  vec3 glowColor = vec3(1.2, 0.55, 0.10);
  vec3 surfaceColor = vec3(2.5, 1.3, 0.40);
  vec3 innerColor = vec3(3.5, 2.0, 0.70);
  vec3 coreColor = vec3(5.0, 4.0, 2.5);

  vec3 blobCol = glowColor * outerGlow * 1.0;
  blobCol = mix(blobCol, surfaceColor, surface * 0.95);
  blobCol = mix(blobCol, innerColor, inner * 0.95);
  blobCol = mix(blobCol, coreColor, core * 1.0);

  float edgeBand = surface * (1.0 - inner);
  blobCol += vec3(1.8, 1.0, 0.3) * edgeBand * 0.8;

  float tendrilVis = tendrils * (1.0 - surface * 0.5);
  vec3 tendrilColor = vec3(1.4, 0.7, 0.20) * tendrilVis * 0.7;
  blobCol += tendrilColor;

  col += blobCol;

  float ambientFlow = vnoise(vec2(uv.x * 3.0, uv.y * 1.5 - t * speed * 0.2) + 50.0);
  ambientFlow = smoothstep(0.4, 0.6, ambientFlow) * 0.06;
  col += vec3(0.2, 0.12, 0.06) * ambientFlow;

  float microField = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float phase = fi * 2.39996 + 100.0;
    float mSpeed = (0.5 + 0.3 * fract(phase * 0.618)) * speed;
    float mCycle = mod(t * mSpeed + phase, 2.8) - 0.8;
    float mx = sin(phase * 1.7) * 0.5 + sin(t * speed + phase * 2.3) * 0.1;
    float my = -0.6 + mCycle * 0.8;
    float mr = 0.015 + 0.01 * sin(t * speed * 2.0 + phase);
    float md = length(uv - vec2(mx, my));
    microField += (mr * mr) / (md * md + 0.0001);
  }

  float microSurface = smoothstep(0.8, 1.5, microField);
  float microCore = smoothstep(1.5, 3.0, microField);
  col += vec3(1.8, 1.0, 0.30) * microSurface * 0.7;
  col += vec3(3.0, 2.2, 1.0) * microCore * 0.8;

  float grain = (hash(gl_FragCoord.xy + fract(t * 43.758) * 1000.0) - 0.5) * 0.025;
  col += grain;
  col *= vignette(uv);

  col = max(col, vec3(0.0));
  col = col * (2.51 * col + 0.03) / (col * (2.43 * col + 0.59) + 0.14);
  col = pow(col, vec3(0.90));

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, col * vec3(1.06, 0.97, 0.90), smoothstep(0.05, 0.0, lum) * 0.3);

  gl_FragColor = vec4(col, 1.0);
}
`;

export const neonDripShader: ShaderPreset = {
    id: 'neon-drip',
    label: 'Neon Drip',
    vertexSource,
    fragmentSource,
    defaults: {
        u_dripSpeed: 0.5,
        u_blobCount: 1,
    },
};

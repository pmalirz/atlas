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
uniform float u_auroraSpeed;
uniform float u_auroraIntensity;

#define NUM_BG_STARS 120

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash1(float n) {
  return fract(sin(n) * 43758.5453123);
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

float auroraRibbon(vec2 uv, float t, float ribbonX, float ribbonWidth, float waveFreq, float waveAmp, float phase) {
  float centerX = ribbonX + sin(t * 0.15 + phase) * 0.25;

  float wave1 = sin(uv.y * waveFreq + t * 0.9 + phase) * waveAmp;
  float wave2 = sin(uv.y * waveFreq * 2.3 + t * 1.3 + phase * 1.7) * waveAmp * 0.5;
  float wave3 = sin(uv.y * waveFreq * 0.4 + t * 0.35 + phase * 0.6) * waveAmp * 1.2;
  float wave4 = sin(uv.y * waveFreq * 3.7 + t * 1.8 + phase * 2.3) * waveAmp * 0.2;
  float waveOffset = wave1 + wave2 + wave3 + wave4;

  float dx = uv.x - (centerX + waveOffset);
  float ribbon = exp(-dx * dx / (ribbonWidth * ribbonWidth));

  float brightBand = 0.5 + 0.5 * sin(uv.y * 2.5 + t * 0.7 + phase * 2.0);
  brightBand *= 0.5 + 0.5 * sin(uv.y * 5.0 - t * 0.9 + phase);

  float shimmer = 0.7 + 0.3 * sin(t * 2.5 + phase * 3.0 + uv.y * 8.0);
  shimmer *= 0.8 + 0.2 * sin(t * 1.7 + phase * 1.1 + uv.x * 6.0);

  float verticalFade = smoothstep(-0.35, -0.05, uv.y) * smoothstep(0.75, 0.35, uv.y);

  float detail = noise(vec2(uv.x * 6.0, uv.y * 10.0 + t * 0.5 + phase));
  detail = 0.6 + 0.4 * detail;

  return ribbon * brightBand * verticalFade * detail * shimmer;
}

float bgStars(vec2 uv, float t) {
  float stars = 0.0;
  for (int i = 0; i < NUM_BG_STARS; i++) {
    float fi = float(i);
    vec2 pos = vec2(
      hash1(fi * 17.31 + 100.0) * 2.8 - 1.4,
      hash1(fi * 11.97 + 200.0) * 1.4 - 0.3
    );

    float d = length(uv - pos);
    float twinkleSpeed = 0.5 + hash1(fi * 3.3 + 300.0) * 2.0;
    float twinkle = 0.3 + 0.7 * sin(t * twinkleSpeed + fi * 2.7);
    twinkle = max(twinkle, 0.0);
    twinkle *= twinkle;

    float size = 0.0008 + hash1(fi * 5.5 + 400.0) * 0.002;
    float brightness = 0.4 + hash1(fi * 7.7 + 500.0) * 0.6;
    stars += smoothstep(size, 0.0, d) * twinkle * brightness;

    if (brightness > 0.7) {
      stars += smoothstep(size * 5.0, 0.0, d) * twinkle * 0.08;
    }
  }

  return stars;
}

float hexDist(vec2 p) {
  p = abs(p);
  return max(p.x + p.y * 0.577350269, p.y * 1.154700538);
}

float crystalPattern(vec2 uv, float t) {
  float scale = 12.0;
  vec2 p = uv * scale;
  vec2 r = vec2(1.0, 1.732);
  vec2 h = r * 0.5;

  vec2 a = mod(p, r) - h;
  vec2 b = mod(p - h, r) - h;
  vec2 gv = (dot(a, a) < dot(b, b)) ? a : b;

  float hd = hexDist(gv);
  float edge = smoothstep(0.45, 0.40, hd) - smoothstep(0.40, 0.35, hd);

  float angle = atan(gv.y, gv.x);
  float branch = abs(sin(angle * 3.0));
  float branchLine = smoothstep(0.04, 0.0, abs(branch - 0.5) * hd);
  branchLine *= smoothstep(0.0, 0.15, hd) * smoothstep(0.45, 0.25, hd);

  float subBranch = abs(sin(angle * 6.0));
  float subLine = smoothstep(0.03, 0.0, abs(subBranch - 0.5) * hd);
  subLine *= smoothstep(0.1, 0.2, hd) * smoothstep(0.4, 0.3, hd);

  float crystal = edge * 0.6 + branchLine * 0.4 + subLine * 0.2;
  float shimmer = 0.7 + 0.3 * sin(t * 0.2 + hash(floor(p / r)) * 6.28);
  crystal *= shimmer;

  return crystal;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_res * 0.5) / min(u_res.x, u_res.y);

  float t = u_time * u_auroraSpeed;

  vec3 col = vec3(0.012);
  col += vec3(0.012) * smoothstep(0.5, -0.3, uv.y);

  float starField = bgStars(uv, u_time);
  vec3 starColor = vec3(0.88);
  col += starColor * starField;

  float r1 = auroraRibbon(uv, t, 0.0, 0.22, 2.5, 0.28, 0.0);
  vec3 r1color = vec3(0.55);
  r1color = mix(r1color, vec3(0.38), smoothstep(0.25, 0.65, uv.y) * 0.4);

  float r2 = auroraRibbon(uv, t * 0.9, 0.35, 0.18, 2.8, 0.24, 2.1);
  vec3 r2color = vec3(0.53);
  r2color = mix(r2color, vec3(0.45), smoothstep(0.3, 0.6, uv.y) * 0.35);

  float r3 = auroraRibbon(uv, t * 0.75, -0.30, 0.16, 3.0, 0.22, 4.3);
  vec3 r3color = vec3(0.48);
  r3color = mix(r3color, vec3(0.45), smoothstep(0.1, -0.1, uv.y) * 0.3);

  float r4 = auroraRibbon(uv, t * 0.6, 0.15, 0.30, 1.8, 0.35, 1.0);
  vec3 r4color = vec3(0.40);

  float r5 = auroraRibbon(uv, t * 1.1, -0.10, 0.10, 3.5, 0.18, 5.7);
  vec3 r5color = vec3(0.60);

  float r6 = auroraRibbon(uv, t * 0.65, 0.55, 0.14, 2.2, 0.20, 3.5);
  vec3 r6color = vec3(0.45);

  float r7 = auroraRibbon(uv, t * 0.5, -0.20, 0.35, 1.5, 0.30, 6.2);
  vec3 r7color = vec3(0.32);

  float i1 = r1 * 1.4 * u_auroraIntensity;
  float i2 = r2 * 1.1 * u_auroraIntensity;
  float i3 = r3 * 0.9 * u_auroraIntensity;
  float i4 = r4 * 0.5 * u_auroraIntensity;
  float i5 = r5 * 0.8 * u_auroraIntensity;
  float i6 = r6 * 0.6 * u_auroraIntensity;
  float i7 = r7 * 0.35 * u_auroraIntensity;

  vec3 auroraLight = r1color * i1 + r2color * i2 + r3color * i3
                   + r4color * i4 + r5color * i5 + r6color * i6 + r7color * i7;

  float pulse = 0.85 + 0.15 * sin(t * 0.8) * sin(t * 0.53 + 1.0);
  auroraLight *= pulse;

  float glowY = smoothstep(-0.3, 0.0, uv.y) * smoothstep(0.75, 0.25, uv.y);
  float totalAurora = i1 + i2 + i3 + i4 + i5 + i6 + i7;
  vec3 atmosphericGlow = vec3(0.11) * glowY * min(totalAurora, 2.5) * 0.4;

  col += auroraLight + atmosphericGlow;
  col -= starColor * starField * clamp(totalAurora * 0.5, 0.0, 1.0);

  float groundLine = -0.35;
  float groundFade = smoothstep(groundLine + 0.05, groundLine - 0.15, uv.y);

  if (groundFade > 0.001) {
    float perspY = max(0.001, groundLine - uv.y);
    vec2 crystalUV = vec2(uv.x / (perspY * 2.0 + 0.5), 1.0 / (perspY * 3.0));
    crystalUV.x += t * 0.02;

    float crystal = crystalPattern(crystalUV, u_time);
    vec3 iceColor = vec3(0.09);
    vec3 iceCrystalColor = vec3(0.24);
    vec3 iceSurface = mix(iceColor, iceCrystalColor, crystal * 0.5);

    vec2 reflUV = vec2(uv.x, -uv.y - groundLine * 2.0);
    float rr1 = auroraRibbon(reflUV, t, 0.0, 0.25, 2.5, 0.28, 0.0) * 0.3;
    float rr2 = auroraRibbon(reflUV, t * 0.9, 0.35, 0.20, 2.8, 0.24, 2.1) * 0.2;
    float rr3 = auroraRibbon(reflUV, t * 0.75, -0.30, 0.18, 3.0, 0.22, 4.3) * 0.15;
    vec3 reflectionColor = r1color * rr1 + r2color * rr2 + r3color * rr3;
    reflectionColor *= u_auroraIntensity * pulse;

    float reflStrength = smoothstep(0.25, 0.0, perspY) * 0.6;
    float sparkle = pow(crystal, 3.0) * reflStrength;
    vec3 sparkleColor = vec3(0.82) * sparkle * 0.3;

    iceSurface += reflectionColor * reflStrength + sparkleColor;
    col = mix(col, iceSurface, groundFade);
  }

  float horizonDist = abs(uv.y - groundLine);
  float horizonGlow = exp(-horizonDist * horizonDist / 0.003);
  vec3 horizonColor = vec3(0.14) * min(totalAurora, 3.0) * 0.35 + vec3(0.03);
  col += horizonColor * horizonGlow;

  float dist = length(uv * vec2(0.7, 0.9));
  float vignette = 1.0 - smoothstep(0.5, 1.5, dist);
  col *= 0.7 + vignette * 0.3;

  col = max(col, vec3(0.0));
  col = pow(col, vec3(0.92, 0.95, 0.98));

  gl_FragColor = vec4(col, 1.0);
}
`;

export const auroraVeilShader: ShaderPreset = {
    id: 'aurora-veil',
    label: 'Aurora Veil',
    vertexSource,
    fragmentSource,
    defaults: {
        u_auroraSpeed: 0.15,
        u_auroraIntensity: 1,
    },
};

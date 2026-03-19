import { useEffect, useRef, useState } from 'react';

interface ParticlesBackgroundProps {
    className?: string;
    particleColor?: string;
    lineColor?: string;
    particleCount?: number;
    interactionRadius?: number;
}

export function ParticlesBackground({
    className,
    particleColor = 'rgba(148, 163, 184, 0.5)',
    lineColor = 'rgba(148, 163, 184, 0.15)',
    particleCount = 60,
    interactionRadius = 100
}: ParticlesBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    // Listen for live changes to prefers-reduced-motion
    useEffect(() => {
        const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let paused = false;
        let lastTime = 0;
        let needsResize = false;

        // ── Tunable parameters ──
        const WAVE_SPEED = 0.5;
        const PARTICLE_DENSITY = 1.0;

        let width = 0, height = 0, dpr = 0, cx = 0, cy = 0;

        function resize() {
            const parent = canvas!.parentElement;
            if (!parent) return false;

            const nextWidth = parent.clientWidth;
            const nextHeight = parent.clientHeight;

            if (nextWidth < 2 || nextHeight < 2) return false;

            width = nextWidth;
            height = nextHeight;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas!.width = Math.round(width * dpr);
            canvas!.height = Math.round(height * dpr);
            canvas!.style.width = width + 'px';
            canvas!.style.height = height + 'px';
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
            cx = width / 2;
            cy = height / 2;
            initParticles();
            resizeTrail();
            return true;
        }

        // ── Simplex-style noise (2D) ──
        const perm = new Uint8Array(512);
        const grad2 = [
            [1,0],[-1,0],[0,1],[0,-1],
            [1,1],[-1,1],[1,-1],[-1,-1]
        ];
        (function initNoise() {
            const p = new Uint8Array(256);
            for (let i = 0; i < 256; i++) p[i] = i;
            for (let i = 255; i > 0; i--) {
                const j = (Math.random() * (i + 1)) | 0;
                const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
            }
            for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
        })();

        function noise2d(x: number, y: number) {
            const ix = Math.floor(x) & 255;
            const iy = Math.floor(y) & 255;
            const fx = x - Math.floor(x);
            const fy = y - Math.floor(y);
            const ux = fx * fx * (3 - 2 * fx);
            const uy = fy * fy * (3 - 2 * fy);

            const g00 = grad2[perm[ix + perm[iy]] & 7];
            const g10 = grad2[perm[ix + 1 + perm[iy]] & 7];
            const g01 = grad2[perm[ix + perm[iy + 1]] & 7];
            const g11 = grad2[perm[ix + 1 + perm[iy + 1]] & 7];

            const d00 = g00[0] * fx + g00[1] * fy;
            const d10 = g10[0] * (fx - 1) + g10[1] * fy;
            const d01 = g01[0] * fx + g01[1] * (fy - 1);
            const d11 = g11[0] * (fx - 1) + g11[1] * (fy - 1);

            const nx0 = d00 + ux * (d10 - d00);
            const nx1 = d01 + ux * (d11 - d01);
            return nx0 + uy * (nx1 - nx0);
        }

        function fbm(x: number, y: number, octaves: number) {
            let val = 0, amp = 0.5, freq = 1;
            for (let i = 0; i < octaves; i++) {
                val += amp * noise2d(x * freq, y * freq);
                amp *= 0.5;
                freq *= 2;
            }
            return val;
        }

        // ── Particle system using typed arrays ──
        let COUNT = 0;
        let posX: Float32Array, posY: Float32Array, velX: Float32Array, velY: Float32Array;
        let homeX: Float32Array, homeY: Float32Array;
        let latticeCol: Int32Array, latticeRow: Int32Array;
        let cols = 0, rows = 0, spacingX = 0, spacingY = 0;

        function initParticles() {
            // Compute grid
            const area = width * height;
            const baseCount = 2500 * PARTICLE_DENSITY;
            // Scale count with area relative to 1920x1080
            COUNT = Math.round(baseCount * Math.sqrt(area / (1920 * 1080)));
            COUNT = Math.max(400, Math.min(COUNT, 5000));

            // Grid dimensions
            const aspect = width / height;
            rows = Math.round(Math.sqrt(COUNT / aspect));
            cols = Math.round(rows * aspect);
            COUNT = rows * cols;

            spacingX = width / (cols + 1);
            spacingY = height / (rows + 1);

            posX = new Float32Array(COUNT);
            posY = new Float32Array(COUNT);
            velX = new Float32Array(COUNT);
            velY = new Float32Array(COUNT);
            homeX = new Float32Array(COUNT);
            homeY = new Float32Array(COUNT);
            latticeCol = new Int32Array(COUNT);
            latticeRow = new Int32Array(COUNT);

            let idx = 0;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const hx = (c + 1) * spacingX;
                    const hy = (r + 1) * spacingY;
                    homeX[idx] = hx;
                    homeY[idx] = hy;
                    // Start particles scattered randomly so the first wavefront gathers them
                    posX[idx] = hx + (Math.random() - 0.5) * spacingX * 0.3;
                    posY[idx] = hy + (Math.random() - 0.5) * spacingY * 0.3;
                    velX[idx] = 0;
                    velY[idx] = 0;
                    latticeCol[idx] = c;
                    latticeRow[idx] = r;
                    idx++;
                }
            }
        }

        // ── Wavefront state ──
        let wavePos = 0;       // 0 = left edge, 1 = right edge
        let waveDir = 1;       // +1 = left to right, -1 = right to left
        let wavePhase = 0;     // 0 = ordered behind wave, 1 = chaotic behind wave
        let waveCycleTime = 0;

        // Trail buffer: offscreen canvas for trail effect
        const trailCanvas = document.createElement('canvas');
        const trailCtx = trailCanvas.getContext('2d')!;

        function resizeTrail() {
            trailCanvas.width = canvas!.width;
            trailCanvas.height = canvas!.height;
            trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
            trailCtx.fillStyle = '#0a0a0a';
            trailCtx.fillRect(0, 0, width, height);
        }

        // ── Pre-rendered glow sprites ──
        const GLOW_RES = 64;

        function makeGlowSprite(r: number, g: number, b: number) {
            const c = document.createElement('canvas');
            c.width = GLOW_RES * 2;
            c.height = GLOW_RES * 2;
            const gc = c.getContext('2d')!;
            const grad = gc.createRadialGradient(GLOW_RES, GLOW_RES, 0, GLOW_RES, GLOW_RES, GLOW_RES);
            grad.addColorStop(0, `rgba(${r},${g},${b}, 0.6)`);
            grad.addColorStop(0.3, `rgba(${r},${g},${b}, 0.2)`);
            grad.addColorStop(0.7, `rgba(${r},${g},${b}, 0.04)`);
            grad.addColorStop(1, `rgba(${r},${g},${b}, 0)`);
            gc.fillStyle = grad;
            gc.beginPath();
            gc.arc(GLOW_RES, GLOW_RES, GLOW_RES, 0, Math.PI * 2);
            gc.fill();
            return c;
        }

        const glowOrdered = makeGlowSprite(0x80, 0xa0, 0xc8);
        const glowChaotic = makeGlowSprite(0xd0, 0xa0, 0x78);
        const glowWave = makeGlowSprite(0xe0, 0xf0, 0xff);

        // ── Color helpers ──
        function lerpColor(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number, t: number) {
            return [
                r1 + (r2 - r1) * t,
                g1 + (g2 - g1) * t,
                b1 + (b2 - b1) * t
            ];
        }

        // Ordered: cool blue (#6080b0) to ice white (#b0c0d0)
        // Chaotic: warm amber (#c8956c) to hot white (#e0d0c0)
        const ORD_R = 0x60, ORD_G = 0x80, ORD_B = 0xb0;
        const ORD_HI_R = 0xb0, ORD_HI_G = 0xc0, ORD_HI_B = 0xd0;
        const CHA_R = 0xc8, CHA_G = 0x95, CHA_B = 0x6c;
        const CHA_HI_R = 0xe0, CHA_HI_G = 0xd0, CHA_HI_B = 0xc0;
        const WAVE_R = 0xd0, WAVE_G = 0xe0, WAVE_B = 0xff;

        // ── Physics constants ──
        const SPRING_K = 4.0;
        const DAMPING = 3.5;
        const TURBULENCE_SCALE = 0.003;
        const TURBULENCE_STRENGTH = 120;

        function smoothstep(edge0: number, edge1: number, x: number) {
            const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
            return t * t * (3 - 2 * t);
        }

        // ── Main update ──
        function update(dt: number, time: number) {
            // Advance wavefront
            const cycleDuration = (width * 1.4) / (WAVE_SPEED * 180);
            waveCycleTime += dt;

            // Wavefront position: sweeps left to right, then right to left
            const rawProgress = waveCycleTime / cycleDuration;
            const cycleIndex = Math.floor(rawProgress);
            const withinCycle = rawProgress - cycleIndex;

            // Ease the wavefront with a smooth step
            const eased = withinCycle * withinCycle * (3 - 2 * withinCycle);

            if (cycleIndex % 2 === 0) {
                wavePos = eased;
                waveDir = 1;
                wavePhase = cycleIndex % 4 < 2 ? 0 : 1;
            } else {
                wavePos = 1 - eased;
                waveDir = -1;
                wavePhase = cycleIndex % 4 < 2 ? 0 : 1;
            }

            // Wave position in pixels
            const wavePx = wavePos * width;
            // Transition width: how wide the wavefront band is
            const transWidth = width * 0.12;

            // Noise time offset for turbulence animation
            const noiseT = time * 0.4;

            for (let i = 0; i < COUNT; i++) {
                const px = posX[i];
                const py = posY[i];

                // Compute phase for this particle based on distance to wavefront
                const distToWave = (px - wavePx) * waveDir;
                // Particles behind the wave: distToWave < 0 means the wave has passed
                // phase: 0 = fully ordered, 1 = fully chaotic
                let phase;
                if (wavePhase === 0) {
                    // Wave brings chaos: behind wave = chaotic, ahead = ordered
                    phase = 1 - smoothstep(-transWidth, transWidth, distToWave);
                } else {
                    // Wave brings order: behind wave = ordered, ahead = chaotic
                    phase = smoothstep(-transWidth, transWidth, distToWave);
                }

                // Transition zone energy (brightest at the wavefront)
                let transEnergy = 1 - Math.abs(distToWave) / transWidth;
                transEnergy = Math.max(0, transEnergy);
                transEnergy = transEnergy * transEnergy;

                // ── Ordered forces: spring toward home ──
                const dx = homeX[i] - px;
                const dy = homeY[i] - py;
                const springFx = dx * SPRING_K;
                const springFy = dy * SPRING_K;
                const dampFx = -velX[i] * DAMPING;
                const dampFy = -velY[i] * DAMPING;
                const orderedFx = springFx + dampFx;
                const orderedFy = springFy + dampFy;

                // ── Chaotic forces: noise-based turbulence ──
                const nx = px * TURBULENCE_SCALE;
                const ny = py * TURBULENCE_SCALE;
                const angle = fbm(nx + noiseT, ny + noiseT * 0.7, 3) * Math.PI * 4;
                const turbFx = Math.cos(angle) * TURBULENCE_STRENGTH;
                const turbFy = Math.sin(angle) * TURBULENCE_STRENGTH;
                // Add swirl
                const swirlAngle = Math.atan2(py - cy, px - cx);
                const swirlDist = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
                const swirlStrength = 30 * Math.min(1, swirlDist / (width * 0.3));
                const finalTurbFx = turbFx + Math.cos(swirlAngle + Math.PI * 0.5) * swirlStrength;
                const finalTurbFy = turbFy + Math.sin(swirlAngle + Math.PI * 0.5) * swirlStrength;
                // Drag in chaotic state
                const chaoticDampX = -velX[i] * 1.2;
                const chaoticDampY = -velY[i] * 1.2;
                const chaoticFx = finalTurbFx + chaoticDampX;
                const chaoticFy = finalTurbFy + chaoticDampY;

                // ── Wavefront kick: extra energy at the transition boundary ──
                let kickFx = 0, kickFy = 0;
                if (transEnergy > 0.01) {
                    const kickAngle = fbm(nx * 2 + noiseT * 1.5, ny * 2 + 100, 2) * Math.PI * 2;
                    const kickStrength = transEnergy * 200;
                    kickFx = Math.cos(kickAngle) * kickStrength;
                    kickFy = Math.sin(kickAngle) * kickStrength;
                }

                // ── Blend forces ──
                const fx = orderedFx * (1 - phase) + chaoticFx * phase + kickFx;
                const fy = orderedFy * (1 - phase) + chaoticFy * phase + kickFy;

                velX[i] += fx * dt;
                velY[i] += fy * dt;

                // Clamp velocity
                const speed = Math.sqrt(velX[i] * velX[i] + velY[i] * velY[i]);
                const maxSpeed = 300;
                if (speed > maxSpeed) {
                    velX[i] = velX[i] / speed * maxSpeed;
                    velY[i] = velY[i] / speed * maxSpeed;
                }

                posX[i] += velX[i] * dt;
                posY[i] += velY[i] * dt;

                // Soft boundary: push particles back toward canvas
                const margin = 20;
                if (posX[i] < -margin) { posX[i] = -margin; velX[i] = Math.abs(velX[i]) * 0.5; }
                if (posX[i] > width + margin) { posX[i] = width + margin; velX[i] = -Math.abs(velX[i]) * 0.5; }
                if (posY[i] < -margin) { posY[i] = -margin; velY[i] = Math.abs(velY[i]) * 0.5; }
                if (posY[i] > height + margin) { posY[i] = height + margin; velY[i] = -Math.abs(velY[i]) * 0.5; }
            }
        }

        // ── Rendering ──
        function render(timestamp: number) {
            if (paused) { 
                animationFrameId = requestAnimationFrame(render); 
                return; 
            }

            if (needsResize) {
                if (resize()) {
                    needsResize = false;
                }
            }

            if (!lastTime) lastTime = timestamp;
            const dt = Math.min((timestamp - lastTime) / 1000, 0.033);
            lastTime = timestamp;

            if (prefersReducedMotion) {
                // For reduced motion, just draw a static frame
                if (!animationFrameId) {
                    update(dt * 0.15, timestamp / 1000);
                    drawFrame(timestamp / 1000);
                }
                animationFrameId = requestAnimationFrame(render);
                return;
            }

            const time = timestamp / 1000;
            update(dt, time);
            drawFrame(time);

            animationFrameId = requestAnimationFrame(render);
        }

        function drawFrame(time: number) {
            // ── Trail layer: fade previous frame ──
            trailCtx.fillStyle = 'rgba(10, 10, 10, 0.15)';
            trailCtx.fillRect(0, 0, width, height);

            // Wavefront position for rendering
            const wavePx = wavePos * width;
            const transWidth = width * 0.12;
            const noiseT = time * 0.4;

            // ── Layer 1: Background energy noise ──
            if (!prefersReducedMotion) {
                const bgStep = 40;
                for (let bx = 0; bx < width; bx += bgStep) {
                    for (let by = 0; by < height; by += bgStep) {
                        const distToWave = (bx - wavePx) * waveDir;
                        let bgPhase;
                        if (wavePhase === 0) {
                            bgPhase = 1 - smoothstep(-transWidth, transWidth, distToWave);
                        } else {
                            bgPhase = smoothstep(-transWidth, transWidth, distToWave);
                        }

                        const nVal = fbm(bx * 0.005 + noiseT * 0.3, by * 0.005 + noiseT * 0.2, 2);
                        const bgAlpha = (0.01 + Math.abs(nVal) * 0.04) * bgPhase;
                        if (bgAlpha < 0.003) continue;

                        trailCtx.fillStyle = `rgba(${CHA_R},${CHA_G},${CHA_B},${bgAlpha.toFixed(3)})`;
                        trailCtx.fillRect(bx, by, bgStep, bgStep);
                    }
                }
            }

            // ── Layer 2: Lattice connections in ordered regions ──
            trailCtx.lineWidth = 0.5;
            for (let i = 0; i < COUNT; i++) {
                const c = latticeCol[i];
                const r = latticeRow[i];

                const distToWave = (posX[i] - wavePx) * waveDir;
                let phase;
                if (wavePhase === 0) {
                    phase = 1 - smoothstep(-transWidth, transWidth, distToWave);
                } else {
                    phase = smoothstep(-transWidth, transWidth, distToWave);
                }

                // Only draw connections in ordered regions (phase < 0.5)
                if (phase > 0.5) continue;

                const orderedAmount = 1 - phase * 2; // 0..1 scale of how ordered
                const lineAlpha = orderedAmount * 0.08;
                if (lineAlpha < 0.005) continue;

                // Connect to right neighbor
                if (c < cols - 1) {
                    const j = i + 1;
                    const dx = posX[j] - posX[i];
                    const dy = posY[j] - posY[i];
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < spacingX * 2) {
                        const alpha = lineAlpha * (1 - dist / (spacingX * 2));
                        trailCtx.strokeStyle = `rgba(64, 80, 112, ${alpha.toFixed(3)})`;
                        trailCtx.beginPath();
                        trailCtx.moveTo(posX[i], posY[i]);
                        trailCtx.lineTo(posX[j], posY[j]);
                        trailCtx.stroke();
                    }
                }

                // Connect to bottom neighbor
                if (r < rows - 1) {
                    const j = i + cols;
                    const dx = posX[j] - posX[i];
                    const dy = posY[j] - posY[i];
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < spacingY * 2) {
                        const alpha = lineAlpha * (1 - dist / (spacingY * 2));
                        trailCtx.strokeStyle = `rgba(64, 80, 112, ${alpha.toFixed(3)})`;
                        trailCtx.beginPath();
                        trailCtx.moveTo(posX[i], posY[i]);
                        trailCtx.lineTo(posX[j], posY[j]);
                        trailCtx.stroke();
                    }
                }
            }

            // ── Layer 3: Phase wavefront band ──
            if (!prefersReducedMotion) {
                const waveGlowWidth = transWidth * 2.5;
                const grad = trailCtx.createLinearGradient(wavePx - waveGlowWidth, 0, wavePx + waveGlowWidth, 0);
                grad.addColorStop(0, 'rgba(208, 224, 255, 0)');
                grad.addColorStop(0.3, 'rgba(208, 224, 255, 0.02)');
                grad.addColorStop(0.5, 'rgba(220, 235, 255, 0.06)');
                grad.addColorStop(0.7, 'rgba(208, 224, 255, 0.02)');
                grad.addColorStop(1, 'rgba(208, 224, 255, 0)');
                trailCtx.fillStyle = grad;
                trailCtx.fillRect(wavePx - waveGlowWidth, 0, waveGlowWidth * 2, height);

                // Bright core line
                trailCtx.strokeStyle = 'rgba(220, 235, 255, 0.12)';
                trailCtx.lineWidth = 2;
                trailCtx.beginPath();
                // Slightly wavy line
                for (let y = 0; y < height; y += 8) {
                    const wobble = fbm(y * 0.01 + time * 0.5, time * 0.3, 2) * 15;
                    if (y === 0) {
                        trailCtx.moveTo(wavePx + wobble, y);
                    } else {
                        trailCtx.lineTo(wavePx + wobble, y);
                    }
                }
                trailCtx.stroke();
            }

            // ── Layer 4: Particles with chaotic trails ──
            // Chaotic particles leave dots on the trail canvas
            for (let i = 0; i < COUNT; i++) {
                const distToWave = (posX[i] - wavePx) * waveDir;
                let phase;
                if (wavePhase === 0) {
                    phase = 1 - smoothstep(-transWidth, transWidth, distToWave);
                } else {
                    phase = smoothstep(-transWidth, transWidth, distToWave);
                }

                // Only chaotic particles leave trails
                if (phase > 0.3) {
                    const speed = Math.sqrt(velX[i] * velX[i] + velY[i] * velY[i]);
                    const trailAlpha = phase * Math.min(1, speed / 100) * 0.15;
                    if (trailAlpha > 0.005) {
                        const col = lerpColor(ORD_R, ORD_G, ORD_B, CHA_R, CHA_G, CHA_B, phase);
                        trailCtx.fillStyle = `rgba(${Math.round(col[0])},${Math.round(col[1])},${Math.round(col[2])},${trailAlpha.toFixed(3)})`;
                        trailCtx.beginPath();
                        trailCtx.arc(posX[i], posY[i], 1.5, 0, Math.PI * 2);
                        trailCtx.fill();
                    }
                }
            }

            // ── Composite trail canvas onto main canvas ──
            ctx!.drawImage(trailCanvas, 0, 0, trailCanvas.width, trailCanvas.height, 0, 0, width, height);

            // ── Layer 5: Particle cores (drawn fresh each frame) ──
            for (let i = 0; i < COUNT; i++) {
                const px = posX[i];
                const py = posY[i];

                const distToWave = (px - wavePx) * waveDir;
                let phase;
                if (wavePhase === 0) {
                    phase = 1 - smoothstep(-transWidth, transWidth, distToWave);
                } else {
                    phase = smoothstep(-transWidth, transWidth, distToWave);
                }

                let transEnergy = 1 - Math.abs(distToWave) / transWidth;
                transEnergy = Math.max(0, transEnergy);
                transEnergy = transEnergy * transEnergy;

                // Particle size: larger in transition zone
                const baseSize = 1.2 + phase * 0.8;
                const size = baseSize + transEnergy * 2.5;

                // Color: blend between ordered (blue) and chaotic (amber)
                const speed = Math.sqrt(velX[i] * velX[i] + velY[i] * velY[i]);
                const energyBright = Math.min(1, speed / 150);

                let r: number, g: number, b: number;
                if (transEnergy > 0.1) {
                    // Wavefront particles: bright white with a color tint
                    const t = transEnergy;
                    r = WAVE_R + (255 - WAVE_R) * t * 0.5;
                    g = WAVE_G + (255 - WAVE_G) * t * 0.5;
                    b = WAVE_B + (255 - WAVE_B) * t * 0.3;
                } else if (phase < 0.5) {
                    // Ordered: cool blue to ice white based on proximity to lattice
                    const dx = px - homeX[i];
                    const dy = py - homeY[i];
                    const distFromHome = Math.sqrt(dx * dx + dy * dy);
                    const settled = 1 - Math.min(1, distFromHome / spacingX);
                    r = ORD_R + (ORD_HI_R - ORD_R) * settled;
                    g = ORD_G + (ORD_HI_G - ORD_G) * settled;
                    b = ORD_B + (ORD_HI_B - ORD_B) * settled;
                } else {
                    // Chaotic: warm amber to hot white based on speed
                    r = CHA_R + (CHA_HI_R - CHA_R) * energyBright;
                    g = CHA_G + (CHA_HI_G - CHA_G) * energyBright;
                    b = CHA_B + (CHA_HI_B - CHA_B) * energyBright;
                }

                let alpha = 0.6 + transEnergy * 0.4 + energyBright * 0.15;
                alpha = Math.min(1, alpha);

                // Draw glow for energetic particles using pre-rendered sprites
                if (transEnergy > 0.05 || (phase > 0.5 && speed > 50)) {
                    const glowSize = size * 3;
                    const glowAlpha = (transEnergy * 0.3 + energyBright * 0.08) * alpha;
                    if (glowAlpha > 0.005) {
                        const sprite = transEnergy > 0.1 ? glowWave : (phase < 0.5 ? glowOrdered : glowChaotic);
                        ctx!.globalAlpha = Math.min(glowAlpha, 0.8);
                        ctx!.drawImage(sprite, px - glowSize, py - glowSize, glowSize * 2, glowSize * 2);
                        ctx!.globalAlpha = 1;
                    }
                }

                // Core dot
                ctx!.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha.toFixed(3)})`;
                ctx!.beginPath();
                ctx!.arc(px, py, size, 0, Math.PI * 2);
                ctx!.fill();

                // Bright center for wavefront particles
                if (transEnergy > 0.3) {
                    ctx!.fillStyle = `rgba(255, 255, 255, ${(transEnergy * 0.5).toFixed(3)})`;
                    ctx!.beginPath();
                    ctx!.arc(px, py, size * 0.4, 0, Math.PI * 2);
                    ctx!.fill();
                }
            }

            // ── Vignette ──
            const maxDim = Math.max(width, height);
            const vignette = ctx!.createRadialGradient(cx, cy, maxDim * 0.3, cx, cy, maxDim * 0.85);
            vignette.addColorStop(0, 'rgba(10, 10, 10, 0)');
            vignette.addColorStop(1, 'rgba(10, 10, 10, 0.4)');
            ctx!.fillStyle = vignette;
            ctx!.fillRect(0, 0, width, height);
        }

        const handleWindowResize = () => {
            needsResize = true;
        };

        const handleCanvasClick = (e: MouseEvent) => {
            const rect = canvas!.getBoundingClientRect();
            wavePos = (e.clientX - rect.left) / width;
            waveDir = Math.random() < 0.5 ? 1 : -1;
            wavePhase = 1 - wavePhase;
            waveCycleTime = 0;
        };

        const handleCanvasTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            const rect = canvas!.getBoundingClientRect();
            wavePos = (e.touches[0].clientX - rect.left) / width;
            waveDir = Math.random() < 0.5 ? 1 : -1;
            wavePhase = 1 - wavePhase;
            waveCycleTime = 0;
        };

        // Event listeners
        window.addEventListener('resize', handleWindowResize);
        
        if (!prefersReducedMotion) {
            canvas!.addEventListener('click', handleCanvasClick);
            canvas!.addEventListener('touchstart', handleCanvasTouchStart, { passive: false });
        }

        // Visibility handling
        const handleVisibilityChange = () => {
            paused = document.hidden;
            if (!paused) lastTime = 0;
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Initialize
        needsResize = !resize();

        // Start render loop
        animationFrameId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
            canvas!.removeEventListener('click', handleCanvasClick);
            canvas!.removeEventListener('touchstart', handleCanvasTouchStart);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            cancelAnimationFrame(animationFrameId);
        };
    }, [prefersReducedMotion]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{
                display: 'block',
                animation: 'fadeIn 600ms ease-out',
            }}
        />
    );
}

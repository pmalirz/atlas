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
        let particles: Array<{ x: number; y: number; vx: number; vy: number; size: number }> = [];

        const mouse = { x: -1000, y: -1000 };

        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
            initParticles();
        };

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 1
                });
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const drawParticles = (animate: boolean) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, index) => {
                // Only update positions when animating
                if (animate) {
                    p.x += p.vx;
                    p.y += p.vy;

                    // Bounce off edges
                    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                }

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = particleColor;
                ctx.fill();

                // Draw connections to other particles
                for (let j = index + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < interactionRadius) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = lineColor;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }

                // Draw connection to mouse (only when animating)
                if (animate) {
                    const dxMouse = p.x - mouse.x;
                    const dyMouse = p.y - mouse.y;
                    const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

                    if (distanceMouse < interactionRadius * 1.5) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.strokeStyle = lineColor;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            });

            if (animate) {
                animationFrameId = requestAnimationFrame(() => drawParticles(true));
            }
        };

        window.addEventListener('resize', resizeCanvas);

        if (!prefersReducedMotion) {
            window.addEventListener('mousemove', onMouseMove);
        }

        resizeCanvas();

        // If reduced motion: draw once (static). Otherwise: animate.
        drawParticles(!prefersReducedMotion);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [particleColor, lineColor, particleCount, interactionRadius, prefersReducedMotion]);

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

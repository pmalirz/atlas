import { useEffect, useRef } from 'react';

interface ParticlesBackgroundProps {
    className?: string;
    particleColor?: string;
    lineColor?: string;
    particleCount?: number;
    interactionRadius?: number;
}

export function ParticlesBackground({
    className,
    particleColor = 'rgba(148, 163, 184, 0.5)', // Slate-400
    lineColor = 'rgba(148, 163, 184, 0.15)', // Slate-400 transparent
    particleCount = 60,
    interactionRadius = 100
}: ParticlesBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Array<{ x: number; y: number; vx: number; vy: number; size: number }> = [];

        let mouse = { x: -1000, y: -1000 };

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
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check if mouse is near/inside the canvas bounds (with some margin for better UX)
            // Or just allow tracking if the user is hovering the relevant area on screen
            // Since we are moving particles *inside* the canvas, we just need coordinates.
            // If the mouse is outside, the interaction radius check in `draw` will naturally fail if far away.
            // But let's keep interactions mostly localized.

            mouse.x = x;
            mouse.y = y;
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particles.forEach((p, index) => {
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off edges
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

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

                // Draw connection to mouse
                const dxMouse = p.x - mouse.x;
                const dyMouse = p.y - mouse.y;
                const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

                // Use slightly larger radius for mouse interaction to make it feel "magnetic"
                if (distanceMouse < interactionRadius * 1.5) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = lineColor;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', onMouseMove);
        // We can remove mouseleave since we are tracking globally.
        // If mouse moves far away, distance check fails naturally.

        resizeCanvas();
        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [particleColor, lineColor, particleCount, interactionRadius]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ display: 'block' }}
        />
    );
}

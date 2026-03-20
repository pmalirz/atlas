import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { ShaderPreset } from '@/themes/shaders';

interface ThemeShaderBackgroundProps {
    shader: ShaderPreset;
    className?: string;
}

function createShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createProgram(
    gl: WebGLRenderingContext,
    vertexSource: string,
    fragmentSource: string
): WebGLProgram | null {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) {
        return null;
    }

    const program = gl.createProgram();
    if (!program) {
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

export function ThemeShaderBackground({ shader, className }: ThemeShaderBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl', {
            alpha: false,
            antialias: false,
            preserveDrawingBuffer: false,
        });
        if (!gl) return;

        const program = createProgram(gl, shader.vertexSource, shader.fragmentSource);
        if (!program) return;

        gl.useProgram(program);

        const buffer = gl.createBuffer();
        if (!buffer) {
            gl.deleteProgram(program);
            return;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        );

        const aPos = gl.getAttribLocation(program, 'a_pos');
        if (aPos >= 0) {
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
        }

        const uTime = gl.getUniformLocation(program, 'u_time');
        const uRes = gl.getUniformLocation(program, 'u_res');
        const uDripSpeed = gl.getUniformLocation(program, 'u_dripSpeed');
        const uBlobCount = gl.getUniformLocation(program, 'u_blobCount');
        const uAuroraSpeed = gl.getUniformLocation(program, 'u_auroraSpeed');
        const uAuroraIntensity = gl.getUniformLocation(program, 'u_auroraIntensity');
        const uMouse = gl.getUniformLocation(program, 'u_mouse');

        let dpr = Math.min(window.devicePixelRatio || 1, 2);
        let mouseX = -1;
        let mouseY = -1;
        let needsResize = true;
        let running = true;
        let frameId = 0;

        const resize = () => {
            needsResize = false;
            dpr = Math.min(window.devicePixelRatio || 1, 2);

            const parent = canvas.parentElement;
            const width = parent ? parent.clientWidth : canvas.clientWidth;
            const height = parent ? parent.clientHeight : canvas.clientHeight;
            if (width < 2 || height < 2) return;

            const nextWidth = Math.round(width * dpr);
            const nextHeight = Math.round(height * dpr);

            if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
                canvas.width = nextWidth;
                canvas.height = nextHeight;
                gl.viewport(0, 0, nextWidth, nextHeight);
            }

            if (uRes) {
                gl.uniform2f(uRes, canvas.width, canvas.height);
            }
        };

        const onMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = (event.clientX - rect.left) * dpr;
            mouseY = (rect.height - (event.clientY - rect.top)) * dpr;
        };

        const onMouseLeave = () => {
            mouseX = -1;
            mouseY = -1;
        };

        const onResize = () => {
            needsResize = true;
        };

        const onVisibilityChange = () => {
            running = !document.hidden;
        };

        const render = (timestamp: number) => {
            if (needsResize) resize();

            if (!running) {
                frameId = requestAnimationFrame(render);
                return;
            }

            if (uTime) gl.uniform1f(uTime, prefersReducedMotion ? 0 : timestamp * 0.001);
            if (uDripSpeed) gl.uniform1f(uDripSpeed, 0.5);
            if (uBlobCount) gl.uniform1f(uBlobCount, 1);
            if (uAuroraSpeed) gl.uniform1f(uAuroraSpeed, 0.5);
            if (uAuroraIntensity) gl.uniform1f(uAuroraIntensity, 1);
            if (uMouse) gl.uniform2f(uMouse, mouseX, mouseY);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
            frameId = requestAnimationFrame(render);
        };

        window.addEventListener('resize', onResize);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseleave', onMouseLeave);
        document.addEventListener('visibilitychange', onVisibilityChange);

        resize();
        frameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', onResize);
            canvas.removeEventListener('mousemove', onMouseMove);
            canvas.removeEventListener('mouseleave', onMouseLeave);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            gl.deleteBuffer(buffer);
            gl.deleteProgram(program);
        };
    }, [prefersReducedMotion, shader]);

    return (
        <canvas
            ref={canvasRef}
            className={cn('pointer-events-none block h-full w-full', className)}
            aria-hidden="true"
        />
    );
}

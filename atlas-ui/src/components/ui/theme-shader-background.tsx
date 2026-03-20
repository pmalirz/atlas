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

        // Collect all other uniforms from shader defaults
        const uniformLocations = new Map<string, WebGLUniformLocation | null>();
        if (shader.defaults) {
            for (const name of Object.keys(shader.defaults)) {
                uniformLocations.set(name, gl.getUniformLocation(program, name));
            }
        }

        let dpr = Math.min(window.devicePixelRatio || 1, 2);
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

            // Apply shader defaults
            if (shader.defaults) {
                for (const [name, value] of Object.entries(shader.defaults)) {
                    const location = uniformLocations.get(name);
                    if (!location) continue;
                    if (typeof value === 'number') {
                        gl.uniform1f(location, value);
                    } else if (Array.isArray(value)) {
                        if (value.length === 2) {
                            gl.uniform2f(location, value[0], value[1]);
                        } else if (value.length === 3) {
                            gl.uniform3f(location, value[0], value[1], value[2]);
                        } else if (value.length === 4) {
                            gl.uniform4f(location, value[0], value[1], value[2], value[3]);
                        }
                    }
                }
            }

            gl.drawArrays(gl.TRIANGLES, 0, 3);
            frameId = requestAnimationFrame(render);
        };

        window.addEventListener('resize', onResize);
        document.addEventListener('visibilitychange', onVisibilityChange);

        resize();
        frameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', onResize);
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

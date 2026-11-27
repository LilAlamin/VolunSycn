import { useEffect, useRef, useState } from 'react';

type HeroVideoCanvasProps = {
    src: string;
    className?: string;
};

const VERTEX_SHADER = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
    v_uv = vec2((a_pos.x + 1.0) * 0.5, 1.0 - (a_pos.y + 1.0) * 0.5);
    gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_tex;
varying vec2 v_uv;

void main() {
    vec4 color = texture2D(u_tex, v_uv);
    // Sample solid studio background color from top-left & top-right corners
    vec3 bgL = texture2D(u_tex, vec2(0.02, 0.02)).rgb;
    vec3 bgR = texture2D(u_tex, vec2(0.98, 0.02)).rgb;
    vec3 bg = (bgL + bgR) * 0.5;

    float d = distance(color.rgb, bg);
    // Smooth alpha key: removes uniform off-white background with crisp anti-aliased edges
    float alpha = smoothstep(0.042, 0.115, d);

    // Output premultiplied alpha to eliminate light edge halos
    gl_FragColor = vec4(color.rgb * alpha, alpha);
}
`;

function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string,
): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

export function HeroVideoCanvas({ src, className = '' }: HeroVideoCanvasProps) {
    'use no memo';
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [fallback, setFallback] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || fallback) return;

        // Ensure Safari treats the video as muted before triggering autoplay
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;

        const tryPlay = () => {
            video.play().catch(() => {
                // Ignore autoplay promise rejection if already playing or awaiting gesture
            });
        };

        video.addEventListener('loadeddata', tryPlay);
        video.addEventListener('canplay', tryPlay);
        tryPlay();

        const gl = canvas.getContext('webgl', {
            alpha: true,
            premultipliedAlpha: true,
            antialias: true,
            powerPreference: 'low-power',
        });

        if (!gl) {
            setFallback(true);
            return () => {
                video.removeEventListener('loadeddata', tryPlay);
                video.removeEventListener('canplay', tryPlay);
            };
        }

        const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
        const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
        if (!vs || !fs) {
            setFallback(true);
            return () => {
                video.removeEventListener('loadeddata', tryPlay);
                video.removeEventListener('canplay', tryPlay);
            };
        }

        const program = gl.createProgram();
        if (!program) {
            setFallback(true);
            return () => {
                video.removeEventListener('loadeddata', tryPlay);
                video.removeEventListener('canplay', tryPlay);
            };
        }

        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            setFallback(true);
            return () => {
                video.removeEventListener('loadeddata', tryPlay);
                video.removeEventListener('canplay', tryPlay);
            };
        }

        gl.useProgram(program);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW,
        );

        const posLoc = gl.getAttribLocation(program, 'a_pos');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.clearColor(0, 0, 0, 0);

        let rafId = 0;
        let disposed = false;

        const syncSize = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                if (
                    canvas.width !== video.videoWidth ||
                    canvas.height !== video.videoHeight
                ) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    gl.viewport(0, 0, canvas.width, canvas.height);
                }
            }
        };

        const render = () => {
            if (disposed) return;

            if (video.readyState >= 2 && video.videoWidth > 0) {
                if (video.paused) {
                    tryPlay();
                }
                syncSize();
                try {
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.texImage2D(
                        gl.TEXTURE_2D,
                        0,
                        gl.RGBA,
                        gl.RGBA,
                        gl.UNSIGNED_BYTE,
                        video,
                    );
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                } catch {
                    disposed = true;
                    setFallback(true);
                    return;
                }
            }

            rafId = requestAnimationFrame(render);
        };

        rafId = requestAnimationFrame(render);

        return () => {
            disposed = true;
            cancelAnimationFrame(rafId);
            video.removeEventListener('loadeddata', tryPlay);
            video.removeEventListener('canplay', tryPlay);
            gl.deleteTexture(texture);
            gl.deleteBuffer(buffer);
            gl.deleteProgram(program);
            gl.deleteShader(vs);
            gl.deleteShader(fs);
        };
    }, [fallback]);

    if (fallback) {
        return (
            <video
                src={src}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden="true"
                className={`block h-auto w-full brightness-[1.04] contrast-[1.03] mix-blend-multiply select-none ${className}`}
            />
        );
    }

    return (
        <div className={`relative w-full ${className}`}>
            {/* Keep full-size & non-zero opacity behind canvas so Safari never pauses decoding */}
            <video
                ref={videoRef}
                src={src}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.004]"
            />
            <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                aria-hidden="true"
                className="relative z-10 block h-auto w-full select-none"
            />
        </div>
    );
}

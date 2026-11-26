import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

type SplashScreenProps = {
    onRevealStart?: () => void;
    onComplete?: () => void;
};

type StrokeSpec = {
    id: string;
    d: string;
    stroke: string;
    strokeWidth: number;
    delay: number;
    duration: number;
};

const strokeEase = [0.65, 0, 0.35, 1] as const;
const curtainEase = [0.76, 0, 0.24, 1] as const;

/**
 * Refined architectural geometric monoline strokes for "VOLUN" / "SYNC"
 * — calm, poised, editorial proportions with smooth rounded caps & joins.
 * ViewBox: 0 0 264 166 (center x = 132)
 */
const logoStrokes: StrokeSpec[] = [
    // Top row: V O L U N (sleek architectural proportions, y: 16..58, strokeWidth: 5.2)
    {
        id: 'top-o',
        d: 'M 86 16 A 16 21 0 1 1 85.99 16 Z',
        stroke: '#1A7D8C',
        strokeWidth: 5.2,
        delay: 0.08,
        duration: 0.52,
    },
    {
        id: 'top-v',
        d: 'M 26 16 L 42 58 L 58 16',
        stroke: '#1A7D8C',
        strokeWidth: 5.2,
        delay: 0.22,
        duration: 0.42,
    },
    {
        id: 'top-l',
        d: 'M 116 16 L 116 58 L 140 58',
        stroke: '#1A7D8C',
        strokeWidth: 5.2,
        delay: 0.34,
        duration: 0.36,
    },
    {
        id: 'top-u',
        d: 'M 154 16 L 154 43 C 154 53 161 58 170 58 C 179 58 186 53 186 43 L 186 16',
        stroke: '#1A7D8C',
        strokeWidth: 5.2,
        delay: 0.44,
        duration: 0.44,
    },
    {
        id: 'top-n',
        d: 'M 202 58 L 202 16 L 236 58 L 236 16',
        stroke: '#1A7D8C',
        strokeWidth: 5.2,
        delay: 0.54,
        duration: 0.46,
    },

    // Bottom row: S Y N C (poised editorial display weight, y: 80..150, strokeWidth: 7.4)
    {
        id: 'bot-s',
        d: 'M 61 93 C 58 84 50 80 40 80 C 28 80 21 87 21 96 C 21 106 29 110 42 114 C 55 118 63 123 63 134 C 63 144 54 150 41 150 C 30 150 22 145 19 136',
        stroke: '#0F4D59',
        strokeWidth: 7.4,
        delay: 0.62,
        duration: 0.56,
    },
    {
        id: 'bot-y-left',
        d: 'M 80 80 L 102 117 L 102 150',
        stroke: '#0F4D59',
        strokeWidth: 7.4,
        delay: 0.78,
        duration: 0.4,
    },
    {
        id: 'bot-y-right',
        d: 'M 124 80 L 102 117',
        stroke: '#0F4D59',
        strokeWidth: 7.4,
        delay: 0.88,
        duration: 0.28,
    },
    {
        id: 'bot-n',
        d: 'M 140 150 L 140 80 L 184 150 L 184 80',
        stroke: '#0F4D59',
        strokeWidth: 7.4,
        delay: 0.92,
        duration: 0.48,
    },
    {
        id: 'bot-c',
        d: 'M 244 96 C 239 85 231 80 220 80 C 206 80 199 95 199 115 C 199 135 206 150 220 150 C 231 150 239 145 244 134',
        stroke: '#0F4D59',
        strokeWidth: 7.4,
        delay: 1.04,
        duration: 0.48,
    },
];

export function SplashScreen({
    onRevealStart,
    onComplete,
}: SplashScreenProps) {
    'use no memo';
    const prefersReducedMotion = useReducedMotion();
    const [phase, setPhase] = useState<'drawing' | 'exiting' | 'done'>(
        'drawing',
    );

    // Keep latest callbacks in refs so parent re-renders NEVER reset timers
    const onRevealStartRef = useRef(onRevealStart);
    const onCompleteRef = useRef(onComplete);
    onRevealStartRef.current = onRevealStart;
    onCompleteRef.current = onComplete;

    const exitStartedRef = useRef(false);

    // Lock vertical scroll only while actively covering the screen
    useEffect(() => {
        if (phase === 'done') return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [phase]);

    // Single stable timeline effect — runs once, immune to parent re-renders
    useEffect(() => {
        if (prefersReducedMotion) {
            onRevealStartRef.current?.();
            const quick = window.setTimeout(() => {
                setPhase('done');
                onCompleteRef.current?.();
            }, 150);
            return () => window.clearTimeout(quick);
        }

        let doneTimer = 0;

        const startExit = () => {
            if (exitStartedRef.current) return;
            exitStartedRef.current = true;
            setPhase('exiting');
            onRevealStartRef.current?.();

            doneTimer = window.setTimeout(() => {
                setPhase('done');
                onCompleteRef.current?.();
            }, 1020);
        };

        const exitTimer = window.setTimeout(startExit, 1800);

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                window.clearTimeout(exitTimer);
                startExit();
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.clearTimeout(exitTimer);
            window.clearTimeout(doneTimer);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [prefersReducedMotion]);

    if (phase === 'done') {
        return null;
    }

    const isExiting = phase === 'exiting';

    return (
        <div
            role="status"
            aria-label="Loading VolunSync"
            className={`fixed inset-0 z-[100] overflow-hidden select-none ${
                isExiting ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
        >
            {/* Trailing Soft Ocean-Teal Semicircle Curtain */}
            <motion.div
                aria-hidden="true"
                initial={{ y: '0%' }}
                animate={isExiting ? { y: '-130%' } : { y: '0%' }}
                transition={{
                    duration: 0.85,
                    delay: isExiting ? 0.1 : 0,
                    ease: curtainEase,
                }}
                className="absolute inset-0 z-[1] bg-[#CDEEF2] will-change-transform"
            >
                <svg
                    viewBox="0 0 1440 150"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute right-0 -bottom-[148px] left-0 h-[150px] w-full fill-[#CDEEF2]"
                >
                    <path d="M0,0 L1440,0 L1440,12 Q720,150 0,12 Z" />
                </svg>
            </motion.div>

            {/* Primary Light Canvas Curtain with Curved Semicircle Bottom Edge */}
            <motion.div
                initial={{ y: '0%' }}
                animate={isExiting ? { y: '-130%' } : { y: '0%' }}
                transition={{
                    duration: 0.82,
                    delay: isExiting ? 0.01 : 0,
                    ease: curtainEase,
                }}
                className="relative z-[2] flex h-full w-full items-center justify-center bg-[#F4F8FA] will-change-transform"
            >
                {/* Centered Refined Architectural Monoline Wordmark */}
                <motion.div
                    initial={{ opacity: 1, scale: 1, y: 0 }}
                    animate={
                        isExiting
                            ? { opacity: 0, scale: 0.94, y: -24 }
                            : { opacity: 1, scale: 1, y: 0 }
                    }
                    transition={{
                        duration: 0.38,
                        ease: curtainEase,
                    }}
                    className="w-[215px] sm:w-[255px]"
                >
                    <svg
                        viewBox="0 0 264 166"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-auto w-full overflow-visible"
                    >
                        {logoStrokes.map((stroke) => (
                            <motion.path
                                key={stroke.id}
                                d={stroke.d}
                                stroke={stroke.stroke}
                                strokeWidth={stroke.strokeWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{
                                    pathLength: 0,
                                    opacity: 0,
                                }}
                                animate={{
                                    pathLength: 1,
                                    opacity: 1,
                                }}
                                transition={{
                                    pathLength: {
                                        duration: stroke.duration,
                                        delay: stroke.delay,
                                        ease: strokeEase,
                                    },
                                    opacity: {
                                        duration: 0.08,
                                        delay: stroke.delay,
                                    },
                                }}
                            />
                        ))}
                    </svg>
                </motion.div>

                {/* Generous Curved Semicircle Lip on the Primary Curtain */}
                <svg
                    aria-hidden="true"
                    viewBox="0 0 1440 150"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute right-0 -bottom-[148px] left-0 h-[150px] w-full fill-[#F4F8FA]"
                >
                    <path d="M0,0 L1440,0 L1440,12 Q720,150 0,12 Z" />
                </svg>
            </motion.div>
        </div>
    );
}

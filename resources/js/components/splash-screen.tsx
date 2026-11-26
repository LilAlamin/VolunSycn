import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

type SplashScreenProps = {
    onRevealStart?: () => void;
    onComplete?: () => void;
};

const logoEase = [0.22, 1, 0.36, 1] as const;
const curtainEase = [0.76, 0, 0.24, 1] as const;

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

        const exitTimer = window.setTimeout(startExit, 1650);

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
                {/* Centered Official VolunSync Logo Lockup */}
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
                    className="relative flex flex-col items-center text-center"
                >
                    {/* Soft Ambient Teal-Blue Halo Behind Mark */}
                    <motion.div
                        aria-hidden="true"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 0.7, scale: 1.08 }}
                        transition={{ duration: 0.9, ease: logoEase }}
                        className="pointer-events-none absolute -top-8 h-44 w-44 rounded-full bg-gradient-to-tr from-[#00b4b6]/14 via-[#0284c7]/10 to-[#2563eb]/14 blur-3xl"
                    />

                    {/* Official VolunSync Mark (True Transparent PNG) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.74, rotate: -6, y: 12 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                        transition={{ duration: 0.75, ease: logoEase }}
                        className="relative mb-4 w-28 sm:w-32"
                    >
                        <img
                            src="/images/volunsync-mark.png"
                            alt="VolunSync Logo"
                            className="h-auto w-full object-contain drop-shadow-[0_10px_22px_rgba(2,132,199,0.16)]"
                        />
                    </motion.div>

                    {/* Masked Wordmark Reveal */}
                    <div className="overflow-hidden">
                        <motion.span
                            initial={{ y: '105%', opacity: 0 }}
                            animate={{ y: '0%', opacity: 1 }}
                            transition={{
                                duration: 0.6,
                                delay: 0.24,
                                ease: logoEase,
                            }}
                            className="block text-3xl font-extrabold tracking-[-0.03em] text-[#0B162C] sm:text-4xl"
                        >
                            VolunSync
                        </motion.span>
                    </div>

                    {/* Masked Tagline Reveal */}
                    <div className="mt-1.5 overflow-hidden">
                        <motion.span
                            initial={{ y: '110%', opacity: 0 }}
                            animate={{ y: '0%', opacity: 1 }}
                            transition={{
                                duration: 0.55,
                                delay: 0.4,
                                ease: logoEase,
                            }}
                            className="block text-[10px] font-medium tracking-[0.26em] text-[#475569] uppercase sm:text-[11px]"
                        >
                            Community Volunteer Platform
                        </motion.span>
                    </div>

                    {/* Sleek Brand Gradient Progress Bar */}
                    <div className="mt-6 h-[3px] w-32 overflow-hidden rounded-full bg-[#DCE7EF]">
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{
                                duration: 1.25,
                                delay: 0.2,
                                ease: logoEase,
                            }}
                            className="h-full w-full origin-left rounded-full bg-gradient-to-r from-[#00b4b6] via-[#0284c7] to-[#2563eb]"
                        />
                    </div>
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

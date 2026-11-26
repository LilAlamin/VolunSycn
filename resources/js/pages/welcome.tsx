import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarDays,
    Check,
    Copy,
    MapPin,
    Sparkles,
} from 'lucide-react';
import {
    MotionConfig,
    motion,
    useAnimationFrame,
    useInView,
    useScroll,
    useSpring,
    useTransform,
    useVelocity,
    type MotionValue,
} from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import { SplashScreen } from '@/components/splash-screen';
import type { Auth } from '@/types';

type FeaturedEvent = {
    id: number;
    title: string;
    venue_name: string;
    start_date: string;
    status: string;
    divisions_count: number;
    shifts_count: number;
};

type WelcomeProps = {
    stats?: {
        volunteers: number;
        events: number;
        divisions: number;
        shifts: number;
        verified_hours: number;
    };
    featuredEvents?: FeaturedEvent[];
};

const manifestoText =
    "We believe great events need focus, not chaos. That's why VolunSync puts recruitment, divisions, shifts, documents and check-ins in one calm dashboard — so organizers can stop chasing and start running.";

const manifestoPills = [
    {
        // Over dark teal text → light teal pill
        label: 'Conflict-free shifts',
        bg: 'border border-[#8FD3DC] bg-[#CDEEF2] text-[#0E4D59]',
        rotate: -4.5,
        position: 'top-[13%] right-[4%] sm:top-[14%] sm:right-[11%]',
        appearAt: 0.2,
    },
    {
        // Over dark/medium-dark teal text → light teal pill
        label: 'QR + GPS check-in',
        bg: 'border border-[#8FD3DC] bg-[#CDEEF2] text-[#0E4D59]',
        rotate: 4,
        position: 'top-[46%] left-[2%] sm:top-[45%] sm:left-[4%]',
        appearAt: 0.44,
    },
    {
        // Over light teal text → dark teal pill
        label: 'Role-based access',
        bg: 'bg-[#0F4D59] text-white',
        rotate: -3.5,
        position: 'top-[62%] right-[2%] sm:top-[58%] sm:right-[6%]',
        appearAt: 0.66,
    },
    {
        // Over light teal text → dark teal pill
        label: 'Live notifications',
        bg: 'bg-[#0F4D59] text-white',
        rotate: 3.2,
        position: 'bottom-[4%] left-[10%] sm:bottom-[6%] sm:left-[18%]',
        appearAt: 0.82,
    },
];

const ribbonItems = [
    'NO SPREADSHEETS',
    'ZERO DOUBLE-BOOKING',
    'QR + GPS CHECK-IN',
    'DIVISION WORKSPACES',
    'VERIFIED SERVICE HOURS',
    'ROLE-BASED ACCESS',
];

const pillars = [
    {
        num: '01',
        title: 'Recruitment & Screening',
        description:
            'Quota-aware applications with a fast screening table, CV preview, and live status timelines for every applicant.',
        tags: ['Quota tracking', 'Screening table', 'Live timelines'],
        image: '/images/pillar-recruitment-3d.jpg',
        href: '/events',
    },
    {
        num: '02',
        title: 'Division Workspaces',
        description:
            'Dedicated team hubs that unlock automatically on acceptance — announcements, coordinator info, and peer briefings.',
        tags: ['Auto access', 'Team briefings', 'Peer roster'],
        image: '/images/pillar-workspaces-3d.jpg',
        href: '/login',
    },
    {
        num: '03',
        title: 'Zero-Overlap Scheduling',
        description:
            'Multi-division shift rosters with server-side conflict checks, so no volunteer is ever double-booked.',
        tags: ['0% double-booking', 'Multi-division', 'Shift roster'],
        image: '/images/pillar-scheduling-3d.jpg',
        href: '/login',
    },
    {
        num: '04',
        title: 'QR + GPS Attendance',
        description:
            'Mobile camera QR scanning with Haversine venue proximity checks and automatic service-hour logs.',
        tags: ['Dynamic QR', 'Geofence', 'Verified hours'],
        image: '/images/pillar-attendance-3d.jpg',
        href: '/login',
    },
];

const journeyStages = [
    {
        num: '01',
        title: 'Discover',
        description:
            'Browse open community events and division quotas, then apply in a minute.',
    },
    {
        num: '02',
        title: 'Screening',
        description:
            'Coordinators filter applicants by division and status, then accept with one click.',
    },
    {
        num: '03',
        title: 'Coordinate',
        description:
            'Division workspaces unlock automatically with briefings and conflict-free shifts.',
    },
    {
        num: '04',
        title: 'On-site ops',
        description:
            'Volunteers scan in with QR + venue GPS and earn verified service hours.',
    },
];

const demoRoles = [
    {
        role: 'Event Organizer',
        badge: 'Full Scope',
        email: 'organizer@volunsync.test',
    },
    {
        role: 'Division Coordinator',
        badge: 'Division Scope',
        email: 'coordinator@volunsync.test',
    },
    {
        role: 'Community Volunteer',
        badge: 'Member Portal',
        email: 'volunteer@volunsync.test',
    },
];

const smoothEase = [0.22, 1, 0.36, 1] as const;

const springSnappy = {
    type: 'spring' as const,
    stiffness: 340,
    damping: 26,
};

function ScrollProgressBar() {
    'use no memo';
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 140,
        damping: 28,
        restDelta: 0.001,
    });

    return (
        <motion.div
            style={{ scaleX }}
            className="fixed top-0 right-0 left-0 z-50 h-[3px] origin-left bg-gradient-to-r from-[#0E838F] via-[#1C6EC7] to-[#2F5CE6]"
        />
    );
}

function AnimatedCounter({
    target,
    suffix = '',
    padZero = false,
}: {
    target: number;
    suffix?: string;
    padZero?: boolean;
}) {
    const ref = useRef<HTMLSpanElement | null>(null);
    const [display, setDisplay] = useState(0);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof IntersectionObserver === 'undefined') {
            setDisplay(target);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    const duration = 950;
                    const start = performance.now();

                    const tick = (now: number) => {
                        const progress = Math.min(1, (now - start) / duration);
                        const eased = 1 - Math.pow(1 - progress, 4);
                        setDisplay(target * eased);
                        if (progress < 1) {
                            requestAnimationFrame(tick);
                        } else {
                            setDisplay(target);
                        }
                    };

                    requestAnimationFrame(tick);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [target]);

    const isDecimal = !Number.isInteger(target);
    const formatted = isDecimal
        ? display.toFixed(1)
        : padZero
          ? String(Math.round(display)).padStart(2, '0')
          : String(Math.round(display));

    return (
        <span ref={ref}>
            {formatted}
            {suffix}
        </span>
    );
}

function CurvedRibbon({ reverse = false }: { reverse?: boolean }) {
    'use no memo';
    const uid = useId().replace(/:/g, '');
    const pathId = `vs-ribbon-path-${uid}`;
    const gradId = `vs-ribbon-grad-${uid}`;
    const shadowId = `vs-ribbon-shadow-${uid}`;

    const textPathRef = useRef<SVGTextPathElement | null>(null);
    const measureRef = useRef<SVGTextElement | null>(null);
    const chunkWidthRef = useRef<number>(1820);
    const offsetRef = useRef<number>(0);

    const { scrollY } = useScroll();
    const scrollVelocity = useVelocity(scrollY);
    const smoothVelocity = useSpring(scrollVelocity, {
        damping: 55,
        stiffness: 240,
    });

    const singleChunk = `${ribbonItems.join('   •   ')}   •   `;
    const repeatedText = Array.from({ length: 6 }, () => singleChunk).join('');

    // Asymmetric gentle circular arc (R = 3200, peak around 67% across the viewport)
    // Left edge y ≈ 222, peak at x=960 y = 75, right edge y ≈ 111
    const curvePath = 'M -1200 914 A 3200 3200 0 0 1 3120 914';

    useEffect(() => {
        const updateLength = () => {
            if (measureRef.current) {
                const len = measureRef.current.getComputedTextLength();
                if (len > 100) {
                    chunkWidthRef.current = len;
                }
            }
        };
        updateLength();
        document.fonts?.ready.then(updateLength);
    }, []);

    useAnimationFrame((_, delta) => {
        const tp = textPathRef.current;
        if (!tp) return;

        const dt = Math.min(delta, 50) / 1000;
        const baseSpeed = 30; // calm, slow px/sec
        const velocityBoost = Math.min(
            Math.abs(smoothVelocity.get()) * 0.04,
            65,
        );
        const dir = reverse ? 1 : -1;
        const chunk = chunkWidthRef.current;

        let next = offsetRef.current + dir * (baseSpeed + velocityBoost) * dt;
        while (next <= -chunk) next += chunk;
        while (next > 0) next -= chunk;

        offsetRef.current = next;
        tp.setAttribute('startOffset', `${next.toFixed(2)}px`);
    });

    return (
        <div
            aria-hidden="true"
            className="relative z-20 mt-6 mb-0 w-full overflow-hidden py-1 select-none sm:mt-8 sm:mb-0"
        >
            <div className="mx-auto flex w-full justify-center">
                <svg
                    viewBox="0 0 1440 310"
                    className="h-auto w-full min-w-[1020px] shrink-0 overflow-visible"
                >
                    <defs>
                        <path id={pathId} d={curvePath} fill="none" />
                        <linearGradient
                            id={gradId}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                        >
                            <stop offset="0%" stopColor="#0E838F" />
                            <stop offset="50%" stopColor="#1C6EC7" />
                            <stop offset="100%" stopColor="#2F5CE6" />
                        </linearGradient>
                        <filter
                            id={shadowId}
                            x="-10%"
                            y="-35%"
                            width="120%"
                            height="180%"
                        >
                            <feDropShadow
                                dx="0"
                                dy="12"
                                stdDeviation="16"
                                floodColor="#1C6EC7"
                                floodOpacity="0.3"
                            />
                        </filter>
                    </defs>

                    {/* Hidden measurement text for exact seamless loop width */}
                    <text
                        ref={measureRef}
                        opacity={0}
                        fontSize="62"
                        letterSpacing="0.06em"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        {singleChunk}
                    </text>

                    {/* Asymmetric Curved Gradient Ribbon Band — Enlarged */}
                    <path
                        d={curvePath}
                        fill="none"
                        stroke={`url(#${gradId})`}
                        strokeWidth="126"
                        strokeLinecap="butt"
                        filter={`url(#${shadowId})`}
                    />

                    {/* Vertically Centered Flowing Display Typography — Enlarged */}
                    <text
                        fill="#FFFFFF"
                        fontSize="62"
                        letterSpacing="0.06em"
                        dy="22"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        <textPath
                            ref={textPathRef}
                            href={`#${pathId}`}
                            startOffset="0px"
                        >
                            {repeatedText}
                        </textPath>
                    </text>
                </svg>
            </div>
        </div>
    );
}

const manifestoGradientStops: Array<{ at: number; rgb: [number, number, number] }> =
    [
        { at: 0, rgb: [14, 77, 89] }, // #0E4D59 — deep ocean teal
        { at: 0.35, rgb: [23, 115, 130] }, // #177382 — rich primary teal
        { at: 0.7, rgb: [55, 154, 168] }, // #379AA8 — bright calm aqua
        { at: 1, rgb: [123, 192, 201] }, // #7BC0C9 — soft light ice-teal
    ];

function getManifestoWordColor(t: number): string {
    const clamped = Math.max(0, Math.min(1, t));
    for (let i = 0; i < manifestoGradientStops.length - 1; i++) {
        const a = manifestoGradientStops[i];
        const b = manifestoGradientStops[i + 1];
        if (clamped >= a.at && clamped <= b.at) {
            const local = (clamped - a.at) / (b.at - a.at);
            const r = Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * local);
            const g = Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * local);
            const bl = Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * local);
            return `rgb(${r}, ${g}, ${bl})`;
        }
    }
    return 'rgb(123, 192, 201)';
}

function WordRevealItem({
    word,
    progress,
    range,
    color,
}: {
    word: string;
    progress: MotionValue<number>;
    range: [number, number];
    color: string;
}) {
    'use no memo';
    const opacity = useTransform(progress, range, [0.16, 1]);
    const y = useTransform(progress, range, [5, 0]);

    return (
        <motion.span
            style={{ opacity, y, color }}
            className="mr-[0.23em] inline-block will-change-[opacity,transform]"
        >
            {word}
        </motion.span>
    );
}

function ManifestoFloatingPill({
    pill,
    progress,
}: {
    pill: (typeof manifestoPills)[number];
    progress: MotionValue<number>;
}) {
    'use no memo';
    const start = pill.appearAt;
    const opacity = useTransform(progress, [start, start + 0.05], [0, 1]);
    const scale = useTransform(
        progress,
        [start, start + 0.07, start + 0.12],
        [0.45, 1.08, 1],
    );
    const y = useTransform(progress, [start, start + 0.08], [22, 0]);
    const rotate = useTransform(
        progress,
        [start, start + 0.1],
        [pill.rotate * 2.2, pill.rotate],
    );

    return (
        <motion.span
            style={{ opacity, scale, y, rotate }}
            whileHover={{
                scale: 1.08,
                rotate: 0,
                transition: springSnappy,
            }}
            className={`absolute z-20 cursor-default rounded-full px-4 py-1.5 text-[11px] font-bold tracking-tight whitespace-nowrap shadow-[0_14px_30px_-10px_rgba(13,18,25,0.38)] select-none will-change-transform sm:px-6 sm:py-2.5 sm:text-sm md:text-base ${pill.bg} ${pill.position}`}
        >
            {pill.label}
        </motion.span>
    );
}

function ManifestoSection() {
    'use no memo';
    const containerRef = useRef<HTMLElement | null>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 72,
        damping: 24,
        mass: 0.65,
        restDelta: 0.001,
    });

    const words = manifestoText.split(' ');

    return (
        <section
            ref={containerRef}
            id="about"
            className="relative -mt-6 min-h-[215vh] sm:-mt-10 sm:min-h-[245vh]"
        >
            <div className="sticky top-0 flex min-h-screen flex-col items-center justify-center px-5 pt-8 pb-16 text-center sm:px-8 sm:pt-10">
                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.55, ease: smoothEase }}
                    className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#5B6D7E] uppercase"
                >
                    Just about VolunSync
                </motion.p>

                <div className="relative mx-auto mt-7 w-full max-w-6xl py-4 sm:mt-9 sm:py-6">
                    <h2 className="text-[clamp(1.95rem,5.2vw,4.35rem)] leading-[1.09] font-extrabold tracking-[-0.035em]">
                        {words.map((word, idx) => {
                            const start = (idx / words.length) * 0.88;
                            const end = Math.min(
                                1,
                                start + (1 / words.length) * 2.2,
                            );
                            const color = getManifestoWordColor(
                                words.length > 1
                                    ? idx / (words.length - 1)
                                    : 0,
                            );
                            return (
                                <WordRevealItem
                                    key={`${word}-${idx}`}
                                    word={word}
                                    progress={smoothProgress}
                                    range={[start, end]}
                                    color={color}
                                />
                            );
                        })}
                    </h2>

                    {/* Floating Mini Info Pills Popping Right Over the Text */}
                    {manifestoPills.map((pill) => (
                        <ManifestoFloatingPill
                            key={pill.label}
                            pill={pill}
                            progress={smoothProgress}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function StatsEditorialSection({
    stats,
}: {
    stats: {
        volunteers: number;
        events: number;
        shifts: number;
        verified_hours: number;
    };
}) {
    'use no memo';
    const sectionRef = useRef<HTMLElement | null>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

    return (
        <section
            ref={sectionRef}
            className="relative overflow-hidden bg-[#DCE8F0] py-20 sm:py-28 lg:py-32"
        >
            <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
                <div className="grid lg:grid-cols-12">
                    {/* Right-Shifted Editorial Column (~75% width, matching reference) */}
                    <div className="lg:col-span-9 lg:col-start-4">
                        {/* Top 4-Line Staggered Headline with Calm Sentence-Case Tone */}
                        <div className="text-[#104B56]">
                            {/* Line 1: Left small label + indented calm heading */}
                            <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 sm:flex-nowrap sm:gap-x-12">
                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={
                                        isInView
                                            ? { opacity: 1, y: 0 }
                                            : { opacity: 0, y: 10 }
                                    }
                                    transition={{
                                        duration: 0.5,
                                        ease: smoothEase,
                                    }}
                                    className="shrink-0 font-mono text-xs font-medium text-[#476B76]"
                                >
                                    Since 2025
                                </motion.span>
                                <span className="block overflow-hidden">
                                    <motion.span
                                        initial={{ y: '105%' }}
                                        animate={
                                            isInView
                                                ? { y: '0%' }
                                                : { y: '105%' }
                                        }
                                        transition={{
                                            duration: 0.72,
                                            ease: smoothEase,
                                        }}
                                        className="block text-[clamp(2rem,4.6vw,3.85rem)] leading-[1.06] font-semibold tracking-[-0.03em]"
                                    >
                                        We&apos;ve been helping
                                    </motion.span>
                                </span>
                            </div>

                            {/* Line 2 */}
                            <span className="mt-0.5 block overflow-hidden">
                                <motion.span
                                    initial={{ y: '105%' }}
                                    animate={
                                        isInView ? { y: '0%' } : { y: '105%' }
                                    }
                                    transition={{
                                        duration: 0.72,
                                        delay: 0.08,
                                        ease: smoothEase,
                                    }}
                                    className="block text-[clamp(2rem,4.6vw,3.85rem)] leading-[1.06] font-semibold tracking-[-0.03em]"
                                >
                                    communities run
                                </motion.span>
                            </span>

                            {/* Line 3 */}
                            <span className="mt-0.5 block overflow-hidden">
                                <motion.span
                                    initial={{ y: '105%' }}
                                    animate={
                                        isInView ? { y: '0%' } : { y: '105%' }
                                    }
                                    transition={{
                                        duration: 0.72,
                                        delay: 0.16,
                                        ease: smoothEase,
                                    }}
                                    className="block text-[clamp(2rem,4.6vw,3.85rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-[#1A7D8C]"
                                >
                                    effortless volunteer
                                </motion.span>
                            </span>

                            {/* Line 4 + Right-Aligned Micro-Caption */}
                            <div className="mt-0.5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <span className="block overflow-hidden">
                                    <motion.span
                                        initial={{ y: '105%' }}
                                        animate={
                                            isInView
                                                ? { y: '0%' }
                                                : { y: '105%' }
                                        }
                                        transition={{
                                            duration: 0.72,
                                            delay: 0.24,
                                            ease: smoothEase,
                                        }}
                                        className="block text-[clamp(2rem,4.6vw,3.85rem)] leading-[1.06] font-semibold tracking-[-0.03em]"
                                    >
                                        operations.
                                    </motion.span>
                                </span>

                                <motion.p
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={
                                        isInView
                                            ? { opacity: 1, y: 0 }
                                            : { opacity: 0, y: 12 }
                                    }
                                    transition={{
                                        duration: 0.6,
                                        delay: 0.3,
                                        ease: smoothEase,
                                    }}
                                    className="max-w-[240px] text-left text-xs leading-relaxed text-[#476B76] sm:pb-1 sm:text-right"
                                >
                                    through structured recruitment, division
                                    workspaces, zero-overlap shifts, and QR +
                                    GPS check-ins.
                                </motion.p>
                            </div>
                        </div>

                        {/* Middle Two-Column Micro-Copy Row */}
                        <div className="mt-14 grid gap-8 sm:mt-20 sm:grid-cols-2 lg:pl-16">
                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={
                                    isInView
                                        ? { opacity: 1, y: 0 }
                                        : { opacity: 0, y: 16 }
                                }
                                transition={{
                                    duration: 0.6,
                                    delay: 0.25,
                                    ease: smoothEase,
                                }}
                                className="max-w-[235px] text-xs leading-relaxed text-[#426671]"
                            >
                                Community events move fast and volunteer teams
                                are always evolving — we keep every division
                                calm and aligned.
                            </motion.p>

                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={
                                    isInView
                                        ? { opacity: 1, y: 0 }
                                        : { opacity: 0, y: 16 }
                                }
                                transition={{
                                    duration: 0.6,
                                    delay: 0.32,
                                    ease: smoothEase,
                                }}
                                className="max-w-[240px] text-xs leading-relaxed text-[#426671] sm:ml-auto sm:text-right"
                            >
                                Built with conflict-free shift guards and
                                Haversine GPS so organizers stay effortlessly in
                                control.
                            </motion.p>
                        </div>

                        {/* Bottom 2x2 Giant Clipped-Baseline Numbers Grid */}
                        <div className="mt-14 grid grid-cols-1 gap-x-12 gap-y-12 sm:mt-20 sm:grid-cols-2 lg:pl-16">
                            {[
                                {
                                    value: stats.volunteers,
                                    suffix: '+',
                                    padZero: false,
                                    caption:
                                        'confirmed volunteers active across divisions',
                                },
                                {
                                    value: stats.events,
                                    suffix: '',
                                    padZero: true,
                                    caption:
                                        'open and ongoing community events',
                                },
                                {
                                    value: stats.shifts,
                                    suffix: '+',
                                    padZero: false,
                                    caption:
                                        'conflict-free scheduled division shifts',
                                },
                                {
                                    value: stats.verified_hours,
                                    suffix: 'H',
                                    padZero: false,
                                    caption:
                                        'verified service hours logged via QR + GPS',
                                },
                            ].map((metric, idx) => (
                                <div key={metric.caption} className="group">
                                    {/* Clipped Baseline Mask for Signature Sliced-Bottom Numbers */}
                                    <div className="overflow-hidden border-b border-[#1A7D8C]/20 pb-0">
                                        <motion.p
                                            initial={{ y: '100%' }}
                                            animate={
                                                isInView
                                                    ? { y: '13%' }
                                                    : { y: '100%' }
                                            }
                                            transition={{
                                                duration: 0.85,
                                                delay: 0.2 + idx * 0.1,
                                                ease: smoothEase,
                                            }}
                                            className="font-sans text-[clamp(4.2rem,8.8vw,7rem)] leading-[0.84] font-bold tracking-[-0.045em] text-white transition-colors duration-300 select-none group-hover:text-[#135D6A]"
                                        >
                                            <AnimatedCounter
                                                target={metric.value}
                                                suffix={metric.suffix}
                                                padZero={metric.padZero}
                                            />
                                        </motion.p>
                                    </div>
                                    <p className="mt-2.5 text-xs font-medium text-[#3C616C]">
                                        {metric.caption}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function HeroVisualStage({
    volunteers,
    events,
    ready = true,
}: {
    volunteers: number;
    events: number;
    ready?: boolean;
}) {
    'use no memo';
    const stageRef = useRef<HTMLDivElement | null>(null);
    const { scrollYProgress } = useScroll({
        target: stageRef,
        offset: ['start end', 'end start'],
    });
    const smoothScroll = useSpring(scrollYProgress, {
        stiffness: 110,
        damping: 26,
    });
    const imageY = useTransform(smoothScroll, [0, 1], [28, -28]);
    const imageScale = useTransform(smoothScroll, [0, 0.5, 1], [0.96, 1.02, 1]);
    const chipLeftY = useTransform(smoothScroll, [0, 1], [22, -26]);
    const chipRightY = useTransform(smoothScroll, [0, 1], [-14, 24]);

    return (
        <div
            ref={stageRef}
            className="relative mx-auto mt-10 max-w-5xl px-4 sm:mt-14 sm:px-6"
        >
            <motion.div
                initial={{ opacity: 0, y: 44, scale: 0.96 }}
                animate={
                    ready
                        ? { opacity: 1, y: 0, scale: 1 }
                        : { opacity: 0, y: 44, scale: 0.96 }
                }
                transition={{ duration: 0.9, delay: 0.54, ease: smoothEase }}
                className="relative overflow-hidden rounded-[2rem] border border-[#DCE7EF] bg-[#EDF4F8] shadow-[0_28px_70px_-30px_rgba(14,131,143,0.22)] sm:rounded-[2.75rem]"
            >
                <motion.div
                    style={{ y: imageY, scale: imageScale }}
                    className="will-change-transform"
                >
                    <img
                        src="/images/landing-hero-3d.jpg"
                        alt="VolunSync 3D community event coordination diorama"
                        className="aspect-[16/9] w-full object-cover"
                    />
                </motion.div>

                {/* Subtle Floating Telemetry Chips */}
                <motion.div
                    style={{ y: chipLeftY }}
                    className="pointer-events-none absolute bottom-4 left-4 hidden items-center gap-2.5 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-semibold text-[#104B56] shadow-[0_12px_30px_-10px_rgba(16,75,86,0.16)] backdrop-blur-md sm:flex"
                >
                    <span className="flex size-2 rounded-full bg-[#0E838F] ring-4 ring-[#0E838F]/20" />
                    <span>{volunteers}+ verified volunteers</span>
                </motion.div>

                <motion.div
                    style={{ y: chipRightY }}
                    className="pointer-events-none absolute top-4 right-4 hidden items-center gap-2 rounded-full border border-white/60 bg-[#104B56]/90 px-4 py-2 font-mono text-[11px] font-medium text-white shadow-[0_12px_30px_-10px_rgba(16,75,86,0.28)] backdrop-blur-md sm:flex"
                >
                    <Sparkles className="size-3.5 text-[#9AD9E2]" />
                    <span>{events} active events · 0% overlap</span>
                </motion.div>
            </motion.div>
        </div>
    );
}

function PillarCard({
    pillar,
    index,
}: {
    pillar: (typeof pillars)[number];
    index: number;
}) {
    'use no memo';
    return (
        <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
                duration: 0.7,
                delay: (index % 2) * 0.12,
                ease: smoothEase,
            }}
        >
            <Link
                href={pillar.href}
                className="group block rounded-[2rem] border border-[#DCE7EF] bg-white p-4 shadow-[0_12px_36px_-22px_rgba(13,18,25,0.14)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[#1A7D8C]/40 hover:shadow-[0_28px_54px_-24px_rgba(14,131,143,0.22)] sm:p-5"
            >
                {/* 3D Studio Visual Stage */}
                <div className="relative overflow-hidden rounded-[1.4rem] bg-[#EDF4F8]">
                    <img
                        src={pillar.image}
                        alt={pillar.title}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                    />
                    <span className="absolute top-3.5 left-3.5 rounded-full bg-white/90 px-3 py-1 font-mono text-[11px] font-semibold text-[#1A7D8C] shadow-xs backdrop-blur-sm">
                        {pillar.num}
                    </span>
                </div>

                {/* Editorial Metadata */}
                <div className="px-1.5 pt-5 pb-1.5">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl font-semibold tracking-[-0.02em] text-[#104B56] transition-colors group-hover:text-[#1A7D8C] sm:text-[1.4rem]">
                            {pillar.title}
                        </h3>
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#DCE7EF] bg-[#F4F8FA] text-[#104B56] transition-all duration-300 group-hover:rotate-45 group-hover:border-[#0E838F] group-hover:bg-gradient-to-tr group-hover:from-[#0E838F] group-hover:to-[#2F5CE6] group-hover:text-white">
                            <ArrowUpRight className="size-4" />
                        </span>
                    </div>

                    <p className="mt-2.5 text-sm leading-relaxed text-[#4C6E79]">
                        {pillar.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                        {pillar.tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full border border-[#DCE7EF] bg-[#F6FAFC] px-3 py-1 font-mono text-[11px] font-medium text-[#476B76] transition-colors group-hover:border-[#1A7D8C]/25 group-hover:text-[#1A7D8C]"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export default function Welcome({
    stats = {
        volunteers: 107,
        events: 6,
        divisions: 12,
        shifts: 26,
        verified_hours: 61.4,
    },
    featuredEvents = [],
}: WelcomeProps) {
    'use no memo';
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth?.user;
    const [activeStage, setActiveStage] = useState(3);
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [heroReady, setHeroReady] = useState(false);

    const heroRef = useRef<HTMLElement | null>(null);
    const { scrollYProgress: heroScroll } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start'],
    });
    const smoothHeroScroll = useSpring(heroScroll, {
        stiffness: 120,
        damping: 26,
    });
    const heroBadgeY = useTransform(smoothHeroScroll, [0, 1], [0, -34]);
    const heroSmoothWordX = useTransform(smoothHeroScroll, [0, 1], [0, 26]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const copyEmail = (email: string) => {
        navigator.clipboard?.writeText(email);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 1800);
    };

    return (
        <MotionConfig reducedMotion="user">
            <Head title="VolunSync — Community Event & Volunteer Platform" />
            <SplashScreen
                onRevealStart={() => setHeroReady(true)}
                onComplete={() => setHeroReady(true)}
            />
            <ScrollProgressBar />

            <div className="min-h-screen overflow-x-clip bg-[#F4F8FA] text-[#104B56] selection:bg-[#1A7D8C]/20 selection:text-[#104B56]">
                {/* Minimal Editorial Floating Navbar (two26.studio rhythm) */}
                <motion.header
                    initial={{ opacity: 0, y: -14 }}
                    animate={
                        heroReady
                            ? { opacity: 1, y: 0 }
                            : { opacity: 0, y: -14 }
                    }
                    transition={{ duration: 0.65, delay: 0.14, ease: smoothEase }}
                    className={`fixed top-0 right-0 left-0 z-40 transition-colors duration-300 ${
                        scrolled
                            ? 'border-b border-[#DCE7EF]/90 bg-[#F4F8FA]/85 py-3 shadow-[0_8px_30px_-18px_rgba(16,75,86,0.12)] backdrop-blur-xl'
                            : 'bg-transparent py-5'
                    }`}
                >
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                        {/* Left Pill Links */}
                        <nav className="flex items-center gap-2">
                            <a
                                href="#pillars"
                                className="rounded-full border border-[#DCE7EF] bg-white/85 px-3.5 py-1.5 text-xs font-semibold text-[#104B56] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[#1A7D8C]/40 hover:text-[#1A7D8C]"
                            >
                                Features
                            </a>
                            <Link
                                href="/events"
                                className="rounded-full border border-[#DCE7EF] bg-white/85 px-3.5 py-1.5 text-xs font-semibold text-[#104B56] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[#1A7D8C]/40 hover:text-[#1A7D8C]"
                            >
                                Open events
                            </Link>
                        </nav>

                        {/* Center Wordmark */}
                        <Link
                            href="/"
                            className="text-lg font-extrabold tracking-[-0.04em] text-[#1A7D8C] sm:text-xl"
                        >
                            <span>VolunSync</span>
                        </Link>

                        {/* Right Member Access + Primary Pill CTA */}
                        <div className="flex items-center gap-3">
                            {!user && (
                                <Link
                                    href="/login"
                                    className="hidden flex-col text-right leading-tight sm:flex"
                                >
                                    <span className="text-[11px] font-bold text-[#104B56] transition-colors hover:text-[#1A7D8C]">
                                        Member Access
                                    </span>
                                    <span className="text-[10px] text-[#557782]">
                                        Sign in to console
                                    </span>
                                </Link>
                            )}

                            <motion.div
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                transition={springSnappy}
                            >
                                <Link
                                    href={user ? '/dashboard' : '/register'}
                                    className="group inline-flex items-center gap-2.5 rounded-full bg-[#104B56] py-1.5 pr-1.5 pl-4 text-xs font-semibold text-white shadow-[0_10px_24px_-12px_rgba(16,75,86,0.45)] transition-colors hover:bg-[#145C69]"
                                >
                                    <span>
                                        {user ? 'Open console' : 'Get started'}
                                    </span>
                                    <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#0E838F] to-[#2F5CE6] text-white transition-transform duration-300 group-hover:rotate-45">
                                        <ArrowUpRight className="size-3.5" />
                                    </span>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </motion.header>

                {/* HERO SECTION */}
                <section
                    ref={heroRef}
                    className="relative pt-28 pb-6 sm:pt-36 sm:pb-10"
                >
                    <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
                        {/* Giant Condensed Stacked Headline with 3 Overlaid Mini Info Pills */}
                        <div className="relative mt-2 inline-block w-full select-none">
                            <h1 className="font-display text-[clamp(3.35rem,11.2vw,8.6rem)] leading-[0.88] tracking-[-0.015em] uppercase">
                                <span className="block overflow-hidden">
                                    <motion.span
                                        initial={{ y: '108%' }}
                                        animate={
                                            heroReady
                                                ? { y: '0%' }
                                                : { y: '108%' }
                                        }
                                        transition={{
                                            duration: 0.82,
                                            delay: 0.16,
                                            ease: smoothEase,
                                        }}
                                        className="block text-[#1A7D8C]"
                                    >
                                        EVENTS THAT RUN
                                    </motion.span>
                                </span>

                                <span className="relative block overflow-hidden">
                                    <motion.span
                                        initial={{ y: '108%' }}
                                        animate={
                                            heroReady
                                                ? { y: '0%' }
                                                : { y: '108%' }
                                        }
                                        transition={{
                                            duration: 0.82,
                                            delay: 0.26,
                                            ease: smoothEase,
                                        }}
                                        className="block text-[#1A7D8C]"
                                    >
                                        SUSPICIOUSLY
                                    </motion.span>
                                </span>

                                <span className="block overflow-hidden">
                                    <motion.span
                                        style={{ x: heroSmoothWordX }}
                                        initial={{ y: '108%' }}
                                        animate={
                                            heroReady
                                                ? { y: '0%' }
                                                : { y: '108%' }
                                        }
                                        transition={{
                                            duration: 0.82,
                                            delay: 0.36,
                                            ease: smoothEase,
                                        }}
                                        className="block text-[#7BC0C9]"
                                    >
                                        SMOOTH
                                    </motion.span>
                                </span>
                            </h1>

                            {/* Mini Info Pill 1 — Top-Right over DARK "EVENTS THAT RUN" → Light Teal Pill */}
                            <motion.span
                                style={{ y: heroBadgeY }}
                                initial={{ opacity: 0, scale: 0.72, rotate: -9 }}
                                animate={
                                    heroReady
                                        ? {
                                              opacity: 1,
                                              scale: 1,
                                              rotate: -3.2,
                                          }
                                        : {
                                              opacity: 0,
                                              scale: 0.72,
                                              rotate: -9,
                                          }
                                }
                                transition={{
                                    delay: 0.52,
                                    type: 'spring',
                                    stiffness: 280,
                                    damping: 20,
                                }}
                                whileHover={{ rotate: 0, scale: 1.08 }}
                                className="absolute top-[4%] right-[6%] z-10 cursor-default rounded-full border border-[#8FD3DC] bg-[#CDEEF2] px-3.5 py-1 text-[10px] font-semibold tracking-wide text-[#0E4D59] shadow-[0_12px_26px_-10px_rgba(14,77,89,0.2)] sm:top-[6%] sm:right-[17%] sm:px-5 sm:py-1.5 sm:text-xs"
                            >
                                Community event platform
                            </motion.span>

                            {/* Mini Info Pill 2 — Mid-Left over DARK "EVENTS THAT RUN" & "SUSPICIOUSLY" → Light Teal Pill */}
                            <motion.span
                                style={{ y: heroBadgeY }}
                                initial={{ opacity: 0, scale: 0.72, rotate: 8 }}
                                animate={
                                    heroReady
                                        ? {
                                              opacity: 1,
                                              scale: 1,
                                              rotate: -4.5,
                                          }
                                        : {
                                              opacity: 0,
                                              scale: 0.72,
                                              rotate: 8,
                                          }
                                }
                                transition={{
                                    delay: 0.62,
                                    type: 'spring',
                                    stiffness: 280,
                                    damping: 20,
                                }}
                                whileHover={{ rotate: 0, scale: 1.08 }}
                                className="absolute top-[30%] left-[6%] z-10 cursor-default rounded-full border border-[#8FD3DC] bg-[#CDEEF2] px-3 py-1 font-mono text-[10px] font-bold tracking-wider text-[#0E4D59] uppercase shadow-[0_12px_26px_-10px_rgba(14,77,89,0.2)] sm:top-[31%] sm:left-[18%] sm:px-4 sm:py-1.5 sm:text-[11px]"
                            >
                                QR + GPS · RBAC
                            </motion.span>

                            {/* Mini Info Pill 3 — Lower-Right over LIGHT "SMOOTH" → Dark Teal Pill */}
                            <motion.span
                                style={{ y: heroBadgeY }}
                                initial={{ opacity: 0, scale: 0.72, rotate: -8 }}
                                animate={
                                    heroReady
                                        ? {
                                              opacity: 1,
                                              scale: 1,
                                              rotate: 3.8,
                                          }
                                        : {
                                              opacity: 0,
                                              scale: 0.72,
                                              rotate: -8,
                                          }
                                }
                                transition={{
                                    delay: 0.72,
                                    type: 'spring',
                                    stiffness: 280,
                                    damping: 20,
                                }}
                                whileHover={{ rotate: 0, scale: 1.08 }}
                                className="absolute right-[8%] bottom-[13%] z-10 cursor-default rounded-full bg-[#0F4D59] px-3.5 py-1 text-[10px] font-semibold tracking-wide text-white shadow-[0_12px_26px_-10px_rgba(15,77,89,0.45)] sm:right-[21%] sm:bottom-[15%] sm:px-4.5 sm:py-1.5 sm:text-xs"
                            >
                                Zero double-booking
                            </motion.span>
                        </div>

                        {/* Flanking Micro-Captions + Centered Subtitle */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={
                                heroReady
                                    ? { opacity: 1, y: 0 }
                                    : { opacity: 0, y: 20 }
                            }
                            transition={{
                                duration: 0.72,
                                delay: 0.44,
                                ease: smoothEase,
                            }}
                            className="mt-7 grid items-center gap-4 text-xs text-[#4C6E79] md:grid-cols-12"
                        >
                            <p className="hidden text-left font-medium text-[#104B56] md:col-span-3 md:block">
                                We orchestrate volunteering
                            </p>
                            <p className="mx-auto max-w-md text-sm leading-relaxed text-[#4C6E79] md:col-span-6">
                                Replace spreadsheets and group chats with one
                                calm dashboard for every community event.
                            </p>
                            <p className="hidden text-right font-medium text-[#104B56] md:col-span-3 md:block">
                                No double-booking
                            </p>
                        </motion.div>

                        {/* Dual Hero CTAs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={
                                heroReady
                                    ? { opacity: 1, y: 0 }
                                    : { opacity: 0, y: 20 }
                            }
                            transition={{
                                duration: 0.72,
                                delay: 0.52,
                                ease: smoothEase,
                            }}
                            className="mt-7 flex flex-wrap items-center justify-center gap-3"
                        >
                            <motion.div
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                transition={springSnappy}
                            >
                                <Link
                                    href="/events"
                                    className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#0E838F] via-[#1C6EC7] to-[#2F5CE6] py-2 pr-2 pl-6 text-sm font-semibold text-white shadow-[0_14px_30px_-12px_rgba(30,110,199,0.5)]"
                                >
                                    <span>Explore open events</span>
                                    <span className="flex size-8 items-center justify-center rounded-full bg-white text-[#104B56] transition-transform duration-300 group-hover:rotate-45">
                                        <ArrowUpRight className="size-4" />
                                    </span>
                                </Link>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                transition={springSnappy}
                            >
                                <Link
                                    href={user ? '/dashboard' : '/login'}
                                    className="inline-flex items-center gap-2 rounded-full border border-[#CBD9E4] bg-white px-6 py-3 text-sm font-semibold text-[#104B56] shadow-xs transition-colors hover:border-[#1A7D8C]/40 hover:text-[#1A7D8C]"
                                >
                                    {user
                                        ? 'Open my dashboard'
                                        : 'Sign in to console'}
                                </Link>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Hero 3D Studio Visual Stage */}
                    <HeroVisualStage
                        volunteers={stats.volunteers}
                        events={stats.events}
                        ready={heroReady}
                    />
                </section>

                {/* ASYMMETRIC CURVED MARQUEE RIBBON — BEFORE MANIFESTO */}
                <CurvedRibbon />

                {/* MANIFESTO — SCROLL-SCRUBBED WORD REVEAL + POP-UP PILLS */}
                <ManifestoSection />

                {/* SWISS-EDITORIAL ASYMMETRIC STATS SECTION */}
                <StatsEditorialSection stats={stats} />

                {/* FOUR PILLARS — 2x2 EDITORIAL 3D SHOWCASE GRID */}
                <section
                    id="pillars"
                    className="mx-auto max-w-6xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20 lg:px-8"
                >
                    <div className="mb-12 text-center sm:mb-16">
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.6 }}
                            transition={{ duration: 0.5, ease: smoothEase }}
                            className="font-mono text-[11px] font-medium tracking-[0.18em] text-[#4C727D] uppercase"
                        >
                            What&apos;s inside
                        </motion.p>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.6 }}
                            transition={{
                                duration: 0.7,
                                ease: smoothEase,
                            }}
                            className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#104B56] sm:text-5xl"
                        >
                            Four pillars, one calm flow.
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 14 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.6 }}
                            transition={{
                                duration: 0.6,
                                delay: 0.08,
                                ease: smoothEase,
                            }}
                            className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#4C6E79] sm:text-base"
                        >
                            Every module connects cleanly so organizers and
                            volunteers stay on the same page without friction.
                        </motion.p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
                        {pillars.map((pillar, idx) => (
                            <PillarCard
                                key={pillar.num}
                                pillar={pillar}
                                index={idx}
                            />
                        ))}
                    </div>
                </section>

                {/* LIVE ACTIVE COMMUNITY EVENTS (FROM DB) */}
                {/* {featuredEvents.length > 0 && (
                    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-[#1A7D8C] uppercase">
                                    Live right now
                                </p>
                                <h2 className="mt-1 font-display text-4xl tracking-[-0.01em] text-[#0D1219] uppercase sm:text-5xl">
                                    OPEN COMMUNITY EVENTS
                                </h2>
                            </div>
                            <Link
                                href="/events"
                                className="group inline-flex items-center gap-2 rounded-full border border-[#CBD9E4] bg-white px-5 py-2.5 text-xs font-semibold text-[#0D1219] transition-all hover:border-[#1A7D8C]/50 hover:text-[#1A7D8C]"
                            >
                                <span>Explore all events</span>
                                <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:rotate-45" />
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {featuredEvents.map((ev, idx) => (
                                <motion.div
                                    key={ev.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.3 }}
                                    transition={{
                                        duration: 0.55,
                                        delay: idx * 0.07,
                                        ease: smoothEase,
                                    }}
                                >
                                    <Link
                                        href="/events"
                                        className="group flex flex-col justify-between gap-4 rounded-2xl border border-[#DCE7EF] bg-white px-5 py-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1A7D8C]/40 hover:shadow-[0_18px_36px_-22px_rgba(14,131,143,0.28)] sm:flex-row sm:items-center sm:px-6"
                                    >
                                        <div className="flex items-start gap-4 sm:items-center">
                                            <span className="font-display text-2xl text-[#7BC0C9] transition-colors group-hover:text-[#1A7D8C]">
                                                0{idx + 1}
                                            </span>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2.5">
                                                    <h3 className="text-base font-bold text-[#0D1219] transition-colors group-hover:text-[#1A7D8C] sm:text-lg">
                                                        {ev.title}
                                                    </h3>
                                                    <span className="rounded-full bg-[#E6F5F7] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#0E838F] uppercase">
                                                        {ev.status}
                                                    </span>
                                                </div>
                                                <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-[#526577]">
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="size-3.5 text-[#1A7D8C]" />
                                                        {ev.venue_name}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <CalendarDays className="size-3.5 text-[#2F5CE6]" />
                                                        {new Date(
                                                            ev.start_date,
                                                        ).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            },
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 pl-9 sm:justify-end sm:pl-0">
                                            <span className="font-mono text-xs text-[#5B6D7E]">
                                                {ev.divisions_count} divisions ·{' '}
                                                {ev.shifts_count} shifts
                                            </span>
                                            <span className="flex size-8 items-center justify-center rounded-full bg-[#F4F8FA] text-[#0D1219] transition-all duration-300 group-hover:rotate-45 group-hover:bg-[#0D1219] group-hover:text-white">
                                                <ArrowUpRight className="size-4" />
                                            </span>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )} */}

                {/* THE VOLUNTEER JOURNEY — 4 INTERACTIVE STAGE CARDS */}
                <section
                    id="journey"
                    className="mx-auto max-w-6xl px-4 pt-16 pb-16 sm:px-6 sm:pt-24 sm:pb-24 lg:px-8"
                >
                    <div className="mb-12 text-center sm:mb-14">
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.6 }}
                            transition={{ duration: 0.5, ease: smoothEase }}
                            className="font-mono text-[11px] font-medium tracking-[0.18em] text-[#4C727D] uppercase"
                        >
                            Four stages, one platform
                        </motion.p>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.6 }}
                            transition={{ duration: 0.7, ease: smoothEase }}
                            className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#104B56] sm:text-5xl"
                        >
                            The volunteer journey
                        </motion.h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {journeyStages.map((stage, idx) => {
                            const isActive = activeStage === idx;
                            return (
                                <motion.button
                                    key={stage.num}
                                    type="button"
                                    onMouseEnter={() => setActiveStage(idx)}
                                    onClick={() => setActiveStage(idx)}
                                    initial={{ opacity: 0, y: 28 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.25 }}
                                    transition={{
                                        duration: 0.6,
                                        delay: idx * 0.08,
                                        ease: smoothEase,
                                    }}
                                    className="relative flex min-h-[225px] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-[#DCE7EF] bg-white p-6 text-left shadow-[0_10px_28px_-20px_rgba(16,75,86,0.14)] transition-colors"
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="journeyActiveCard"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 310,
                                                damping: 30,
                                            }}
                                            className="absolute inset-0 bg-gradient-to-br from-[#0E838F] via-[#1C6EC7] to-[#2F5CE6]"
                                        />
                                    )}

                                    <span
                                        className={`relative z-10 text-4xl leading-none font-semibold tracking-[-0.03em] transition-colors duration-300 ${
                                            isActive
                                                ? 'text-white'
                                                : 'text-[#1A7D8C]'
                                        }`}
                                    >
                                        {stage.num}
                                    </span>

                                    <div className="relative z-10 mt-8">
                                        <h3
                                            className={`text-lg font-semibold tracking-tight transition-colors duration-300 ${
                                                isActive
                                                    ? 'text-white'
                                                    : 'text-[#104B56]'
                                            }`}
                                        >
                                            {stage.title}
                                        </h3>
                                        <p
                                            className={`mt-2 text-xs leading-relaxed transition-colors duration-300 sm:text-[13px] ${
                                                isActive
                                                    ? 'text-white/85'
                                                    : 'text-[#4C6E79]'
                                            }`}
                                        >
                                            {stage.description}
                                        </p>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Compact Role Demo Switcher Strip */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.65, ease: smoothEase }}
                        className="mt-10 rounded-3xl border border-[#DCE7EF] bg-white/85 p-4 backdrop-blur-sm sm:p-5"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-3">
                            <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-[#1A7D8C] uppercase">
                                Instant demo access · Click email to copy
                            </span>
                            <span className="font-mono text-[11px] text-[#4C6E79]">
                                Password:{' '}
                                <strong className="text-[#104B56]">
                                    password
                                </strong>
                            </span>
                        </div>
                        <div className="grid gap-2.5 sm:grid-cols-3">
                            {demoRoles.map((item) => (
                                <button
                                    key={item.email}
                                    type="button"
                                    onClick={() => copyEmail(item.email)}
                                    className="group flex items-center justify-between gap-3 rounded-2xl border border-[#DCE7EF] bg-[#F6FAFC] px-4 py-3 text-left transition-all hover:border-[#1A7D8C]/40 hover:bg-white"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-[#104B56]">
                                            {item.role}
                                        </p>
                                        <p className="truncate font-mono text-[11px] text-[#4C6E79]">
                                            {item.email}
                                        </p>
                                    </div>
                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[#4C6E79] ring-1 ring-[#DCE7EF] transition-colors group-hover:text-[#1A7D8C]">
                                        {copiedEmail === item.email ? (
                                            <Check className="size-3.5 text-[#0E838F]" />
                                        ) : (
                                            <Copy className="size-3.5" />
                                        )}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </section>

                {/* CALM DEEP-TEAL ROUNDED-TOP EDITORIAL FOOTER */}
                <motion.footer
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.8, ease: smoothEase }}
                    className="relative overflow-hidden rounded-t-[2.5rem] bg-gradient-to-br from-[#0F4D59] via-[#135D6B] to-[#176E7F] text-white sm:rounded-t-[3.5rem]"
                >
                    {/* Subtle Ambient Brand Glow */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-28 right-10 size-96 rounded-full bg-gradient-to-br from-[#7BC0C9]/25 via-[#2F5CE6]/20 to-transparent blur-3xl"
                    />

                    <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-10 sm:px-8 sm:pt-24 sm:pb-12">
                        <div className="grid items-end gap-12 lg:grid-cols-12">
                            {/* Left Calm Statement */}
                            <div className="lg:col-span-7">
                                <h2 className="text-[clamp(2.6rem,6vw,4.6rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
                                    <span className="block text-white">
                                        Want to run a
                                    </span>
                                    <span className="block text-[#9AD9E2]">
                                        calmer event?
                                    </span>
                                </h2>
                                <p className="mt-5 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
                                    Bring recruitment, division workspaces,
                                    conflict-free shifts, and verified check-ins
                                    into one peaceful rhythm.
                                </p>
                            </div>

                            {/* Right Contact & Pill CTA */}
                            <div className="space-y-6 lg:col-span-5 lg:pb-2">
                                <p className="text-lg font-medium text-white/90">
                                    or just say hello!
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <p className="font-mono text-[10px] tracking-[0.18em] text-white/55 uppercase">
                                            Organizers &amp; Partnerships
                                        </p>
                                        <a
                                            href="mailto:hello@volunsync.app"
                                            className="mt-1 inline-block text-base font-semibold text-white transition-colors hover:text-[#9AD9E2]"
                                        >
                                            hello@volunsync.app
                                        </a>
                                    </div>

                                    <div>
                                        <p className="font-mono text-[10px] tracking-[0.18em] text-white/55 uppercase">
                                            Volunteer Support
                                        </p>
                                        <a
                                            href="mailto:support@volunsync.app"
                                            className="mt-1 inline-block text-base font-semibold text-white transition-colors hover:text-[#9AD9E2]"
                                        >
                                            support@volunsync.app
                                        </a>
                                    </div>
                                </div>

                                <motion.div
                                    whileHover={{ scale: 1.04, y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={springSnappy}
                                    className="inline-block pt-2"
                                >
                                    <Link
                                        href={user ? '/dashboard' : '/register'}
                                        className="group inline-flex items-center gap-3 rounded-full bg-white py-2 pr-2 pl-6 text-sm font-semibold text-[#104B56] shadow-[0_14px_34px_-12px_rgba(10,45,52,0.35)]"
                                    >
                                        <span>
                                            {user
                                                ? 'Open my console'
                                                : 'Create volunteer account'}
                                        </span>
                                        <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#0E838F] to-[#2F5CE6] text-white transition-transform duration-300 group-hover:rotate-45">
                                            <ArrowUpRight className="size-4" />
                                        </span>
                                    </Link>
                                </motion.div>
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-white/15 pt-8 text-xs text-white/65 sm:flex-row sm:items-center">
                            <span className="text-sm font-bold tracking-tight text-white">
                                VolunSync
                            </span>

                            <div className="flex flex-wrap items-center gap-6 font-mono text-[11px]">
                                <Link
                                    href="/events"
                                    className="transition-colors hover:text-white"
                                >
                                    Events
                                </Link>
                                <Link
                                    href="/login"
                                    className="transition-colors hover:text-white"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/register"
                                    className="transition-colors hover:text-white"
                                >
                                    Register
                                </Link>
                                <span className="text-white/50">
                                    Community Volunteer Management Platform · ©
                                    2026 VolunSync
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.footer>
            </div>
        </MotionConfig>
    );
}

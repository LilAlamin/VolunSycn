import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarDays,
    Check,
    CheckCircle2,
    Copy,
    MapPin,
    Plus,
    QrCode,
    ShieldCheck,
} from 'lucide-react';
import {
    AnimatePresence,
    MotionConfig,
    motion,
    useScroll,
    useSpring,
    useTransform,
} from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PublicNavbar } from '@/components/public-navbar';
import { VolunSyncLogo } from '@/components/volunsync-logo';
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

const tickerItems = [
    'Community Events',
    'Division Screening',
    'Automated Workspaces',
    'Zero-Overlap Shifts',
    'QR + GPS Check-In',
    'Verified Service Hours',
];

const avatarStack = [
    { initials: 'NK', bg: 'bg-[#008c8d] text-white' },
    { initials: 'RR', bg: 'bg-[#0284c7] text-white' },
    { initials: 'AK', bg: 'bg-[#2563eb] text-white' },
    { initials: 'AR', bg: 'bg-[#0f172a] text-white' },
];

const whyItems = [
    {
        num: '-- 01',
        title: 'End spreadsheet chaos',
        description:
            'Replace scattered chat threads and manual forms with one structured system built for real community teams.',
    },
    {
        num: '-- 02',
        title: 'Instant division onboarding',
        description:
            'Approving an applicant immediately unlocks their division workspace, coordinator contact, and peer directory.',
    },
    {
        num: '-- 03',
        title: 'Zero double-booking',
        description:
            'Server-side overlap guards automatically reject conflicting shift assignments across divisions and events.',
    },
    {
        num: '-- 04',
        title: 'Trustworthy service hours',
        description:
            'Dynamic shift QR codes paired with Haversine GPS geofencing verify attendance and log hours automatically.',
    },
];

const focusAreas = [
    {
        num: '-- 01',
        category: '[ Focus area ]',
        title: 'Recruitment & Screening',
        description:
            'Quota-aware division applications paired with a fast TanStack Table screening portal and live status timelines for every applicant.',
        tags: ['# Quota Tracking', '# TanStack Table', '# Live Timeline'],
        href: '/events',
        cta: 'Browse events',
    },
    {
        num: '-- 02',
        category: '[ Focus area ]',
        title: 'Division Workspaces',
        description:
            'Dedicated team hubs that unlock automatically on acceptance — complete with announcements, coordinator info, and peer directory.',
        tags: ['# Auto Access', '# Peer Directory', '# Briefings'],
        href: '/login',
        cta: 'Open workspace',
    },
    {
        num: '-- 03',
        category: '[ Focus area ]',
        title: 'Zero-Overlap Scheduling',
        description:
            'Coordinate multi-division shift rosters with strict interval conflict validation so volunteers are never double-booked.',
        tags: ['# 0% Double-Booking', '# Multi-Division', '# Shift Roster'],
        href: '/login',
        cta: 'View schedule',
    },
    {
        num: '-- 04',
        category: '[ Focus area ]',
        title: 'QR + GPS Attendance',
        description:
            'Mobile-first camera QR scanning with server-side Haversine proximity validation and automated service-hour calculation.',
        tags: ['# Dynamic QR', '# Haversine GPS', '# Verified Hours'],
        href: '/login',
        cta: 'Try check-in',
    },
];

const workflowStages = [
    {
        step: 'Step 01',
        phase: 'Discovery',
        items: [
            {
                title: 'Browse open community events & division quotas',
                meta: 'Public Explorer',
            },
            {
                title: 'Submit division motivation & availability',
                meta: '1-Minute Form',
            },
            {
                title: 'Receive instant live timeline tracking',
                meta: 'Submitted',
            },
        ],
    },
    {
        step: 'Step 02',
        phase: 'Screening',
        items: [
            {
                title: 'Coordinators filter applicants by division & status',
                meta: 'TanStack Table',
            },
            {
                title: 'Inspect motivation & post reviewer feedback',
                meta: 'Under Review',
            },
            {
                title: 'Approve within quota to trigger onboarding',
                meta: 'Accepted ✓',
            },
        ],
    },
    {
        step: 'Step 03',
        phase: 'Coordination',
        items: [
            {
                title: 'Division workspace unlocks automatically',
                meta: 'RBAC Scoped',
            },
            {
                title: 'Read briefings & connect with peers',
                meta: 'Directory',
            },
            {
                title: 'Get assigned shifts with 0% overlap guard',
                meta: 'Conflict-Free',
            },
        ],
    },
    {
        step: 'Step 04',
        phase: 'On-Site Ops',
        items: [
            {
                title: 'Scan coordinator shift QR code on arrival',
                meta: 'html5-qrcode',
            },
            {
                title: 'Server validates GPS within venue radius',
                meta: 'Haversine',
            },
            {
                title: 'Check out to certify verified service hours',
                meta: 'Auto Logged',
            },
        ],
    },
];

const rolePasses = [
    {
        code: 'PASS 01',
        role: 'Event Organizer',
        tagline: 'Full platform orchestration across all events & divisions.',
        email: 'organizer@volunsync.test',
        perks: [
            'Create & manage events + GPS geofences',
            'Assign Division Coordinators & quotas',
            'Screen all applicants & inspect attendance logs',
        ],
    },
    {
        code: 'PASS 02',
        role: 'Division Coordinator',
        tagline: 'Scoped control for your assigned operational division.',
        email: 'coordinator@volunsync.test',
        perks: [
            'Screen division applicants with notes',
            'Post workspace announcements & briefings',
            'Schedule shifts, display QR & verify check-ins',
        ],
    },
    {
        code: 'PASS 03',
        role: 'Community Volunteer',
        tagline: 'Seamless journey from discovery to certified hours.',
        email: 'volunteer@volunsync.test',
        perks: [
            'Apply to divisions & track live status timeline',
            'Access division workspace & shift calendar',
            'Scan shift QR + GPS to log verified hours',
        ],
    },
];

const faqs = [
    {
        q: 'How does VolunSync prevent volunteer shift double-booking?',
        a: 'Every shift assignment passes through a server-side ShiftConflictService that checks whether the volunteer already has an overlapping shift (existing.start < new.end AND existing.end > new.start) across all divisions and events.',
    },
    {
        q: 'How does QR + Geolocation attendance verification work?',
        a: 'Each shift generates a unique QR token. When a volunteer scans the QR on site, VolunSync validates their GPS coordinates server-side using the Haversine distance formula against the event venue radius before logging attendance.',
    },
    {
        q: 'What happens when a volunteer application is accepted?',
        a: 'Moving an application to Accepted immediately grants that volunteer access to their Division Workspace — displaying coordinator contacts, announcements, peer directory, and their division shift schedule.',
    },
    {
        q: 'Can organizers and coordinators manage different scopes?',
        a: 'Yes. Role-Based Access Control isolates permissions so Organizers oversee every event and division, while Division Coordinators only screen applicants, schedule shifts, and verify attendance for their assigned divisions.',
    },
];

const springCard = {
    type: 'spring' as const,
    stiffness: 320,
    damping: 26,
};

function Reveal({
    children,
    delayMs = 0,
    className = '',
}: {
    children: ReactNode;
    delayMs?: number;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof IntersectionObserver === 'undefined') {
            setVisible(true);
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delayMs}ms` }}
            className={`transition-all duration-700 ease-out ${
                visible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-6 opacity-0'
            } ${className}`}
        >
            {children}
        </div>
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
    const [display, setDisplay] = useState(target);
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
                    const duration = 850;
                    const start = performance.now();

                    const tick = (now: number) => {
                        const progress = Math.min(1, (now - start) / duration);
                        const eased = 1 - Math.pow(1 - progress, 3);
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

function ScrollProgressBar() {
    'use no memo';
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 180,
        damping: 30,
        restDelta: 0.001,
    });

    return (
        <motion.div
            style={{ scaleX }}
            className="fixed top-0 right-0 left-0 z-50 h-[3px] origin-left bg-gradient-to-r from-[#008c8d] via-[#0284c7] to-[#2563eb]"
        />
    );
}

function HeroParallaxPhoto({
    stats,
}: {
    stats: {
        events: number;
        divisions: number;
        shifts: number;
    };
}) {
    'use no memo';
    const containerRef = useRef<HTMLDivElement | null>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start'],
    });
    const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '10%']);
    const cardY = useTransform(scrollYProgress, [0, 1], [0, -18]);

    return (
        <div
            ref={containerRef}
            style={{ animationDelay: '180ms' }}
            className="animate-vs-scale lg:col-span-5"
        >
            <div className="group relative mx-auto aspect-[4/4.3] w-full max-w-md overflow-hidden bg-slate-200 shadow-raised">
                <motion.img
                    src="/images/hero-community.jpg"
                    alt="VolunSync community volunteers coordinating at an event"
                    style={{ y: imgY }}
                    className="h-[112%] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Signature Latent/27 Stepped Pixel Cutout (Top-Left) */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-0 left-0"
                >
                    <div className="h-8 w-24 bg-[#fafaf9] dark:bg-[#0c0b0b]" />
                    <div className="h-8 w-16 bg-[#fafaf9] dark:bg-[#0c0b0b]" />
                    <div className="h-8 w-8 bg-[#fafaf9] dark:bg-[#0c0b0b]" />
                </div>

                {/* Top-Right Dark Monospace Edition Badge */}
                <div className="absolute top-3.5 right-3.5 inline-flex items-center gap-2 bg-[#0e0f12]/90 px-3 py-1.5 font-mono text-[10px] font-medium tracking-wider text-white uppercase backdrop-blur-xs">
                    <span className="size-1.5 animate-pulse rounded-full bg-[#34d399]" />
                    ON-SITE OPS · 2026 EDITION
                </div>

                {/* Bottom-Left Floating Crisp White Spec Card with subtle scroll float */}
                <motion.div
                    style={{ y: cardY }}
                    className="absolute right-4 bottom-4 left-4 max-w-[275px] bg-white p-4 text-xs shadow-lg dark:bg-card"
                >
                    <div className="grid grid-cols-[88px_1fr] items-center gap-y-2.5">
                        <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                            Events
                        </span>
                        <span className="font-semibold text-foreground">
                            {stats.events} active initiatives
                        </span>

                        <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                            Divisions
                        </span>
                        <span className="font-semibold text-foreground">
                            {stats.divisions} teams · {stats.shifts} shifts
                        </span>

                        <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                            Guard
                        </span>
                        <span className="font-semibold text-primary">
                            0% shift overlap
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default function Welcome({
    stats = {
        volunteers: 105,
        events: 5,
        divisions: 12,
        shifts: 24,
        verified_hours: 120,
    },
    featuredEvents = [],
}: WelcomeProps) {
    'use no memo';
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth?.user;
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    const copyEmail = (email: string) => {
        navigator.clipboard?.writeText(email);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 1800);
    };

    return (
        <MotionConfig reducedMotion="user">
            <Head title="VolunSync — Community Volunteer Platform" />
            <ScrollProgressBar />

            <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
                {/* Sticky Architectural Navbar — Shared with Explore */}
                <PublicNavbar active="home" />

                {/* Architectural Grid Hero Section — Latent/27 UI + Motion */}
                <section className="bg-vs-grid relative border-b border-border/70">
                    <div className="mx-auto max-w-7xl px-4 pt-8 pb-14 sm:px-6 lg:px-8 lg:pt-10 lg:pb-16">
                        {/* Top Metadata Row */}
                        <div className="animate-vs-reveal mb-10 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                            <span className="flex items-center gap-2">
                                <span className="size-2 animate-pulse rounded-full bg-[#008c8d]" />
                                COMMUNITY VOLUNTEER PLATFORM — EDITION 2026
                            </span>
                            <span>
                                [ {stats.volunteers}+ VOLUNTEERS · ZERO-OVERLAP
                                SHIFTS ]
                            </span>
                        </div>

                        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
                            {/* Left Column: Staggered Block-Highlighted Headline */}
                            <div className="lg:col-span-7">
                                <h1 className="flex flex-col items-start gap-1 text-4xl font-bold tracking-[-0.035em] sm:text-5xl lg:text-[4.15rem] lg:leading-[1.08]">
                                    <span
                                        style={{ animationDelay: '60ms' }}
                                        className="animate-vs-reveal inline-block bg-white px-3 py-0.5 text-[#0e0f12] shadow-[0_1px_0_rgba(15,23,42,0.04)] dark:bg-card dark:text-foreground"
                                    >
                                        The platform for
                                    </span>
                                    <span
                                        style={{ animationDelay: '150ms' }}
                                        className="animate-vs-reveal inline-block bg-white px-3 py-0.5 text-[#0e0f12] shadow-[0_1px_0_rgba(15,23,42,0.04)] dark:bg-card dark:text-foreground"
                                    >
                                        communities serving
                                    </span>
                                    <span
                                        style={{ animationDelay: '240ms' }}
                                        className="animate-vs-reveal inline-block bg-gradient-to-r from-[#008c8d] via-[#0284c7] to-[#2563eb] px-3 py-0.5 text-white"
                                    >
                                        together cleanly.
                                    </span>
                                </h1>

                                <p
                                    style={{ animationDelay: '320ms' }}
                                    className="animate-vs-reveal mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base"
                                >
                                    Structured recruitment, division screening,
                                    automated team workspaces, overlap-free
                                    shift scheduling, and QR + GPS attendance
                                    verification — all in one unified platform
                                    for modern community events.
                                </p>

                                {/* Dual Pill CTAs with Spring Physics */}
                                <div
                                    style={{ animationDelay: '400ms' }}
                                    className="animate-vs-reveal mt-8 flex flex-wrap items-center gap-3"
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={springCard}
                                    >
                                        <Link
                                            href="/events"
                                            className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#008c8d] to-[#2563eb] py-1.5 pr-1.5 pl-5 text-sm font-semibold text-white shadow-sm"
                                        >
                                            <span>Explore open events</span>
                                            <span className="flex size-8 items-center justify-center rounded-full bg-white text-[#0e0f12] transition-transform duration-300 group-hover:rotate-45">
                                                <ArrowUpRight className="size-4" />
                                            </span>
                                        </Link>
                                    </motion.div>

                                    <motion.div
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={springCard}
                                    >
                                        <Link
                                            href={user ? '/dashboard' : '/login'}
                                            className="group inline-flex items-center gap-3 rounded-full border border-border bg-white py-1.5 pr-1.5 pl-5 text-sm font-semibold text-[#0e0f12] shadow-xs transition-colors hover:bg-surface dark:bg-card dark:text-foreground"
                                        >
                                            <span>
                                                {user
                                                    ? 'Open my dashboard'
                                                    : 'Sign in to console'}
                                            </span>
                                            <span className="flex size-8 items-center justify-center rounded-full bg-[#0e0f12] text-white transition-transform duration-300 group-hover:rotate-45 dark:bg-white dark:text-[#0e0f12]">
                                                <ArrowUpRight className="size-4" />
                                            </span>
                                        </Link>
                                    </motion.div>
                                </div>

                                {/* Overlapping Avatar Stack + Social Proof */}
                                <div
                                    style={{ animationDelay: '480ms' }}
                                    className="animate-vs-reveal mt-8 flex items-center gap-3.5"
                                >
                                    <div className="flex -space-x-2.5">
                                        {avatarStack.map((av) => (
                                            <div
                                                key={av.initials}
                                                className={`flex size-9 items-center justify-center rounded-full text-xs font-bold ring-2 ring-[#fafaf9] dark:ring-background ${av.bg}`}
                                            >
                                                {av.initials}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-xs leading-snug">
                                        <p className="font-bold text-foreground">
                                            {stats.volunteers}+ volunteers
                                            confirmed
                                        </p>
                                        <p className="text-muted-foreground">
                                            Across {stats.events} community
                                            initiatives & {stats.divisions}{' '}
                                            divisions
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Stepped Stair-Cutout Editorial Photo with Scroll Parallax */}
                            <HeroParallaxPhoto stats={stats} />
                        </div>
                    </div>
                </section>

                {/* Crisp White Asterisk Marquee Strip */}
                <div className="overflow-hidden border-b border-border bg-white py-4 dark:bg-card">
                    <div className="animate-vs-marquee flex w-max items-center gap-7 whitespace-nowrap">
                        {[...tickerItems, ...tickerItems, ...tickerItems].map(
                            (item, idx) => (
                                <span
                                    key={`${item}-${idx}`}
                                    className="flex items-center gap-7 text-base font-medium tracking-tight text-foreground sm:text-lg"
                                >
                                    <span>{item}</span>
                                    <span className="font-mono text-xl font-bold text-[#008c8d]">
                                        *
                                    </span>
                                </span>
                            ),
                        )}
                    </div>
                </div>

                {/* [ VolunSync in numbers ] — Rolling Animated Counter Grid */}
                <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mb-8 flex flex-wrap items-center justify-between gap-2">
                        <p className="font-mono text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                                [ VolunSync in numbers ]
                            </span>{' '}
                            — growing with every community event
                        </p>
                        <span className="font-mono text-xs text-muted-foreground">
                            2025 → 2026
                        </span>
                    </div>

                    <div className="grid grid-cols-2 border-y border-border lg:grid-cols-4">
                        {[
                            {
                                label: 'Volunteers',
                                value: stats.volunteers,
                                suffix: '+',
                                padZero: false,
                            },
                            {
                                label: 'Community Events',
                                value: stats.events,
                                suffix: '',
                                padZero: true,
                            },
                            {
                                label: 'Scheduled Shifts',
                                value: stats.shifts,
                                suffix: '',
                                padZero: true,
                            },
                            {
                                label: 'Verified Hours',
                                value: stats.verified_hours,
                                suffix: 'h',
                                padZero: false,
                            },
                        ].map((metric, idx) => (
                            <div
                                key={metric.label}
                                className={`py-8 ${idx > 0 ? 'border-l border-border pl-6' : 'pr-6'} ${idx >= 2 ? 'border-t border-border lg:border-t-0' : ''}`}
                            >
                                <p className="font-mono text-xs text-muted-foreground">
                                    {metric.label}
                                </p>
                                <p className="mt-2 font-mono text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                                    <AnimatedCounter
                                        target={metric.value}
                                        suffix={metric.suffix}
                                        padZero={metric.padZero}
                                    />
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Editorial Statement + Dark Contrast Admission Pass */}
                <section
                    id="why"
                    className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
                >
                    <div className="grid items-center gap-10 lg:grid-cols-12">
                        <Reveal className="lg:col-span-7">
                            <p className="font-mono text-xs text-muted-foreground">
                                -- It&apos;s more than{' '}
                                <span className="font-semibold text-primary">
                                    [ just a spreadsheet ]
                                </span>
                            </p>
                            <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] sm:text-5xl sm:leading-[1.08]">
                                One calm operating system built around a single
                                goal: making community volunteering effortless.
                            </h2>
                            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                                From first application to final check-out,
                                VolunSync replaces disconnected chat groups,
                                manual attendance sheets, and conflicting shift
                                tables with a fast, role-isolated workspace.
                            </p>
                        </Reveal>

                        {/* Dark Contrast Volunteer Admission Pass Card with Spring Hover */}
                        <Reveal delayMs={120} className="lg:col-span-5">
                            <motion.div
                                whileHover={{ y: -6, rotate: -0.5 }}
                                transition={springCard}
                                className="relative overflow-hidden rounded-2xl bg-[#0e0f12] p-6 text-white shadow-raised"
                            >
                                <div className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-gradient-to-br from-[#008c8d]/40 to-[#2563eb]/30 blur-3xl" />

                                <div className="relative flex items-center justify-between border-b border-dashed border-white/15 pb-4 font-mono text-[11px]">
                                    <span className="text-[#34d399]">
                                        VOLUNTEER PASS · EDITION 26
                                    </span>
                                    <Link
                                        href="/register"
                                        className="text-white/70 underline-offset-4 hover:text-white hover:underline"
                                    >
                                        Get pass →
                                    </Link>
                                </div>

                                <div className="relative my-6 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-mono text-xs tracking-widest text-white/50 uppercase">
                                            VOLUNSYNC 26
                                        </p>
                                        <h3 className="mt-1 text-2xl font-bold tracking-tight">
                                            Verified Member
                                        </h3>
                                        <p className="mt-1 flex items-center gap-1.5 text-xs text-white/65">
                                            <ShieldCheck className="size-3.5 text-[#34d399]" />
                                            QR + Haversine GPS Enabled
                                        </p>
                                    </div>
                                    <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-white p-2 text-[#0e0f12]">
                                        <QrCode className="size-10" />
                                    </div>
                                </div>

                                <div className="relative grid grid-cols-2 gap-4 border-t border-dashed border-white/15 pt-4 font-mono text-xs">
                                    <div>
                                        <span className="text-[10px] text-white/45 uppercase">
                                            Access
                                        </span>
                                        <p className="mt-0.5 font-semibold text-white">
                                            All Open Events
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-white/45 uppercase">
                                            Overlap Guard
                                        </span>
                                        <p className="mt-0.5 font-semibold text-[#34d399]">
                                            0% Double-Booking
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </Reveal>
                    </div>

                    {/* -- 01 / Why VolunSync */}
                    <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {whyItems.map((item, idx) => (
                            <Reveal key={item.num} delayMs={idx * 70}>
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    transition={springCard}
                                    className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                                >
                                    <div>
                                        <span className="font-mono text-xs font-semibold text-primary">
                                            {item.num}
                                        </span>
                                        <h3 className="mt-3 text-base font-bold tracking-tight">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                            {item.description}
                                        </p>
                                    </div>
                                </motion.div>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* -- 02 / Focus Areas */}
                <section
                    id="focus"
                    className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
                >
                    <div className="mb-10 grid gap-4 lg:grid-cols-12">
                        <div className="lg:col-span-5">
                            <p className="font-mono text-xs text-primary">
                                -- 02 / Focus areas
                            </p>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                                Four integrated pillars, one clean workflow.
                            </h2>
                        </div>
                        <div className="flex items-end lg:col-span-7">
                            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                                Every module shares one relational schema and
                                policy layer — no brittle webhooks or manual
                                exports between tools.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        {focusAreas.map((area, idx) => (
                            <Reveal key={area.num} delayMs={(idx % 2) * 90}>
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    transition={springCard}
                                    className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40 hover:bg-surface/60"
                                >
                                    <div>
                                        <div className="flex items-center justify-between font-mono text-xs">
                                            <span className="font-semibold text-primary">
                                                {area.num}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {area.category}
                                            </span>
                                        </div>
                                        <h3 className="mt-4 text-2xl font-bold tracking-tight">
                                            {area.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                            {area.description}
                                        </p>
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {area.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded-full bg-surface px-2.5 py-1 font-mono text-[11px] text-muted-foreground ring-1 ring-border"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <Link
                                            href={area.href}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-foreground transition-colors group-hover:text-primary"
                                        >
                                            <span>{area.cta}</span>
                                            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </Link>
                                    </div>
                                </motion.div>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* -- 03 / Active Community Events (Live from DB) */}
                {featuredEvents.length > 0 && (
                    <section
                        id="events"
                        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
                    >
                        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="font-mono text-xs text-primary">
                                    -- 03 / Active initiatives
                                </p>
                                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                                    Open for volunteer applications.
                                </h2>
                            </div>
                            <Link
                                href="/events"
                                className="group inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface dark:bg-card"
                            >
                                <span>Explore all events</span>
                                <ArrowUpRight className="size-3.5 transition-transform group-hover:rotate-45" />
                            </Link>
                        </div>

                        <div className="divide-y divide-border border-y border-border">
                            {featuredEvents.map((ev, idx) => (
                                <Reveal key={ev.id} delayMs={idx * 70}>
                                    <Link
                                        href="/events"
                                        className="group flex flex-col justify-between gap-4 py-6 transition-colors hover:bg-surface/60 sm:flex-row sm:items-center sm:px-4"
                                    >
                                        <div className="flex items-start gap-5">
                                            <span className="font-mono text-xs text-muted-foreground">
                                                0{idx + 1}
                                            </span>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-lg font-bold tracking-tight group-hover:text-primary">
                                                        {ev.title}
                                                    </h3>
                                                    <span className="rounded-full bg-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-soft-foreground uppercase">
                                                        {ev.status}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="size-3.5 text-primary" />
                                                        {ev.venue_name}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <CalendarDays className="size-3.5 text-primary" />
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

                                        <div className="flex items-center gap-4 pl-9 sm:pl-0">
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {ev.divisions_count} divisions ·{' '}
                                                {ev.shifts_count} shifts
                                            </span>
                                            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                                        </div>
                                    </Link>
                                </Reveal>
                            ))}
                        </div>
                    </section>
                )}

                {/* -- 04 / Four Stages, One Platform */}
                <section
                    id="workflow"
                    className="bg-vs-grid border-y border-border/70 py-16"
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="font-mono text-xs text-primary">
                                    -- 04 / Four stages, one platform
                                </p>
                                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                                    Scroll to unfold the volunteer journey.
                                </h2>
                            </div>
                            <span className="font-mono text-xs text-muted-foreground">
                                [ End-to-end lifecycle ]
                            </span>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                            {workflowStages.map((stage, idx) => (
                                <Reveal key={stage.step} delayMs={idx * 80}>
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        transition={springCard}
                                        className="flex h-full flex-col rounded-2xl border border-border bg-white p-5 shadow-xs dark:bg-card"
                                    >
                                        <div className="flex items-baseline justify-between border-b border-border pb-3">
                                            <span className="font-mono text-xs font-semibold text-primary">
                                                {stage.step}
                                            </span>
                                            <span className="text-sm font-bold">
                                                {stage.phase}
                                            </span>
                                        </div>
                                        <div className="mt-4 space-y-3.5">
                                            {stage.items.map((it) => (
                                                <div
                                                    key={it.title}
                                                    className="space-y-1 border-b border-dashed border-border/80 pb-3 last:border-0 last:pb-0"
                                                >
                                                    <p className="text-xs leading-snug font-medium text-foreground">
                                                        {it.title}
                                                    </p>
                                                    <p className="font-mono text-[10px] text-muted-foreground uppercase">
                                                        {it.meta}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* -- 05 / Role Access Passes */}
                <section
                    id="passes"
                    className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
                >
                    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="font-mono text-xs text-primary">
                                -- 05 / Role access passes
                            </p>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight">
                                Test every role instantly.
                            </h2>
                        </div>
                        <span className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-muted-foreground">
                            Demo password:{' '}
                            <strong className="text-foreground">
                                password
                            </strong>
                        </span>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-3">
                        {rolePasses.map((pass, idx) => (
                            <Reveal key={pass.code} delayMs={idx * 80}>
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    transition={springCard}
                                    className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs transition-colors hover:border-primary/40"
                                >
                                    <div>
                                        <div className="flex items-center justify-between border-b border-dashed border-border pb-3 font-mono text-xs">
                                            <span className="font-semibold text-primary">
                                                {pass.code}
                                            </span>
                                            <span className="text-muted-foreground">
                                                RBAC ISOLATED
                                            </span>
                                        </div>

                                        <h3 className="mt-4 text-xl font-bold">
                                            {pass.role}
                                        </h3>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {pass.tagline}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                copyEmail(pass.email)
                                            }
                                            className="mt-4 flex w-full items-center justify-between rounded-lg bg-surface px-3 py-2 font-mono text-xs text-foreground ring-1 ring-border transition-colors hover:ring-primary/50"
                                        >
                                            <span>{pass.email}</span>
                                            {copiedEmail === pass.email ? (
                                                <Check className="size-3.5 text-primary" />
                                            ) : (
                                                <Copy className="size-3.5 text-muted-foreground" />
                                            )}
                                        </button>

                                        <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                                            {pass.perks.map((perk) => (
                                                <li
                                                    key={perk}
                                                    className="flex items-start gap-2"
                                                >
                                                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                                                    <span>{perk}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-6 pt-3">
                                        <Link
                                            href="/login"
                                            className="group inline-flex w-full items-center justify-between rounded-full border border-border bg-surface py-1.5 pr-1.5 pl-4 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-white dark:hover:bg-card"
                                        >
                                            <span>Sign in as {pass.role}</span>
                                            <span className="flex size-7 items-center justify-center rounded-full bg-[#0e0f12] text-white transition-transform duration-300 group-hover:rotate-45 dark:bg-white dark:text-[#0e0f12]">
                                                <ArrowUpRight className="size-3.5" />
                                            </span>
                                        </Link>
                                    </div>
                                </motion.div>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* -- 06 / Motion AnimatePresence Accordion FAQ */}
                <section
                    id="faq"
                    className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"
                >
                    <div className="mb-8 text-center">
                        <p className="font-mono text-xs text-primary">
                            -- 06 / Questions & answers
                        </p>
                        <h2 className="mt-2 text-3xl font-bold tracking-tight">
                            Everything you need to know.
                        </h2>
                    </div>

                    <div className="divide-y divide-border border-y border-border">
                        {faqs.map((item, idx) => {
                            const isOpen = openFaq === idx;
                            return (
                                <div key={item.q} className="py-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenFaq(isOpen ? null : idx)
                                        }
                                        className="flex w-full items-center justify-between gap-4 text-left"
                                    >
                                        <span className="text-sm font-semibold text-foreground sm:text-base">
                                            {item.q}
                                        </span>
                                        <span
                                            className={`flex size-7 shrink-0 items-center justify-center rounded-full border border-border transition-transform duration-300 ${isOpen ? 'rotate-45 bg-primary text-white' : 'bg-surface text-foreground'}`}
                                        >
                                            <Plus className="size-3.5" />
                                        </span>
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{
                                                    height: 0,
                                                    opacity: 0,
                                                }}
                                                animate={{
                                                    height: 'auto',
                                                    opacity: 1,
                                                }}
                                                exit={{
                                                    height: 0,
                                                    opacity: 0,
                                                }}
                                                transition={{
                                                    duration: 0.28,
                                                    ease: [0.16, 1, 0.3, 1],
                                                }}
                                                className="overflow-hidden"
                                            >
                                                <p className="pt-3 pr-10 text-sm leading-relaxed text-muted-foreground">
                                                    {item.a}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Dark Contrast Editorial Footer */}
                <footer className="mt-14 bg-[#0e0f12] text-white">
                    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                        <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-10 lg:flex-row lg:items-end">
                            <div>
                                <p className="font-mono text-xs text-[#34d399]">
                                    [ READY TO COORDINATE? ]
                                </p>
                                <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
                                    Run your next community event without the
                                    chaos.
                                </h2>
                            </div>
                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                transition={springCard}
                            >
                                <Link
                                    href={user ? '/dashboard' : '/register'}
                                    className="group inline-flex w-fit items-center gap-3 rounded-full bg-white py-2 pr-2 pl-6 text-sm font-semibold text-[#0e0f12]"
                                >
                                    <span>
                                        {user
                                            ? 'Open my console'
                                            : 'Create volunteer account'}
                                    </span>
                                    <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#008c8d] to-[#2563eb] text-white transition-transform duration-300 group-hover:rotate-45">
                                        <ArrowUpRight className="size-4" />
                                    </span>
                                </Link>
                            </motion.div>
                        </div>

                        <div className="mt-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-white p-1">
                                    <img
                                        src="/images/volunsync-mark.jpg"
                                        alt="VolunSync"
                                        className="size-6 object-contain"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">
                                        VolunSync
                                    </p>
                                    <p className="text-xs text-white/55">
                                        Community Volunteer Management Platform
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-5 font-mono text-xs text-white/60">
                                <Link
                                    href="/events"
                                    className="hover:text-white"
                                >
                                    Events
                                </Link>
                                <Link
                                    href="/login"
                                    className="hover:text-white"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/register"
                                    className="hover:text-white"
                                >
                                    Register
                                </Link>
                                <span>· © 2026 VolunSync</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </MotionConfig>
    );
}

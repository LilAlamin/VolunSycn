import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    Briefcase,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock,
    Compass,
    MapPin,
    QrCode,
    Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import VolunteerLayout from '@/layouts/VolunteerLayout';
import type { Auth } from '@/types';

type ShiftSnapshot = {
    id: number;
    title: string;
    location: string | null;
    start_time: string;
    end_time: string;
    division_id: number;
    division_name: string;
    event_title: string;
    venue_name: string;
    attendance_status: string | null;
    checked_in_at: string | null;
    verified_hours: number;
};

type Props = {
    summary: {
        verified_hours: number;
        completed_shifts: number;
        accepted_divisions: number;
        pending_applications: number;
        upcoming_shifts: number;
    };
    activeCheckIn: ShiftSnapshot | null;
    upcomingShifts: ShiftSnapshot[];
    acceptedWorkspaces: {
        division_id: number;
        division_name: string;
        event_title: string;
        venue_name: string;
        coordinator_name: string | null;
    }[];
    recentApplications: {
        id: number;
        status: 'submitted' | 'under_review' | 'accepted' | 'rejected';
        division_id: number;
        division_name: string;
        event_title: string;
        organization_name: string;
        created_at: string;
    }[];
    recommendedEvents: {
        id: number;
        title: string;
        venue_name: string;
        organization_name: string;
        start_date: string;
        status: string;
        divisions_count: number;
    }[];
};

const appStatusMeta: Record<
    string,
    { label: string; className: string }
> = {
    submitted: {
        label: 'Submitted',
        className: 'bg-secondary text-secondary-foreground',
    },
    under_review: {
        label: 'Under Review',
        className: 'bg-warning text-warning-foreground',
    },
    accepted: {
        label: 'Accepted',
        className: 'bg-success text-success-foreground',
    },
    rejected: {
        label: 'Not Selected',
        className: 'bg-destructive/15 text-destructive',
    },
};

export default function Dashboard({
    summary,
    activeCheckIn,
    upcomingShifts,
    acceptedWorkspaces,
    recentApplications,
    recommendedEvents,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const firstName = (auth.user?.name ?? 'Volunteer').split(' ')[0];

    const kpiCards = [
        {
            label: 'Verified Service Hours',
            value: `${summary.verified_hours}h`,
            sub: `${summary.completed_shifts} completed shifts`,
            icon: Award,
            accent: 'text-primary',
        },
        {
            label: 'Active Workspaces',
            value: summary.accepted_divisions,
            sub: 'Unlocked division hubs',
            icon: Briefcase,
            accent: 'text-primary',
        },
        {
            label: 'Upcoming Shifts',
            value: summary.upcoming_shifts,
            sub: 'Conflict-free schedule',
            icon: CalendarClock,
            accent: 'text-primary',
        },
        {
            label: 'Pending Screening',
            value: summary.pending_applications,
            sub: 'Awaiting coordinator review',
            icon: ClipboardList,
            accent: 'text-highlight',
        },
    ];

    return (
        <VolunteerLayout
            title={`Welcome back, ${firstName}`}
            subtitle="Your personal snapshot across service hours, upcoming shifts, division workspaces, and open initiatives."
            actions={
                <Button size="sm" asChild>
                    <Link href="/events">
                        <Compass className="mr-1.5 size-4" />
                        Explore Events
                    </Link>
                </Button>
            }
        >
            <Head title="Volunteer Dashboard — VolunSync" />

            {/* Live Active Check-In Banner (if currently checked in on site) */}
            {activeCheckIn && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/30 bg-soft/60 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                            <Clock className="size-5 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-soft-foreground">
                                    Currently Checked In
                                </span>
                                <Badge className="bg-brand text-brand-foreground">
                                    Live Shift
                                </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-soft-foreground/90">
                                <strong>{activeCheckIn.title}</strong> ·{' '}
                                {activeCheckIn.division_name} (
                                {activeCheckIn.event_title})
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" asChild>
                            <Link
                                href={`/volunteer/workspace/${activeCheckIn.division_id}`}
                            >
                                Open Workspace
                            </Link>
                        </Button>
                        <Button
                            size="sm"
                            onClick={() =>
                                router.post(
                                    `/volunteer/check-out/${activeCheckIn.id}`,
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                        >
                            Check Out & Log Hours
                        </Button>
                    </div>
                </div>
            )}

            {/* 4 KPI Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((card) => (
                    <Card key={card.label} className="shadow-panel">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription className="text-xs font-medium">
                                {card.label}
                            </CardDescription>
                            <card.icon className={`size-4 ${card.accent}`} />
                        </CardHeader>
                        <CardContent>
                            <p className="font-mono text-2xl font-bold">
                                {card.value}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {card.sub}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-12">
                {/* Left Column: Upcoming Shifts + Accepted Workspaces */}
                <div className="space-y-6 lg:col-span-7">
                    <Card className="shadow-panel">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base">
                                    Upcoming Assigned Shifts
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Zero-overlap schedule across all your
                                    accepted divisions
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/volunteer/workspaces">
                                    All Workspaces
                                    <ArrowRight className="ml-1 size-3.5" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {upcomingShifts.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-xs text-muted-foreground">
                                    No upcoming shifts assigned yet. Once a
                                    coordinator assigns your shift, it will
                                    appear here with quick QR check-in access.
                                </div>
                            ) : (
                                upcomingShifts.map((shift) => (
                                    <div
                                        key={shift.id}
                                        className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-surface p-3.5 sm:flex-row sm:items-center"
                                    >
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="truncate text-sm font-semibold">
                                                    {shift.title}
                                                </p>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[11px]"
                                                >
                                                    {shift.division_name}
                                                </Badge>
                                            </div>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {shift.event_title}
                                            </p>
                                            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays className="size-3 text-primary" />
                                                    {new Date(
                                                        shift.start_time,
                                                    ).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                    {' – '}
                                                    {new Date(
                                                        shift.end_time,
                                                    ).toLocaleTimeString(
                                                        'en-US',
                                                        {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="size-3 text-primary" />
                                                    {shift.location ??
                                                        shift.venue_name}
                                                </span>
                                            </div>
                                        </div>

                                        <Button
                                            size="sm"
                                            className="shrink-0"
                                            asChild
                                        >
                                            <Link
                                                href={`/volunteer/workspace/${shift.division_id}`}
                                            >
                                                <QrCode className="mr-1.5 size-3.5" />
                                                Workspace & QR
                                            </Link>
                                        </Button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Accepted Division Workspaces Quick Grid */}
                    <Card className="shadow-panel">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                                Your Division Workspaces (
                                {acceptedWorkspaces.length})
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Jump directly into division briefings, peer
                                directories, and scoped documents
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {acceptedWorkspaces.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-xs text-muted-foreground">
                                    Apply to a community event to unlock your
                                    first division workspace.
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {acceptedWorkspaces.map((ws) => (
                                        <Link
                                            key={ws.division_id}
                                            href={`/volunteer/workspace/${ws.division_id}`}
                                            className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-3.5 transition-colors hover:border-primary/40 hover:bg-card"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-semibold group-hover:text-primary">
                                                        {ws.division_name}
                                                    </span>
                                                    <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                                                </div>
                                                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                                    {ws.event_title}
                                                </p>
                                            </div>
                                            {ws.coordinator_name && (
                                                <p className="mt-2.5 text-[11px] text-muted-foreground">
                                                    Lead: {ws.coordinator_name}
                                                </p>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Application Status + Open Opportunities */}
                <div className="space-y-6 lg:col-span-5">
                    <Card className="shadow-panel">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base">
                                    Application Status
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Recent recruitment progress
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/volunteer/applications">
                                    View All
                                    <ArrowRight className="ml-1 size-3.5" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            {recentApplications.length === 0 ? (
                                <p className="py-4 text-center text-xs text-muted-foreground">
                                    No applications submitted yet.
                                </p>
                            ) : (
                                recentApplications.map((app) => {
                                    const meta =
                                        appStatusMeta[app.status] ??
                                        appStatusMeta.submitted;
                                    return (
                                        <div
                                            key={app.id}
                                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {app.division_name}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {app.event_title}
                                                </p>
                                            </div>
                                            <Badge className={meta.className}>
                                                {app.status === 'accepted' && (
                                                    <CheckCircle2 className="mr-1 size-3" />
                                                )}
                                                {meta.label}
                                            </Badge>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-panel">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-1.5 text-base">
                                <Sparkles className="size-4 text-primary" />
                                Open Initiatives to Join
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Events currently accepting division volunteers
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recommendedEvents.length === 0 ? (
                                <p className="py-4 text-center text-xs text-muted-foreground">
                                    You are already part of all active events!
                                </p>
                            ) : (
                                recommendedEvents.map((ev) => (
                                    <Link
                                        key={ev.id}
                                        href={`/events?event=${ev.id}`}
                                        className="block rounded-xl border border-border bg-surface p-3 transition-colors hover:border-primary/40 hover:bg-card"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate text-[11px] font-medium text-primary">
                                                {ev.organization_name}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="text-[10px]"
                                            >
                                                {ev.divisions_count}{' '}
                                                {ev.divisions_count === 1
                                                    ? 'division'
                                                    : 'divisions'}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 truncate text-sm font-semibold">
                                            {ev.title}
                                        </p>
                                        <p className="mt-1 truncate text-xs text-muted-foreground">
                                            {ev.venue_name} ·{' '}
                                            {new Date(
                                                ev.start_date,
                                            ).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </Link>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </VolunteerLayout>
    );
}

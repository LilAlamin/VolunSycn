import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    Layers,
    MapPin,
    Search,
    Send,
    Users,
} from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { PublicNavbar } from '@/components/public-navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import VolunteerLayout from '@/layouts/VolunteerLayout';
import type { Auth } from '@/types';

type DivisionItem = {
    id: number;
    name: string;
    description: string | null;
    quota: number;
    accepted_count: number;
    total_applicants_count: number;
    coordinator_name: string | null;
    my_application_status: string | null;
    my_application_id: number | null;
};

type EventItem = {
    id: number;
    title: string;
    slug: string;
    description: string;
    venue_name: string;
    checkin_radius_meters: number;
    start_date: string;
    end_date: string;
    status: string;
    organizer_name: string;
    divisions: DivisionItem[];
};

type Props = {
    events: EventItem[];
};

const statusBadgeStyle: Record<string, string> = {
    submitted: 'bg-secondary text-secondary-foreground',
    under_review: 'bg-warning text-warning-foreground',
    accepted: 'bg-success text-success-foreground',
    rejected: 'bg-destructive/15 text-destructive',
};

export default function Events({ events }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isLoggedIn = Boolean(auth?.user);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'ongoing' | 'open'
    >('all');
    const [activeEventId, setActiveEventId] = useState<number | null>(null);

    const [selectedDivision, setSelectedDivision] = useState<{
        eventTitle: string;
        division: DivisionItem;
    } | null>(null);

    const form = useForm({
        division_id: 0,
        motivation: '',
    });

    const activeEvent = useMemo(
        () => events.find((e) => e.id === activeEventId) ?? null,
        [events, activeEventId],
    );

    const filteredEvents = useMemo(() => {
        return events.filter((ev) => {
            if (statusFilter !== 'all' && ev.status !== statusFilter) {
                return false;
            }
            if (search.trim()) {
                const q = search.toLowerCase();
                return (
                    ev.title.toLowerCase().includes(q) ||
                    ev.venue_name.toLowerCase().includes(q) ||
                    ev.description.toLowerCase().includes(q) ||
                    ev.divisions.some((d) => d.name.toLowerCase().includes(q))
                );
            }
            return true;
        });
    }, [events, statusFilter, search]);

    const openApplyModal = (eventTitle: string, division: DivisionItem) => {
        setSelectedDivision({ eventTitle, division });
        form.setData({
            division_id: division.id,
            motivation: '',
        });
        form.clearErrors();
    };

    const submitApplication = (e: FormEvent) => {
        e.preventDefault();
        form.post('/volunteer/applications', {
            onSuccess: () => {
                setSelectedDivision(null);
                form.reset();
            },
        });
    };

    const pageBody: ReactNode = (
        <>
            {activeEvent ? (
                /* EVENT DETAIL & DIVISIONS VIEW */
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => setActiveEventId(null)}
                        >
                            <ArrowLeft className="mr-1.5 size-4" />
                            Back to All Events
                        </Button>

                        <Badge
                            className={
                                activeEvent.status === 'ongoing'
                                    ? 'bg-highlight text-highlight-foreground'
                                    : 'bg-soft text-soft-foreground'
                            }
                        >
                            {activeEvent.status === 'ongoing'
                                ? 'Ongoing Now'
                                : 'Open for Registration'}
                        </Badge>
                    </div>

                    <Card className="border-border shadow-panel">
                        <CardHeader className="border-b border-border pb-5">
                            <p className="font-mono text-xs text-primary uppercase">
                                [ Event Detail · {activeEvent.divisions.length}{' '}
                                Divisions ]
                            </p>
                            <CardTitle className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                                {activeEvent.title}
                            </CardTitle>
                            <CardDescription className="mt-2 max-w-3xl text-sm leading-relaxed">
                                {activeEvent.description}
                            </CardDescription>

                            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="size-3.5 text-primary" />
                                    {activeEvent.venue_name} (
                                    {activeEvent.checkin_radius_meters}m GPS
                                    check-in radius)
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CalendarDays className="size-3.5 text-primary" />
                                    {new Date(
                                        activeEvent.start_date,
                                    ).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                    {' – '}
                                    {new Date(
                                        activeEvent.end_date,
                                    ).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Users className="size-3.5 text-primary" />
                                    Organized by {activeEvent.organizer_name}
                                </span>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Available Divisions (
                                    {activeEvent.divisions.length})
                                </h2>
                                <span className="text-xs text-muted-foreground">
                                    Choose a division to apply
                                </span>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {activeEvent.divisions.map((div) => {
                                    const fillPercent = Math.min(
                                        100,
                                        Math.round(
                                            (div.accepted_count /
                                                Math.max(1, div.quota)) *
                                                100,
                                        ),
                                    );
                                    const isFull =
                                        div.accepted_count >= div.quota;

                                    return (
                                        <div
                                            key={div.id}
                                            className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-semibold">
                                                        {div.name}
                                                    </h3>
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {div.accepted_count}/
                                                        {div.quota}
                                                    </span>
                                                </div>
                                                {div.description && (
                                                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                                        {div.description}
                                                    </p>
                                                )}
                                                {div.coordinator_name && (
                                                    <p className="mt-2 text-xs text-muted-foreground">
                                                        Lead:{' '}
                                                        <span className="font-medium text-foreground">
                                                            {
                                                                div.coordinator_name
                                                            }
                                                        </span>
                                                    </p>
                                                )}
                                                <div className="mt-3 space-y-1">
                                                    <Progress
                                                        value={fillPercent}
                                                    />
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {isFull
                                                            ? 'Quota full'
                                                            : `${div.quota - div.accepted_count} spots remaining`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-2">
                                                {div.my_application_status ? (
                                                    <div className="flex items-center justify-between gap-2">
                                                        <Badge
                                                            className={
                                                                statusBadgeStyle[
                                                                    div
                                                                        .my_application_status
                                                                ] ?? ''
                                                            }
                                                        >
                                                            <CheckCircle2 className="mr-1 size-3" />
                                                            {div.my_application_status.replace(
                                                                '_',
                                                                ' ',
                                                            )}
                                                        </Badge>
                                                        {div.my_application_status ===
                                                            'accepted' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={`/volunteer/workspace/${div.id}`}
                                                                >
                                                                    Workspace
                                                                </Link>
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : isLoggedIn ? (
                                                    <Button
                                                        size="sm"
                                                        className="w-full rounded-full"
                                                        disabled={isFull}
                                                        onClick={() =>
                                                            openApplyModal(
                                                                activeEvent.title,
                                                                div,
                                                            )
                                                        }
                                                    >
                                                        <Send className="mr-1.5 size-3.5" />
                                                        {isFull
                                                            ? 'Division Full'
                                                            : 'Apply to Division'}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full rounded-full"
                                                        asChild
                                                    >
                                                        <Link href="/login">
                                                            Sign in to Apply
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                /* EVENT CARDS CATALOG VIEW (Per Event First) */
                <div className="space-y-6">
                    {/* Search & Status Filter Bar */}
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                            <Input
                                className="rounded-full bg-card pl-9"
                                placeholder="Search events, venues, or divisions..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-1.5">
                            {(
                                [
                                    { key: 'all', label: 'All Events' },
                                    { key: 'ongoing', label: 'Ongoing' },
                                    { key: 'open', label: 'Open' },
                                ] as const
                            ).map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setStatusFilter(tab.key)}
                                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                                        statusFilter === tab.key
                                            ? 'bg-foreground text-background'
                                            : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredEvents.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-sm text-muted-foreground">
                                No events match your filter right now.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2">
                            {filteredEvents.map((event, idx) => {
                                const totalQuota = event.divisions.reduce(
                                    (sum, d) => sum + d.quota,
                                    0,
                                );
                                const totalAccepted = event.divisions.reduce(
                                    (sum, d) => sum + d.accepted_count,
                                    0,
                                );
                                const fillPercent = Math.min(
                                    100,
                                    Math.round(
                                        (totalAccepted /
                                            Math.max(1, totalQuota)) *
                                            100,
                                    ),
                                );

                                return (
                                    <Card
                                        key={event.id}
                                        className="group flex flex-col justify-between border-border shadow-panel transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-xs font-semibold text-primary">
                                                    --{' '}
                                                    {String(idx + 1).padStart(
                                                        2,
                                                        '0',
                                                    )}
                                                </span>
                                                <Badge
                                                    className={
                                                        event.status ===
                                                        'ongoing'
                                                            ? 'bg-highlight text-highlight-foreground'
                                                            : 'bg-soft text-soft-foreground'
                                                    }
                                                >
                                                    {event.status === 'ongoing'
                                                        ? 'Ongoing Now'
                                                        : 'Open for Registration'}
                                                </Badge>
                                            </div>

                                            <CardTitle className="mt-2 text-xl font-bold tracking-tight group-hover:text-primary">
                                                {event.title}
                                            </CardTitle>
                                            <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                                                {event.description}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            <div className="space-y-1.5 text-xs text-muted-foreground">
                                                <p className="flex items-center gap-1.5">
                                                    <MapPin className="size-3.5 shrink-0 text-primary" />
                                                    <span className="truncate">
                                                        {event.venue_name}
                                                    </span>
                                                </p>
                                                <p className="flex items-center gap-1.5">
                                                    <CalendarDays className="size-3.5 shrink-0 text-primary" />
                                                    {new Date(
                                                        event.start_date,
                                                    ).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        },
                                                    )}
                                                    {' – '}
                                                    {new Date(
                                                        event.end_date,
                                                    ).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        },
                                                    )}
                                                </p>
                                            </div>

                                            {/* Overall Quota Bar */}
                                            <div className="rounded-xl border border-border bg-surface p-3">
                                                <div className="mb-1.5 flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                                                        <Layers className="size-3.5 text-primary" />
                                                        {event.divisions.length}{' '}
                                                        Divisions Available
                                                    </span>
                                                    <span className="font-mono text-muted-foreground">
                                                        {totalAccepted}/
                                                        {totalQuota} filled
                                                    </span>
                                                </div>
                                                <Progress value={fillPercent} />
                                            </div>

                                            {/* Action CTA */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setActiveEventId(event.id)
                                                }
                                                className="inline-flex w-full items-center justify-between rounded-full border border-border bg-white py-1.5 pr-1.5 pl-4 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-surface dark:bg-card"
                                            >
                                                <span>
                                                    View Divisions & Details
                                                </span>
                                                <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#008c8d] to-[#2563eb] text-white transition-transform duration-300 group-hover:rotate-45">
                                                    <ArrowUpRight className="size-3.5" />
                                                </span>
                                            </button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Application Dialog */}
            <Dialog
                open={selectedDivision !== null}
                onOpenChange={(open) => !open && setSelectedDivision(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Apply to {selectedDivision?.division.name}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedDivision?.eventTitle} — Share your
                            motivation and relevant experience for the division
                            coordinator.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitApplication} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="motivation">
                                Why do you want to join this division?
                            </Label>
                            <Textarea
                                id="motivation"
                                rows={4}
                                required
                                placeholder="Describe your availability, skills, and what excites you about serving in this division..."
                                value={form.data.motivation}
                                onChange={(e) =>
                                    form.setData('motivation', e.target.value)
                                }
                            />
                            {form.errors.motivation && (
                                <p className="text-xs text-destructive">
                                    {form.errors.motivation}
                                </p>
                            )}
                            {form.errors.division_id && (
                                <p className="text-xs text-destructive">
                                    {form.errors.division_id}
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSelectedDivision(null)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing
                                    ? 'Submitting...'
                                    : 'Submit Application'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );

    if (isLoggedIn) {
        return (
            <VolunteerLayout
                title={
                    activeEvent
                        ? activeEvent.title
                        : 'Explore Community Events'
                }
                subtitle={
                    activeEvent
                        ? 'Inspect available divisions and submit your volunteer application.'
                        : 'Select an event first to inspect its divisions, quotas, and volunteer roles.'
                }
            >
                <Head title="Explore Events — VolunSync" />
                {pageBody}
            </VolunteerLayout>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Head title="Explore Events — VolunSync" />
            <PublicNavbar active="explore" />

            <section className="bg-vs-grid border-b border-border/70 py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <p className="font-mono text-xs text-primary uppercase">
                        [ Public Event Directory · {events.length} Active ]
                    </p>
                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                        Explore Community Events
                    </h1>
                    <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                        Browse active community initiatives first, then open any
                        event card to inspect its available divisions and quota
                        slots.
                    </p>
                </div>
            </section>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {pageBody}
            </main>
        </div>
    );
}

import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
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

    const initialEventId = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const param = new URLSearchParams(window.location.search).get('event');
        const parsed = param ? Number(param) : NaN;
        return Number.isFinite(parsed) && events.some((e) => e.id === parsed)
            ? parsed
            : null;
    }, [events]);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'ongoing' | 'open'
    >('all');
    const [activeEventId, setActiveEventId] = useState<number | null>(
        initialEventId,
    );

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
                    ev.organizer_name.toLowerCase().includes(q) ||
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
                            onClick={() => setActiveEventId(null)}
                        >
                            <ArrowLeft className="mr-1.5 size-4" />
                            All Events
                        </Button>

                        <div className="flex items-center gap-2">
                            <Badge variant="outline">
                                <Building2 className="mr-1 size-3 text-primary" />
                                {activeEvent.organizer_name}
                            </Badge>
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
                    </div>

                    <Card className="border-border shadow-panel">
                        <CardHeader className="border-b border-border pb-5">
                            <CardTitle className="text-2xl font-bold tracking-tight">
                                {activeEvent.title}
                            </CardTitle>
                            <CardDescription className="mt-1.5 max-w-3xl text-sm leading-relaxed">
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
                                    Hosted by {activeEvent.organizer_name}
                                </span>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Available Divisions (
                                    {activeEvent.divisions.length})
                                </h2>
                                <span className="text-xs text-muted-foreground">
                                    Select a division to submit your application
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
                                                        className="w-full"
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
                                                        className="w-full"
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
                /* CLEAN EVENT CATALOG GRID */
                <div className="space-y-6">
                    <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-xs sm:flex-row sm:items-center">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                            <Input
                                className="border-0 bg-surface pl-9 shadow-none focus-visible:ring-1"
                                placeholder="Search events, organizations, or divisions..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-1.5">
                            {(
                                [
                                    {
                                        key: 'all',
                                        label: `All (${events.length})`,
                                    },
                                    { key: 'ongoing', label: 'Ongoing' },
                                    { key: 'open', label: 'Open' },
                                ] as const
                            ).map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setStatusFilter(tab.key)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        statusFilter === tab.key
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-surface hover:text-foreground'
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
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {filteredEvents.map((event) => {
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
                                const remainingSpots = Math.max(
                                    0,
                                    totalQuota - totalAccepted,
                                );

                                const myAcceptedCount = event.divisions.filter(
                                    (d) =>
                                        d.my_application_status === 'accepted',
                                ).length;
                                const myPendingCount = event.divisions.filter(
                                    (d) =>
                                        d.my_application_status ===
                                            'submitted' ||
                                        d.my_application_status ===
                                            'under_review',
                                ).length;

                                return (
                                    <Card
                                        key={event.id}
                                        className="flex flex-col justify-between border-border shadow-panel transition-all duration-200 hover:border-primary/40"
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span className="inline-flex max-w-[175px] items-center gap-1 truncate text-xs font-medium text-muted-foreground">
                                                    <Building2 className="size-3.5 shrink-0 text-primary" />
                                                    <span className="truncate">
                                                        {event.organizer_name}
                                                    </span>
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
                                                        ? 'Ongoing'
                                                        : 'Open'}
                                                </Badge>
                                            </div>

                                            <CardTitle className="mt-2 line-clamp-2 text-lg leading-snug font-bold">
                                                {event.title}
                                            </CardTitle>
                                            <CardDescription className="line-clamp-2 text-xs leading-relaxed">
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

                                            {/* Division & Quota Summary */}
                                            <div className="rounded-lg border border-border bg-surface p-3">
                                                <div className="mb-1.5 flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                                                        <Layers className="size-3.5 text-primary" />
                                                        {event.divisions.length}{' '}
                                                        {event.divisions
                                                            .length === 1
                                                            ? 'Division'
                                                            : 'Divisions'}
                                                    </span>
                                                    <span className="font-mono text-[11px] text-muted-foreground">
                                                        {remainingSpots} spots
                                                        left
                                                    </span>
                                                </div>
                                                <Progress value={fillPercent} />
                                            </div>

                                            {/* My Participation Badge (if already applied/accepted) */}
                                            {(myAcceptedCount > 0 ||
                                                myPendingCount > 0) && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {myAcceptedCount > 0 && (
                                                        <Badge className="bg-success text-[11px] text-success-foreground">
                                                            <CheckCircle2 className="mr-1 size-3" />
                                                            Accepted (
                                                            {myAcceptedCount})
                                                        </Badge>
                                                    )}
                                                    {myPendingCount > 0 && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[11px]"
                                                        >
                                                            Applied (
                                                            {myPendingCount})
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}

                                            <Button
                                                variant={
                                                    myAcceptedCount > 0
                                                        ? 'outline'
                                                        : 'default'
                                                }
                                                size="sm"
                                                className="w-full"
                                                onClick={() =>
                                                    setActiveEventId(event.id)
                                                }
                                            >
                                                Inspect Divisions & Apply
                                                <ArrowRight className="ml-1.5 size-3.5" />
                                            </Button>
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
                        : 'Browse active initiatives first, then open any event card to view divisions and apply.'
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

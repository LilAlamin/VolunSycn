import { Head, useForm } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import {
    ArrowLeft,
    ArrowRight,
    ArrowUpDown,
    CalendarDays,
    CheckCircle2,
    Clock,
    ExternalLink,
    Eye,
    FileText,
    Globe,
    Inbox,
    Layers,
    Mail,
    MapPin,
    Phone,
    Search,
    Users,
    XCircle,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { CvPreview } from '@/components/cv-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/AdminLayout';
import { cn } from '@/lib/utils';

type ApplicationRow = {
    id: number;
    status: 'submitted' | 'under_review' | 'accepted' | 'rejected';
    motivation: string;
    phone: string | null;
    instagram: string | null;
    linkedin: string | null;
    cv_original_name: string | null;
    cv_url: string | null;
    reviewer_notes: string | null;
    reviewer_name: string | null;
    reviewed_at: string | null;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        bio: string | null;
    };
    event: {
        id: number;
        title: string;
    };
    division: {
        id: number;
        name: string;
        quota: number;
    };
};

type EventItem = {
    id: number;
    title: string;
    status: string;
    venue_name: string | null;
    start_date: string | null;
    end_date: string | null;
};

type DivisionItem = {
    id: number;
    event_id: number;
    name: string;
    quota: number;
};

type Props = {
    applications: ApplicationRow[];
    events: EventItem[];
    divisions: DivisionItem[];
};

const statusBadge: Record<string, string> = {
    submitted: 'bg-secondary text-secondary-foreground',
    under_review: 'bg-warning text-warning-foreground',
    accepted: 'bg-success text-success-foreground',
    rejected: 'bg-destructive/15 text-destructive',
};

const eventStatusStyle: Record<string, { label: string; className: string }> = {
    ongoing: {
        label: 'Ongoing',
        className: 'bg-warning text-warning-foreground',
    },
    open: {
        label: 'Open',
        className: 'bg-success text-success-foreground',
    },
    draft: {
        label: 'Draft',
        className: 'bg-secondary text-secondary-foreground',
    },
    completed: {
        label: 'Completed',
        className: 'bg-muted text-muted-foreground',
    },
};

const formatDateRange = (start: string | null, end: string | null): string => {
    if (!start) return 'Schedule TBA';
    const s = new Date(start).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    if (!end) return s;
    const e = new Date(end).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
    return `${s} – ${e}`;
};

const normalizeSocialUrl = (
    value: string,
    platform: 'instagram' | 'linkedin',
): string => {
    const trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    if (platform === 'instagram') {
        const handle = trimmed.replace(/^@/, '');
        return `https://instagram.com/${handle}`;
    }
    return `https://${trimmed}`;
};

export default function ApplicationsIndex({
    applications,
    events,
    divisions,
}: Props) {
    // null = Event Overview Grid, 'all' = All Events Combined Table, '<eventId>' = Focused Event Queue
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [eventSearch, setEventSearch] = useState('');
    const [search, setSearch] = useState('');
    const [divisionFilter, setDivisionFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [reviewTarget, setReviewTarget] = useState<ApplicationRow | null>(
        null,
    );

    const reviewForm = useForm({
        status: 'accepted',
        reviewer_notes: '',
    });

    const openReview = (app: ApplicationRow) => {
        setReviewTarget(app);
        reviewForm.setData({
            status: app.status === 'submitted' ? 'accepted' : app.status,
            reviewer_notes: app.reviewer_notes ?? '',
        });
        reviewForm.clearErrors();
    };

    const submitReview = (e: FormEvent) => {
        e.preventDefault();
        if (!reviewTarget) return;
        reviewForm.patch(`/admin/applications/${reviewTarget.id}/review`, {
            preserveScroll: true,
            onSuccess: () => setReviewTarget(null),
        });
    };

    const enterEvent = (eventId: string) => {
        setSelectedEventId(eventId);
        setDivisionFilter('all');
        setStatusFilter('all');
        setSearch('');
        setSorting([]);
    };

    const backToEvents = () => {
        setSelectedEventId(null);
        setDivisionFilter('all');
        setStatusFilter('all');
        setSearch('');
    };

    // Global summary metrics
    const globalStats = useMemo(() => {
        const total = applications.length;
        const submitted = applications.filter(
            (a) => a.status === 'submitted',
        ).length;
        const underReview = applications.filter(
            (a) => a.status === 'under_review',
        ).length;
        const accepted = applications.filter(
            (a) => a.status === 'accepted',
        ).length;
        const rejected = applications.filter(
            (a) => a.status === 'rejected',
        ).length;
        const totalQuota = divisions.reduce((sum, d) => sum + d.quota, 0);
        return {
            total,
            pending: submitted + underReview,
            submitted,
            underReview,
            accepted,
            rejected,
            totalQuota,
        };
    }, [applications, divisions]);

    // Per-event aggregated cards data
    const eventSummaries = useMemo(() => {
        return events.map((ev) => {
            const evApps = applications.filter((a) => a.event.id === ev.id);
            const evDivisions = divisions.filter((d) => d.event_id === ev.id);

            const submitted = evApps.filter(
                (a) => a.status === 'submitted',
            ).length;
            const underReview = evApps.filter(
                (a) => a.status === 'under_review',
            ).length;
            const accepted = evApps.filter(
                (a) => a.status === 'accepted',
            ).length;
            const rejected = evApps.filter(
                (a) => a.status === 'rejected',
            ).length;
            const pending = submitted + underReview;
            const totalQuota = evDivisions.reduce((sum, d) => sum + d.quota, 0);
            const fillPct =
                totalQuota > 0
                    ? Math.min(100, Math.round((accepted / totalQuota) * 100))
                    : 0;

            const divisionBreakdown = evDivisions.map((d) => {
                const divApps = evApps.filter((a) => a.division.id === d.id);
                const divAccepted = divApps.filter(
                    (a) => a.status === 'accepted',
                ).length;
                const divPending = divApps.filter(
                    (a) =>
                        a.status === 'submitted' || a.status === 'under_review',
                ).length;
                return {
                    ...d,
                    total: divApps.length,
                    accepted: divAccepted,
                    pending: divPending,
                };
            });

            return {
                event: ev,
                total: evApps.length,
                submitted,
                underReview,
                accepted,
                rejected,
                pending,
                totalQuota,
                fillPct,
                divisions: divisionBreakdown,
            };
        });
    }, [events, applications, divisions]);

    const filteredEventSummaries = useMemo(() => {
        if (!eventSearch.trim()) return eventSummaries;
        const q = eventSearch.toLowerCase();
        return eventSummaries.filter(
            (item) =>
                item.event.title.toLowerCase().includes(q) ||
                (item.event.venue_name ?? '').toLowerCase().includes(q) ||
                item.divisions.some((d) => d.name.toLowerCase().includes(q)),
        );
    }, [eventSummaries, eventSearch]);

    const selectedEventSummary = useMemo(() => {
        if (!selectedEventId || selectedEventId === 'all') return null;
        return (
            eventSummaries.find((s) => String(s.event.id) === selectedEventId) ??
            null
        );
    }, [eventSummaries, selectedEventId]);

    // Applications scoped to current event selection (before division/status/search filters)
    const eventScopedApps = useMemo(() => {
        if (!selectedEventId || selectedEventId === 'all') {
            return applications;
        }
        return applications.filter(
            (app) => String(app.event.id) === selectedEventId,
        );
    }, [applications, selectedEventId]);

    // Division-scoped apps for accurate status tab counts
    const divisionScopedApps = useMemo(() => {
        if (divisionFilter === 'all') return eventScopedApps;
        return eventScopedApps.filter(
            (app) => String(app.division.id) === divisionFilter,
        );
    }, [eventScopedApps, divisionFilter]);

    const statusCounts = useMemo(() => {
        const all = divisionScopedApps.length;
        const submitted = divisionScopedApps.filter(
            (a) => a.status === 'submitted',
        ).length;
        const under_review = divisionScopedApps.filter(
            (a) => a.status === 'under_review',
        ).length;
        const accepted = divisionScopedApps.filter(
            (a) => a.status === 'accepted',
        ).length;
        const rejected = divisionScopedApps.filter(
            (a) => a.status === 'rejected',
        ).length;
        return {
            all,
            pending: submitted + under_review,
            submitted,
            under_review,
            accepted,
            rejected,
        };
    }, [divisionScopedApps]);

    // Map division accepted counts for table quota display
    const divisionAcceptedMap = useMemo(() => {
        const map = new Map<number, number>();
        for (const app of applications) {
            if (app.status === 'accepted') {
                map.set(app.division.id, (map.get(app.division.id) ?? 0) + 1);
            }
        }
        return map;
    }, [applications]);

    const filteredData = useMemo(() => {
        return divisionScopedApps.filter((app) => {
            if (statusFilter === 'pending') {
                if (app.status !== 'submitted' && app.status !== 'under_review') {
                    return false;
                }
            } else if (statusFilter !== 'all' && app.status !== statusFilter) {
                return false;
            }
            if (search.trim()) {
                const q = search.toLowerCase();
                return (
                    app.user.name.toLowerCase().includes(q) ||
                    app.user.email.toLowerCase().includes(q) ||
                    (app.phone ?? app.user.phone ?? '')
                        .toLowerCase()
                        .includes(q) ||
                    app.division.name.toLowerCase().includes(q) ||
                    app.event.title.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [divisionScopedApps, statusFilter, search]);

    const isAllEventsTable = selectedEventId === 'all';

    const columns = useMemo<ColumnDef<ApplicationRow>[]>(
        () => [
            {
                id: 'applicant',
                accessorFn: (row) => row.user.name,
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        Applicant
                        <ArrowUpDown className="ml-1.5 size-3.5" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const phone = row.original.phone || row.original.user.phone;
                    return (
                        <div>
                            <div className="flex items-center gap-1.5">
                                <p className="font-medium">
                                    {row.original.user.name}
                                </p>
                                {row.original.cv_url && (
                                    <Badge
                                        variant="outline"
                                        className="px-1.5 py-0 text-[10px]"
                                    >
                                        <FileText className="mr-0.5 size-2.5" />
                                        CV
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {row.original.user.email}
                                {phone ? ` · ${phone}` : ''}
                            </p>
                        </div>
                    );
                },
            },
            {
                id: 'division',
                accessorFn: (row) => row.division.name,
                header: isAllEventsTable ? 'Event & Division' : 'Division',
                cell: ({ row }) => {
                    const filled =
                        divisionAcceptedMap.get(row.original.division.id) ?? 0;
                    const quota = row.original.division.quota;
                    const isFull = filled >= quota;
                    return (
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-medium">
                                    {row.original.division.name}
                                </p>
                                <span
                                    className={cn(
                                        'font-mono text-[11px]',
                                        isFull
                                            ? 'font-semibold text-destructive'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {filled}/{quota}
                                </span>
                            </div>
                            {isAllEventsTable && (
                                <p className="max-w-56 truncate text-xs text-muted-foreground">
                                    {row.original.event.title}
                                </p>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => (
                    <Badge className={statusBadge[row.original.status] ?? ''}>
                        {row.original.status.replace('_', ' ')}
                    </Badge>
                ),
            },
            {
                accessorKey: 'created_at',
                header: 'Applied',
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-muted-foreground">
                        {new Date(row.original.created_at).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric' },
                        )}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: () => <div className="text-right">Review</div>,
                cell: ({ row }) => (
                    <div className="text-right">
                        <Button
                            size="sm"
                            variant={
                                row.original.status === 'submitted' ||
                                row.original.status === 'under_review'
                                    ? 'default'
                                    : 'outline'
                            }
                            onClick={() => openReview(row.original)}
                        >
                            <Eye className="mr-1.5 size-3.5" />
                            Screen
                        </Button>
                    </div>
                ),
            },
        ],
        [isAllEventsTable, divisionAcceptedMap],
    );

    const table = useReactTable({
        data: filteredData,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 12 } },
    });

    const visibleDivisions =
        !selectedEventId || selectedEventId === 'all'
            ? divisions
            : divisions.filter((d) => String(d.event_id) === selectedEventId);

    const statusTabs = [
        { key: 'all', label: 'All', count: statusCounts.all },
        {
            key: 'pending',
            label: 'Needs Screening',
            count: statusCounts.pending,
            highlight: true,
        },
        { key: 'submitted', label: 'Submitted', count: statusCounts.submitted },
        {
            key: 'under_review',
            label: 'Under Review',
            count: statusCounts.under_review,
        },
        { key: 'accepted', label: 'Accepted', count: statusCounts.accepted },
        { key: 'rejected', label: 'Rejected', count: statusCounts.rejected },
    ];

    return (
        <AdminLayout
            title="Volunteer Screening Portal"
            subtitle={
                selectedEventSummary
                    ? `Screening applicants for ${selectedEventSummary.event.title}`
                    : 'Select an event to screen applicants by division, review CVs, and manage quotas.'
            }
            actions={
                selectedEventId === null ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => enterEvent('all')}
                    >
                        <Layers className="mr-1.5 size-3.5" />
                        All Applicants ({globalStats.total})
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={backToEvents}
                    >
                        <ArrowLeft className="mr-1.5 size-3.5" />
                        All Events
                    </Button>
                )
            }
        >
            <Head title="Screening Portal — VolunSync Admin" />

            {/* LEVEL 1: EVENT OVERVIEW GRID */}
            {selectedEventId === null ? (
                <div className="space-y-6">
                    {/* Compact Summary Strip */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="shadow-xs">
                            <CardContent className="flex items-center justify-between pt-5">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Total Applications
                                    </p>
                                    <p className="mt-1 font-mono text-2xl font-bold">
                                        {globalStats.total}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        Across {events.length} events
                                    </p>
                                </div>
                                <div className="flex size-10 items-center justify-center rounded-xl bg-soft text-soft-foreground">
                                    <Inbox className="size-5" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-warning/40 shadow-xs">
                            <CardContent className="flex items-center justify-between pt-5">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Needs Screening
                                    </p>
                                    <p className="mt-1 font-mono text-2xl font-bold text-warning-foreground">
                                        {globalStats.pending}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {globalStats.submitted} new ·{' '}
                                        {globalStats.underReview} reviewing
                                    </p>
                                </div>
                                <div className="flex size-10 items-center justify-center rounded-xl bg-warning/25 text-warning-foreground">
                                    <Clock className="size-5" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-xs">
                            <CardContent className="flex items-center justify-between pt-5">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Accepted Volunteers
                                    </p>
                                    <p className="mt-1 font-mono text-2xl font-bold text-primary">
                                        {globalStats.accepted}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        of {globalStats.totalQuota} total quota
                                    </p>
                                </div>
                                <div className="flex size-10 items-center justify-center rounded-xl bg-success text-success-foreground">
                                    <CheckCircle2 className="size-5" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-xs">
                            <CardContent className="flex items-center justify-between pt-5">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Rejected
                                    </p>
                                    <p className="mt-1 font-mono text-2xl font-bold">
                                        {globalStats.rejected}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        Declined applications
                                    </p>
                                </div>
                                <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                                    <XCircle className="size-5" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Event Search Bar */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-base font-semibold">
                                Choose an Event to Screen
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Click any event card to view its divisions and
                                screen applicants in a focused queue.
                            </p>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                            <Input
                                className="pl-8"
                                placeholder="Filter events or divisions..."
                                value={eventSearch}
                                onChange={(e) => setEventSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Event Cards Grid */}
                    {filteredEventSummaries.length === 0 ? (
                        <Card className="shadow-panel">
                            <CardContent className="py-12 text-center text-sm text-muted-foreground">
                                No events found matching your search.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2">
                            {filteredEventSummaries.map((item) => {
                                const badge = eventStatusStyle[
                                    item.event.status
                                ] ?? {
                                    label: item.event.status,
                                    className:
                                        'bg-secondary text-secondary-foreground',
                                };

                                return (
                                    <Card
                                        key={item.event.id}
                                        onClick={() =>
                                            enterEvent(String(item.event.id))
                                        }
                                        className="group cursor-pointer border-border/80 shadow-xs transition-all hover:border-primary/50 hover:shadow-panel"
                                    >
                                        <CardContent className="flex h-full flex-col justify-between gap-4 pt-5">
                                            <div className="space-y-3">
                                                {/* Header Row */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                                            <Badge
                                                                className={
                                                                    badge.className
                                                                }
                                                            >
                                                                {badge.label}
                                                            </Badge>
                                                            {item.pending >
                                                            0 ? (
                                                                <Badge className="bg-warning/25 text-warning-foreground">
                                                                    {
                                                                        item.pending
                                                                    }{' '}
                                                                    needs
                                                                    screening
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-muted-foreground"
                                                                >
                                                                    All screened
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <h3 className="text-base font-bold tracking-tight transition-colors group-hover:text-primary">
                                                            {item.event.title}
                                                        </h3>
                                                    </div>
                                                    <div className="shrink-0 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-right">
                                                        <p className="font-mono text-lg leading-none font-bold">
                                                            {item.total}
                                                        </p>
                                                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                            applicants
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Venue & Dates */}
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                    {item.event.venue_name && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin className="size-3.5 text-primary/70" />
                                                            {
                                                                item.event
                                                                    .venue_name
                                                            }
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1">
                                                        <CalendarDays className="size-3.5 text-primary/70" />
                                                        {formatDateRange(
                                                            item.event
                                                                .start_date,
                                                            item.event.end_date,
                                                        )}
                                                    </span>
                                                </div>

                                                {/* Quota Progress */}
                                                <div className="space-y-1.5 rounded-lg border border-border/70 bg-surface/70 p-3">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="inline-flex items-center gap-1.5 font-medium">
                                                            <Users className="size-3.5 text-primary" />
                                                            Division Quota
                                                            Filled
                                                        </span>
                                                        <span className="font-mono font-semibold">
                                                            {item.accepted}/
                                                            {item.totalQuota} (
                                                            {item.fillPct}%)
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={item.fillPct}
                                                        className="h-1.5"
                                                    />
                                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                                        {item.divisions.map(
                                                            (div) => (
                                                                <span
                                                                    key={div.id}
                                                                    className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px]"
                                                                >
                                                                    <span className="max-w-36 truncate font-medium">
                                                                        {
                                                                            div.name
                                                                        }
                                                                    </span>
                                                                    <span className="font-mono text-muted-foreground">
                                                                        {
                                                                            div.accepted
                                                                        }
                                                                        /
                                                                        {
                                                                            div.quota
                                                                        }
                                                                    </span>
                                                                    {div.pending >
                                                                        0 && (
                                                                        <span className="rounded-full bg-warning/30 px-1.5 text-[10px] font-semibold text-warning-foreground">
                                                                            +
                                                                            {
                                                                                div.pending
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer CTA */}
                                            <div className="flex items-center justify-between border-t border-border/60 pt-3">
                                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                                    <span>
                                                        <strong className="text-foreground">
                                                            {item.submitted}
                                                        </strong>{' '}
                                                        submitted
                                                    </span>
                                                    <span>
                                                        <strong className="text-foreground">
                                                            {item.underReview}
                                                        </strong>{' '}
                                                        reviewing
                                                    </span>
                                                    <span>
                                                        <strong className="text-foreground">
                                                            {item.rejected}
                                                        </strong>{' '}
                                                        rejected
                                                    </span>
                                                </div>
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                                                    Open Screening
                                                    <ArrowRight className="size-3.5" />
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                /* LEVEL 2: FOCUSED EVENT SCREENING QUEUE */
                <div className="space-y-4">
                    {/* Event Context Header + Quick Switcher */}
                    <Card className="shadow-xs">
                        <CardContent className="flex flex-col gap-4 pt-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="-ml-2 h-7 px-2 text-xs text-muted-foreground"
                                        onClick={backToEvents}
                                    >
                                        <ArrowLeft className="mr-1 size-3.5" />
                                        Events
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                        /
                                    </span>
                                    <h2 className="truncate text-base font-bold">
                                        {selectedEventSummary
                                            ? selectedEventSummary.event.title
                                            : 'All Events Combined'}
                                    </h2>
                                    {selectedEventSummary && (
                                        <Badge
                                            className={
                                                eventStatusStyle[
                                                    selectedEventSummary.event
                                                        .status
                                                ]?.className ??
                                                'bg-secondary text-secondary-foreground'
                                            }
                                        >
                                            {eventStatusStyle[
                                                selectedEventSummary.event
                                                    .status
                                            ]?.label ??
                                                selectedEventSummary.event
                                                    .status}
                                        </Badge>
                                    )}
                                </div>
                                {selectedEventSummary && (
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        {selectedEventSummary.event
                                            .venue_name && (
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="size-3.5 text-primary/70" />
                                                {
                                                    selectedEventSummary.event
                                                        .venue_name
                                                }
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1">
                                            <CalendarDays className="size-3.5 text-primary/70" />
                                            {formatDateRange(
                                                selectedEventSummary.event
                                                    .start_date,
                                                selectedEventSummary.event
                                                    .end_date,
                                            )}
                                        </span>
                                        <span className="font-mono">
                                            Quota:{' '}
                                            <strong className="text-foreground">
                                                {selectedEventSummary.accepted}/
                                                {
                                                    selectedEventSummary.totalQuota
                                                }
                                            </strong>{' '}
                                            filled
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Quick Event Switcher */}
                            <div className="flex items-center gap-2">
                                <span className="hidden text-xs text-muted-foreground sm:inline">
                                    Switch event:
                                </span>
                                <Select
                                    value={selectedEventId}
                                    onValueChange={(v) => enterEvent(v)}
                                >
                                    <SelectTrigger className="w-full sm:w-64">
                                        <SelectValue placeholder="Select event" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Events ({globalStats.total})
                                        </SelectItem>
                                        {eventSummaries.map((s) => (
                                            <SelectItem
                                                key={s.event.id}
                                                value={String(s.event.id)}
                                            >
                                                {s.event.title} ({s.pending}{' '}
                                                pending)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Division Quick-Filter Pills (when inside a specific event) */}
                    {selectedEventSummary &&
                        selectedEventSummary.divisions.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDivisionFilter('all')}
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                                        divisionFilter === 'all'
                                            ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                                            : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/50',
                                    )}
                                >
                                    <span>All Divisions</span>
                                    <span
                                        className={cn(
                                            'rounded-full px-1.5 py-0.2 font-mono text-[11px]',
                                            divisionFilter === 'all'
                                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                                : 'bg-muted text-muted-foreground',
                                        )}
                                    >
                                        {selectedEventSummary.total}
                                    </span>
                                </button>

                                {selectedEventSummary.divisions.map((div) => {
                                    const active =
                                        divisionFilter === String(div.id);
                                    const isFull = div.accepted >= div.quota;
                                    return (
                                        <button
                                            key={div.id}
                                            type="button"
                                            onClick={() =>
                                                setDivisionFilter(
                                                    String(div.id),
                                                )
                                            }
                                            className={cn(
                                                'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                                                active
                                                    ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                                                    : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/50',
                                            )}
                                        >
                                            <span>{div.name}</span>
                                            <span
                                                className={cn(
                                                    'font-mono text-[11px]',
                                                    active
                                                        ? 'text-primary-foreground/90'
                                                        : isFull
                                                          ? 'font-semibold text-destructive'
                                                          : 'text-muted-foreground',
                                                )}
                                            >
                                                {div.accepted}/{div.quota}
                                            </span>
                                            {div.pending > 0 && (
                                                <span
                                                    className={cn(
                                                        'rounded-full px-1.5 text-[10px] font-semibold',
                                                        active
                                                            ? 'bg-primary-foreground/20 text-primary-foreground'
                                                            : 'bg-warning/30 text-warning-foreground',
                                                    )}
                                                >
                                                    {div.pending} pending
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                    {/* Main Table Card */}
                    <Card className="shadow-panel">
                        <CardContent className="space-y-4 pt-5">
                            {/* Status Tabs + Search + (Division dropdown in All Events mode) */}
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {statusTabs.map((tab) => {
                                        const active = statusFilter === tab.key;
                                        return (
                                            <button
                                                key={tab.key}
                                                type="button"
                                                onClick={() =>
                                                    setStatusFilter(tab.key)
                                                }
                                                className={cn(
                                                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                                                    active
                                                        ? 'bg-foreground text-background'
                                                        : tab.highlight &&
                                                            tab.count > 0
                                                          ? 'bg-warning/20 text-warning-foreground hover:bg-warning/30'
                                                          : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground',
                                                )}
                                            >
                                                <span>{tab.label}</span>
                                                <span
                                                    className={cn(
                                                        'font-mono text-[11px]',
                                                        active
                                                            ? 'opacity-80'
                                                            : 'opacity-70',
                                                    )}
                                                >
                                                    {tab.count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    {isAllEventsTable && (
                                        <Select
                                            value={divisionFilter}
                                            onValueChange={setDivisionFilter}
                                        >
                                            <SelectTrigger className="w-full sm:w-48">
                                                <SelectValue placeholder="All Divisions" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    All Divisions
                                                </SelectItem>
                                                {visibleDivisions.map((d) => (
                                                    <SelectItem
                                                        key={d.id}
                                                        value={String(d.id)}
                                                    >
                                                        {d.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    <div className="relative w-full sm:w-64">
                                        <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                                        <Input
                                            className="pl-8"
                                            placeholder="Search name, email, phone..."
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* TanStack Table */}
                            <div className="rounded-lg border border-border">
                                <Table>
                                    <TableHeader>
                                        {table
                                            .getHeaderGroups()
                                            .map((hg) => (
                                                <TableRow key={hg.id}>
                                                    {hg.headers.map(
                                                        (header) => (
                                                            <TableHead
                                                                key={header.id}
                                                            >
                                                                {header.isPlaceholder
                                                                    ? null
                                                                    : flexRender(
                                                                          header
                                                                              .column
                                                                              .columnDef
                                                                              .header,
                                                                          header.getContext(),
                                                                      )}
                                                            </TableHead>
                                                        ),
                                                    )}
                                                </TableRow>
                                            ))}
                                    </TableHeader>
                                    <TableBody>
                                        {table.getRowModel().rows.length ===
                                        0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={columns.length}
                                                    className="py-10 text-center text-muted-foreground"
                                                >
                                                    No applications match your
                                                    filters.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            table
                                                .getRowModel()
                                                .rows.map((row) => (
                                                    <TableRow key={row.id}>
                                                        {row
                                                            .getVisibleCells()
                                                            .map((cell) => (
                                                                <TableCell
                                                                    key={
                                                                        cell.id
                                                                    }
                                                                >
                                                                    {flexRender(
                                                                        cell
                                                                            .column
                                                                            .columnDef
                                                                            .cell,
                                                                        cell.getContext(),
                                                                    )}
                                                                </TableCell>
                                                            ))}
                                                    </TableRow>
                                                ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    Showing {table.getRowModel().rows.length} of{' '}
                                    {filteredData.length} applications
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!table.getCanPreviousPage()}
                                        onClick={() => table.previousPage()}
                                    >
                                        Previous
                                    </Button>
                                    <span className="font-mono">
                                        Page{' '}
                                        {table.getState().pagination.pageIndex +
                                            1}{' '}
                                        / {Math.max(1, table.getPageCount())}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!table.getCanNextPage()}
                                        onClick={() => table.nextPage()}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Review Modal */}
            <Dialog
                open={reviewTarget !== null}
                onOpenChange={(open) => !open && setReviewTarget(null)}
            >
                <DialogContent
                    className={cn(
                        'flex max-h-[90vh] w-[95vw] flex-col gap-0 overflow-hidden p-0',
                        reviewTarget?.cv_url
                            ? 'sm:max-w-5xl'
                            : 'sm:max-w-xl',
                    )}
                >
                    <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
                        <div className="flex flex-wrap items-center gap-2">
                            <DialogTitle className="text-base">
                                Screen Applicant: {reviewTarget?.user.name}
                            </DialogTitle>
                            {reviewTarget && (
                                <Badge
                                    className={
                                        statusBadge[reviewTarget.status] ?? ''
                                    }
                                >
                                    {reviewTarget.status.replace('_', ' ')}
                                </Badge>
                            )}
                        </div>
                        <DialogDescription className="truncate">
                            {reviewTarget?.division.name} ·{' '}
                            {reviewTarget?.event.title}
                        </DialogDescription>
                    </DialogHeader>

                    {reviewTarget && (
                        <div
                            className={cn(
                                'grid min-h-0 flex-1 grid-cols-1 overflow-y-auto',
                                reviewTarget.cv_url &&
                                    'lg:grid-cols-12 lg:overflow-hidden',
                            )}
                        >
                            {/* Left Column: Applicant Profile, Motivation & Decision Form */}
                            <form
                                onSubmit={submitReview}
                                className={cn(
                                    'flex min-w-0 flex-col justify-between gap-5 p-6',
                                    reviewTarget.cv_url
                                        ? 'border-b border-border lg:col-span-5 lg:overflow-y-auto lg:border-r lg:border-b-0'
                                        : 'w-full',
                                )}
                            >
                                <div className="min-w-0 space-y-4">
                                    {/* Applicant Profile & Contacts */}
                                    <div className="min-w-0 space-y-3 rounded-lg border border-border bg-surface p-3.5 text-sm">
                                        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Applicant Profile & Motivation
                                        </p>

                                        <p className="max-h-40 overflow-y-auto text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground">
                                            {reviewTarget.motivation}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/70 pt-2.5 text-xs text-muted-foreground">
                                            <a
                                                href={`mailto:${reviewTarget.user.email}`}
                                                className="inline-flex min-w-0 items-center gap-1 font-mono hover:text-primary hover:underline"
                                            >
                                                <Mail className="size-3 shrink-0 text-primary" />
                                                <span className="truncate">
                                                    {reviewTarget.user.email}
                                                </span>
                                            </a>
                                            {(reviewTarget.phone ||
                                                reviewTarget.user.phone) && (
                                                <a
                                                    href={`tel:${reviewTarget.phone || reviewTarget.user.phone}`}
                                                    className="inline-flex items-center gap-1 font-mono hover:text-primary hover:underline"
                                                >
                                                    <Phone className="size-3 shrink-0 text-primary" />
                                                    <span>
                                                        {reviewTarget.phone ||
                                                            reviewTarget.user
                                                                .phone}
                                                    </span>
                                                </a>
                                            )}
                                            {reviewTarget.instagram && (
                                                <a
                                                    href={normalizeSocialUrl(
                                                        reviewTarget.instagram,
                                                        'instagram',
                                                    )}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                                >
                                                    <Globe className="size-3 shrink-0" />
                                                    <span>
                                                        {reviewTarget.instagram}
                                                    </span>
                                                </a>
                                            )}
                                            {reviewTarget.linkedin && (
                                                <a
                                                    href={normalizeSocialUrl(
                                                        reviewTarget.linkedin,
                                                        'linkedin',
                                                    )}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                                >
                                                    <ExternalLink className="size-3 shrink-0" />
                                                    <span>LinkedIn</span>
                                                </a>
                                            )}
                                        </div>

                                        {!reviewTarget.cv_url && (
                                            <p className="border-t border-border/70 pt-2 text-xs text-muted-foreground">
                                                No CV file attached to this
                                                application.
                                            </p>
                                        )}
                                    </div>

                                    {/* Decision Status */}
                                    <div className="space-y-1.5">
                                        <Label>Decision Status</Label>
                                        <Select
                                            value={reviewForm.data.status}
                                            onValueChange={(val) =>
                                                reviewForm.setData(
                                                    'status',
                                                    val,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="under_review">
                                                    Mark Under Review
                                                </SelectItem>
                                                <SelectItem value="accepted">
                                                    Accept (Unlock Workspace)
                                                </SelectItem>
                                                <SelectItem value="rejected">
                                                    Reject
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {reviewForm.errors.status && (
                                            <p className="text-xs text-destructive">
                                                {reviewForm.errors.status}
                                            </p>
                                        )}
                                    </div>

                                    {/* Reviewer Notes */}
                                    <div className="space-y-1.5">
                                        <Label>
                                            Reviewer Notes (shown to volunteer)
                                        </Label>
                                        <Textarea
                                            rows={3}
                                            className="w-full resize-y"
                                            placeholder="Optional feedback or next steps..."
                                            value={
                                                reviewForm.data.reviewer_notes
                                            }
                                            onChange={(e) =>
                                                reviewForm.setData(
                                                    'reviewer_notes',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="border-t border-border/70 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setReviewTarget(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={reviewForm.processing}
                                    >
                                        Save Decision
                                    </Button>
                                </DialogFooter>
                            </form>

                            {/* Right Column: Live CV Document Preview */}
                            {reviewTarget.cv_url && (
                                <div className="flex min-h-[420px] min-w-0 flex-col bg-muted/20 p-4 lg:col-span-7 lg:h-full lg:overflow-hidden">
                                    <CvPreview
                                        url={reviewTarget.cv_url}
                                        filename={reviewTarget.cv_original_name}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

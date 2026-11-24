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
    ArrowUpDown,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Globe,
    Phone,
    Search,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
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

type Props = {
    applications: ApplicationRow[];
    events: { id: number; title: string }[];
    divisions: { id: number; event_id: number; name: string }[];
};

const statusBadge: Record<string, string> = {
    submitted: 'bg-secondary text-secondary-foreground',
    under_review: 'bg-warning text-warning-foreground',
    accepted: 'bg-success text-success-foreground',
    rejected: 'bg-destructive/15 text-destructive',
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
    const [search, setSearch] = useState('');
    const [eventFilter, setEventFilter] = useState('all');
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
            status:
                app.status === 'submitted' ? 'accepted' : app.status,
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

    const filteredData = useMemo(() => {
        return applications.filter((app) => {
            if (eventFilter !== 'all' && String(app.event.id) !== eventFilter) {
                return false;
            }
            if (
                divisionFilter !== 'all' &&
                String(app.division.id) !== divisionFilter
            ) {
                return false;
            }
            if (statusFilter !== 'all' && app.status !== statusFilter) {
                return false;
            }
            if (search.trim()) {
                const q = search.toLowerCase();
                return (
                    app.user.name.toLowerCase().includes(q) ||
                    app.user.email.toLowerCase().includes(q) ||
                    app.division.name.toLowerCase().includes(q) ||
                    app.event.title.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [applications, eventFilter, divisionFilter, statusFilter, search]);

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
                id: 'event',
                accessorFn: (row) => row.event.title,
                header: 'Event & Division',
                cell: ({ row }) => (
                    <div>
                        <p className="font-medium">
                            {row.original.division.name}
                        </p>
                        <p className="max-w-56 truncate text-xs text-muted-foreground">
                            {row.original.event.title}
                        </p>
                    </div>
                ),
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
                            variant="outline"
                            onClick={() => openReview(row.original)}
                        >
                            <Eye className="mr-1.5 size-3.5" />
                            Screen
                        </Button>
                    </div>
                ),
            },
        ],
        [],
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
        eventFilter === 'all'
            ? divisions
            : divisions.filter((d) => String(d.event_id) === eventFilter);

    return (
        <AdminLayout
            title="Volunteer Screening Portal"
            subtitle="Filter, inspect motivations, and approve or reject applicants. Accepting immediately grants division workspace access."
        >
            <Head title="Screening Portal — VolunSync Admin" />

            <Card className="shadow-panel">
                <CardContent className="space-y-4 pt-5">
                    {/* Filter Bar */}
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                            <Input
                                className="pl-8"
                                placeholder="Search applicant..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <Select
                            value={eventFilter}
                            onValueChange={(v) => {
                                setEventFilter(v);
                                setDivisionFilter('all');
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Events" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Events</SelectItem>
                                {events.map((ev) => (
                                    <SelectItem
                                        key={ev.id}
                                        value={String(ev.id)}
                                    >
                                        {ev.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={divisionFilter}
                            onValueChange={setDivisionFilter}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Divisions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Divisions
                                </SelectItem>
                                {visibleDivisions.map((d) => (
                                    <SelectItem key={d.id} value={String(d.id)}>
                                        {d.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Statuses
                                </SelectItem>
                                <SelectItem value="submitted">
                                    Submitted
                                </SelectItem>
                                <SelectItem value="under_review">
                                    Under Review
                                </SelectItem>
                                <SelectItem value="accepted">
                                    Accepted
                                </SelectItem>
                                <SelectItem value="rejected">
                                    Rejected
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* TanStack Table */}
                    <div className="rounded-lg border border-border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((hg) => (
                                    <TableRow key={hg.id}>
                                        {hg.headers.map((header) => (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="py-10 text-center text-muted-foreground"
                                        >
                                            No applications match your filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
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
                                Page {table.getState().pagination.pageIndex + 1}{' '}
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

            {/* Review Modal */}
            <Dialog
                open={reviewTarget !== null}
                onOpenChange={(open) => !open && setReviewTarget(null)}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Screen Applicant: {reviewTarget?.user.name}
                        </DialogTitle>
                        <DialogDescription>
                            {reviewTarget?.division.name} ·{' '}
                            {reviewTarget?.event.title}
                        </DialogDescription>
                    </DialogHeader>

                    {reviewTarget && (
                        <form onSubmit={submitReview} className="space-y-4">
                            <div className="space-y-2.5 rounded-lg border border-border bg-surface p-3 text-sm">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Applicant Profile & Motivation
                                </p>
                                <p className="text-foreground">
                                    {reviewTarget.motivation}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/70 pt-2 text-xs text-muted-foreground">
                                    <span className="font-mono">
                                        {reviewTarget.user.email}
                                    </span>
                                    {(reviewTarget.phone ||
                                        reviewTarget.user.phone) && (
                                        <span className="inline-flex items-center gap-1 font-mono">
                                            <Phone className="size-3 text-primary" />
                                            {reviewTarget.phone ||
                                                reviewTarget.user.phone}
                                        </span>
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
                                            <Globe className="size-3" />
                                            Instagram ({reviewTarget.instagram})
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
                                            <ExternalLink className="size-3" />
                                            LinkedIn
                                        </a>
                                    )}
                                </div>

                                {reviewTarget.cv_url && (
                                    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2">
                                        <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-foreground">
                                            <FileText className="size-4 shrink-0 text-primary" />
                                            <span className="truncate">
                                                {reviewTarget.cv_original_name ||
                                                    'Applicant CV'}
                                            </span>
                                        </span>
                                        <div className="flex shrink-0 items-center gap-1.5">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                asChild
                                            >
                                                <a
                                                    href={reviewTarget.cv_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    View CV
                                                </a>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                asChild
                                            >
                                                <a
                                                    href={`${reviewTarget.cv_url}?download=1`}
                                                    title="Download CV"
                                                >
                                                    <Download className="size-3.5" />
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label>Decision Status</Label>
                                <Select
                                    value={reviewForm.data.status}
                                    onValueChange={(val) =>
                                        reviewForm.setData('status', val)
                                    }
                                >
                                    <SelectTrigger>
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

                            <div className="space-y-1.5">
                                <Label>Reviewer Notes (shown to volunteer)</Label>
                                <Textarea
                                    rows={3}
                                    placeholder="Optional feedback or next steps..."
                                    value={reviewForm.data.reviewer_notes}
                                    onChange={(e) =>
                                        reviewForm.setData(
                                            'reviewer_notes',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>

                            <DialogFooter>
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
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}


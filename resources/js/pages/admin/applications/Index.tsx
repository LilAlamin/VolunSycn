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
import { ArrowUpDown, Eye, Search } from 'lucide-react';
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
                cell: ({ row }) => (
                    <div>
                        <p className="font-medium">{row.original.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {row.original.user.email}
                        </p>
                    </div>
                ),
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
                            <div className="rounded-lg border border-border bg-surface p-3 text-sm">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Applicant Profile & Motivation
                                </p>
                                <p className="mt-1.5 text-foreground">
                                    {reviewTarget.motivation}
                                </p>
                                <p className="mt-2 font-mono text-xs text-muted-foreground">
                                    {reviewTarget.user.email}
                                    {reviewTarget.user.phone
                                        ? ` · ${reviewTarget.user.phone}`
                                        : ''}
                                </p>
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


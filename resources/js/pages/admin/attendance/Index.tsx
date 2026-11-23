import { Head, router } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
    type ColumnDef,
} from '@tanstack/react-table';
import { Award, CheckCircle2, Clock, LogOut, MapPin } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/AdminLayout';

type AttendanceRow = {
    id: number;
    status: 'checked_in' | 'completed' | 'flagged';
    checked_in_at: string | null;
    checked_out_at: string | null;
    checkin_lat: number | null;
    checkin_lng: number | null;
    verification_method: string;
    verified_hours: number;
    volunteer: {
        id: number;
        name: string;
        email: string;
    };
    shift: {
        id: number;
        title: string;
        event_title: string;
        division_name: string;
    };
};

type Props = {
    logs: AttendanceRow[];
    summary: {
        total_logs: number;
        active_checkins: number;
        completed_shifts: number;
        total_verified_hours: number;
    };
};

export default function AttendanceIndex({ logs, summary }: Props) {
    const columns = useMemo<ColumnDef<AttendanceRow>[]>(
        () => [
            {
                id: 'volunteer',
                header: 'Volunteer',
                cell: ({ row }) => (
                    <div>
                        <p className="font-medium">
                            {row.original.volunteer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {row.original.volunteer.email}
                        </p>
                    </div>
                ),
            },
            {
                id: 'shift',
                header: 'Shift & Division',
                cell: ({ row }) => (
                    <div>
                        <p className="font-medium">
                            {row.original.shift.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {row.original.shift.division_name} ·{' '}
                            {row.original.shift.event_title}
                        </p>
                    </div>
                ),
            },
            {
                id: 'verification',
                header: 'Verification',
                cell: ({ row }) => (
                    <div className="space-y-1">
                        <Badge variant="outline" className="font-mono text-xs">
                            {row.original.verification_method
                                .replace('_', ' ')
                                .toUpperCase()}
                        </Badge>
                        {row.original.checkin_lat !== null && (
                            <p className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                                <MapPin className="size-3 text-primary" />
                                {row.original.checkin_lat.toFixed(4)},{' '}
                                {row.original.checkin_lng?.toFixed(4)}
                            </p>
                        )}
                    </div>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                cell: ({ row }) => (
                    <Badge
                        className={
                            row.original.status === 'completed'
                                ? 'bg-success text-success-foreground'
                                : row.original.status === 'checked_in'
                                  ? 'bg-highlight text-highlight-foreground'
                                  : 'bg-destructive/15 text-destructive'
                        }
                    >
                        {row.original.status.replace('_', ' ')}
                    </Badge>
                ),
            },
            {
                id: 'hours',
                header: 'Verified Hours',
                cell: ({ row }) => (
                    <span className="font-mono text-sm font-semibold text-primary">
                        {row.original.verified_hours} hrs
                    </span>
                ),
            },
            {
                id: 'actions',
                header: () => <div className="text-right">Action</div>,
                cell: ({ row }) => (
                    <div className="text-right">
                        {row.original.status === 'checked_in' ? (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    router.post(
                                        `/admin/attendance/${row.original.id}/checkout`,
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                <LogOut className="mr-1.5 size-3.5" />
                                Check Out
                            </Button>
                        ) : (
                            <span className="text-xs text-muted-foreground">
                                Logged
                            </span>
                        )}
                    </div>
                ),
            },
        ],
        [],
    );

    const table = useReactTable({
        data: logs,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 15 } },
    });

    return (
        <AdminLayout
            title="Attendance Logs & Verified Hours"
            subtitle="Real-time QR + GPS check-in logs with automated volunteer service-hour calculation."
        >
            <Head title="Attendance Logs — VolunSync Admin" />

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <Card className="shadow-panel">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription>Total Verified Hours</CardDescription>
                        <Award className="size-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <p className="font-mono text-2xl font-bold text-primary">
                            {summary.total_verified_hours} hrs
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-panel">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription>Currently Checked In</CardDescription>
                        <Clock className="size-4 text-highlight" />
                    </CardHeader>
                    <CardContent>
                        <p className="font-mono text-2xl font-bold">
                            {summary.active_checkins}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-panel">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription>Completed Shift Logs</CardDescription>
                        <CheckCircle2 className="size-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <p className="font-mono text-2xl font-bold">
                            {summary.completed_shifts}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-panel">
                <CardContent className="space-y-4 pt-5">
                    <div className="rounded-lg border border-border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((hg) => (
                                    <TableRow key={hg.id}>
                                        {hg.headers.map((h) => (
                                            <TableHead key={h.id}>
                                                {flexRender(
                                                    h.column.columnDef.header,
                                                    h.getContext(),
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
                                            No attendance records yet.
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

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Total records: {summary.total_logs}</span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!table.getCanPreviousPage()}
                                onClick={() => table.previousPage()}
                            >
                                Previous
                            </Button>
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
        </AdminLayout>
    );
}


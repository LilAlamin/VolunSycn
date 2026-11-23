import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    CalendarDays,
    ClipboardCheck,
    Clock,
    FileArchive,
    QrCode,
    Users,
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
import { Progress } from '@/components/ui/progress';
import AdminLayout from '@/layouts/AdminLayout';

type Props = {
    kpis: {
        total_events: number;
        total_volunteers: number;
        pending_applications: number;
        accepted_volunteers: number;
        total_shifts: number;
        verified_hours: number;
        active_checkins: number;
        fill_rate: number;
    };
    recentApplications: {
        id: number;
        volunteer_name: string;
        volunteer_email: string;
        event_title: string;
        division_name: string;
        status: string;
        created_at: string;
    }[];
    isOrganizer: boolean;
};

const statusColors: Record<string, string> = {
    submitted: 'bg-secondary text-secondary-foreground',
    under_review: 'bg-warning text-warning-foreground',
    accepted: 'bg-success text-success-foreground',
    rejected: 'bg-destructive/15 text-destructive',
};

export default function Dashboard({
    kpis,
    recentApplications,
    isOrganizer,
}: Props) {
    const cards = [
        {
            label: isOrganizer ? 'Total Events' : 'Assigned Events',
            value: kpis.total_events,
            icon: CalendarDays,
            sub: `${kpis.total_shifts} scheduled shifts`,
        },
        {
            label: 'Pending Screening',
            value: kpis.pending_applications,
            icon: ClipboardCheck,
            sub: `${kpis.accepted_volunteers} accepted volunteers`,
        },
        {
            label: 'Verified Service Hours',
            value: `${kpis.verified_hours}h`,
            icon: Clock,
            sub: `${kpis.active_checkins} currently checked in`,
        },
        {
            label: 'Volunteer Pool',
            value: kpis.total_volunteers,
            icon: Users,
            sub: `${kpis.fill_rate}% division quota filled`,
        },
    ];

    return (
        <AdminLayout
            title={isOrganizer ? 'Organizer Dashboard' : 'Coordinator Dashboard'}
            subtitle="Real-time operational snapshot across recruitment, shifts, and verified attendance."
            actions={
                <Button size="sm" asChild>
                    <Link href="/admin/applications">
                        Screen Applications
                        <ArrowRight className="ml-1.5 size-4" />
                    </Link>
                </Button>
            }
        >
            <Head title="Admin Dashboard — VolunSync" />

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <Card key={card.label} className="shadow-panel">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription className="text-xs font-medium">
                                {card.label}
                            </CardDescription>
                            <card.icon className="size-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="font-mono text-2xl font-bold">
                                {card.value}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {card.sub}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Capacity & Recent Applications */}
            <div className="mt-6 grid gap-6 lg:grid-cols-12">
                <Card className="shadow-panel lg:col-span-7">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base">
                                Recent Volunteer Applications
                            </CardTitle>
                            <CardDescription>
                                Latest submissions awaiting division screening
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/applications">View All</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentApplications.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                No applications yet.
                            </p>
                        ) : (
                            recentApplications.map((app) => (
                                <div
                                    key={app.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold">
                                            {app.volunteer_name}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {app.division_name} ·{' '}
                                            {app.event_title}
                                        </p>
                                    </div>
                                    <Badge
                                        className={
                                            statusColors[app.status] ?? ''
                                        }
                                    >
                                        {app.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-5 lg:col-span-5">
                    <Card className="shadow-panel">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Division Quota Fulfillment
                            </CardTitle>
                            <CardDescription>
                                Overall accepted volunteers vs total quota
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-baseline justify-between">
                                <span className="font-mono text-2xl font-bold text-primary">
                                    {kpis.fill_rate}%
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {kpis.accepted_volunteers} accepted
                                </span>
                            </div>
                            <Progress value={kpis.fill_rate} />
                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/admin/shifts">
                                        <QrCode className="mr-1.5 size-3.5" />
                                        Manage Shifts & QR
                                    </Link>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/admin/attendance">
                                        <Clock className="mr-1.5 size-3.5" />
                                        Attendance Logs
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Priority 2 Reserved Slot */}
                    <Card className="border-dashed border-border bg-surface/60">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <BarChart3 className="size-4 text-muted-foreground" />
                                    Priority 2 Modules (Final Day)
                                </CardTitle>
                                <Badge variant="outline">Dec 16, 2026</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs text-muted-foreground">
                            <p className="flex items-center gap-2">
                                <BarChart3 className="size-3.5" />
                                Turnout & Division Fulfillment Analytics Charts
                            </p>
                            <p className="flex items-center gap-2">
                                <FileArchive className="size-3.5" />
                                Role-Protected Document Archiving Repository
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}


import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Briefcase,
    CalendarClock,
    CalendarDays,
    Compass,
    MapPin,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

type WorkspaceCardItem = {
    division_id: number;
    division_name: string;
    division_description: string | null;
    coordinator_name: string | null;
    members_count: number;
    my_shifts_count: number;
    event: {
        id: number;
        title: string;
        venue_name: string;
        organization_name: string;
        start_date: string;
        end_date: string;
        status: string;
    };
    overlapping_event_titles: string[];
};

type Props = {
    workspaces: WorkspaceCardItem[];
};

export default function Workspaces({ workspaces }: Props) {
    const hasAnyDateOverlap = workspaces.some(
        (w) => w.overlapping_event_titles.length > 0,
    );

    return (
        <VolunteerLayout
            title="My Division Workspaces"
            subtitle="Each accepted division has its own isolated workspace. Switch freely from here or from the left sidebar."
            actions={
                <Button size="sm" variant="outline" asChild>
                    <Link href="/events">
                        <Compass className="mr-1.5 size-4" />
                        Explore Events
                    </Link>
                </Button>
            }
        >
            <Head title="My Workspaces — VolunSync" />

            {hasAnyDateOverlap && (
                <Alert className="mb-6 border-warning-foreground/20 bg-warning/50 text-warning-foreground">
                    <AlertTriangle className="size-4" />
                    <AlertTitle>
                        Overlapping Event Dates Detected — Protected by Shift
                        Guard
                    </AlertTitle>
                    <AlertDescription>
                        You are accepted into multiple events whose date ranges
                        overlap. Each division workspace stays cleanly
                        separated, and VolunSync&apos;s server-side Shift
                        Conflict Guard guarantees you will never be
                        double-booked into overlapping shift hours.
                    </AlertDescription>
                </Alert>
            )}

            {workspaces.length === 0 ? (
                <Card className="shadow-panel">
                    <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                        <Briefcase className="size-10 text-primary" />
                        <div>
                            <h3 className="text-lg font-semibold">
                                No accepted divisions yet
                            </h3>
                            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                Once an Organizer or Coordinator approves your
                                application, your Division Workspace will appear
                                here and in the sidebar automatically.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button asChild>
                                <Link href="/events">Browse Open Events</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/volunteer/applications">
                                    View My Applications
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-5 md:grid-cols-2">
                    {workspaces.map((ws) => (
                        <Card
                            key={ws.division_id}
                            className="flex flex-col justify-between shadow-panel transition-colors hover:border-primary/40"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        {ws.event.organization_name}
                                    </Badge>
                                    <Badge
                                        className={
                                            ws.event.status === 'ongoing'
                                                ? 'bg-highlight text-highlight-foreground'
                                                : 'bg-soft text-soft-foreground'
                                        }
                                    >
                                        {ws.event.status}
                                    </Badge>
                                </div>
                                <CardTitle className="mt-2 text-xl">
                                    {ws.division_name}
                                </CardTitle>
                                <CardDescription className="text-sm font-medium text-foreground/80">
                                    {ws.event.title}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {ws.division_description && (
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                        {ws.division_description}
                                    </p>
                                )}

                                <div className="space-y-1.5 text-xs text-muted-foreground">
                                    <p className="flex items-center gap-1.5">
                                        <MapPin className="size-3.5 text-primary" />
                                        {ws.event.venue_name}
                                    </p>
                                    <p className="flex items-center gap-1.5">
                                        <CalendarDays className="size-3.5 text-primary" />
                                        {new Date(
                                            ws.event.start_date,
                                        ).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                        {' – '}
                                        {new Date(
                                            ws.event.end_date,
                                        ).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-xs">
                                    <span className="flex items-center gap-1.5">
                                        <Users className="size-3.5 text-primary" />
                                        <strong>{ws.members_count}</strong>{' '}
                                        peers
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <CalendarClock className="size-3.5 text-primary" />
                                        <strong>{ws.my_shifts_count}</strong>{' '}
                                        assigned shifts
                                    </span>
                                    {ws.coordinator_name && (
                                        <span className="text-muted-foreground">
                                            Lead:{' '}
                                            <strong className="text-foreground">
                                                {ws.coordinator_name}
                                            </strong>
                                        </span>
                                    )}
                                </div>

                                {ws.overlapping_event_titles.length > 0 && (
                                    <div className="flex items-start gap-2 rounded-lg border border-warning-foreground/20 bg-warning/40 px-3 py-2 text-xs text-warning-foreground">
                                        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                                        <span>
                                            Date overlaps with{' '}
                                            <strong>
                                                {ws.overlapping_event_titles.join(
                                                    ', ',
                                                )}
                                            </strong>{' '}
                                            (shift hours protected from
                                            double-booking).
                                        </span>
                                    </div>
                                )}

                                <Button className="w-full" asChild>
                                    <Link
                                        href={`/volunteer/workspace/${ws.division_id}`}
                                    >
                                        Open {ws.division_name} Workspace
                                        <ArrowRight className="ml-1.5 size-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </VolunteerLayout>
    );
}


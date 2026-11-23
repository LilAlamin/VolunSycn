import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    Compass,
    XCircle,
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
import { Progress } from '@/components/ui/progress';
import VolunteerLayout from '@/layouts/VolunteerLayout';

type ApplicationItem = {
    id: number;
    status: 'submitted' | 'under_review' | 'accepted' | 'rejected';
    motivation: string;
    reviewer_notes: string | null;
    reviewer_name: string | null;
    reviewed_at: string | null;
    created_at: string;
    event: {
        id: number;
        title: string;
        venue_name: string;
        start_date: string;
        status: string;
    };
    division: {
        id: number;
        name: string;
        coordinator_name: string | null;
    };
};

type Props = {
    applications: ApplicationItem[];
};

const stageMeta: Record<
    ApplicationItem['status'],
    { progress: number; label: string; badgeClass: string }
> = {
    submitted: {
        progress: 33,
        label: 'Submitted',
        badgeClass: 'bg-secondary text-secondary-foreground',
    },
    under_review: {
        progress: 66,
        label: 'Under Review',
        badgeClass: 'bg-warning text-warning-foreground',
    },
    accepted: {
        progress: 100,
        label: 'Accepted',
        badgeClass: 'bg-success text-success-foreground',
    },
    rejected: {
        progress: 100,
        label: 'Not Selected',
        badgeClass: 'bg-destructive/15 text-destructive',
    },
};

export default function Applications({ applications }: Props) {
    return (
        <VolunteerLayout
            title="My Applications & Live Timeline"
            subtitle="Track your selection status in real time. Accepted applications automatically unlock your division workspace."
        >
            <Head title="My Applications — VolunSync" />

            {applications.length === 0 ? (
                <Card className="shadow-panel">
                    <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                        <Compass className="size-10 text-primary" />
                        <div>
                            <h3 className="text-lg font-semibold">
                                No applications yet
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Explore open community events and apply to a
                                division that fits your skills.
                            </p>
                        </div>
                        <Button asChild>
                            <Link href="/events">Explore Open Events</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-5">
                    {applications.map((app) => {
                        const meta = stageMeta[app.status];
                        const steps = [
                            { key: 'submitted', label: 'Submitted' },
                            { key: 'under_review', label: 'Under Review' },
                            {
                                key: 'decision',
                                label:
                                    app.status === 'rejected'
                                        ? 'Not Selected'
                                        : 'Accepted',
                            },
                        ];

                        return (
                            <Card key={app.id} className="shadow-panel">
                                <CardHeader className="pb-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <CardTitle className="text-lg">
                                                {app.division.name} —{' '}
                                                {app.event.title}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {app.event.venue_name} · Applied{' '}
                                                {new Date(
                                                    app.created_at,
                                                ).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </CardDescription>
                                        </div>
                                        <Badge className={meta.badgeClass}>
                                            {app.status === 'accepted' && (
                                                <CheckCircle2 className="mr-1 size-3.5" />
                                            )}
                                            {app.status === 'rejected' && (
                                                <XCircle className="mr-1 size-3.5" />
                                            )}
                                            {(app.status === 'submitted' ||
                                                app.status ===
                                                    'under_review') && (
                                                <Clock className="mr-1 size-3.5" />
                                            )}
                                            {meta.label}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {/* Live Status Timeline */}
                                    <div className="rounded-xl border border-border bg-surface p-4">
                                        <div className="mb-2 flex items-center justify-between text-xs font-medium">
                                            {steps.map((step, idx) => {
                                                const active =
                                                    (idx === 0 && true) ||
                                                    (idx === 1 &&
                                                        app.status !==
                                                            'submitted') ||
                                                    (idx === 2 &&
                                                        (app.status ===
                                                            'accepted' ||
                                                            app.status ===
                                                                'rejected'));
                                                return (
                                                    <span
                                                        key={step.key}
                                                        className={
                                                            active
                                                                ? 'font-semibold text-foreground'
                                                                : 'text-muted-foreground'
                                                        }
                                                    >
                                                        {idx + 1}. {step.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        <Progress value={meta.progress} />
                                    </div>

                                    <div className="text-sm">
                                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Your Motivation
                                        </p>
                                        <p className="mt-1 text-muted-foreground">
                                            {app.motivation}
                                        </p>
                                    </div>

                                    {app.reviewer_notes && (
                                        <Alert>
                                            <AlertTitle>
                                                Coordinator Note
                                                {app.reviewer_name
                                                    ? ` (${app.reviewer_name})`
                                                    : ''}
                                            </AlertTitle>
                                            <AlertDescription>
                                                {app.reviewer_notes}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {app.status === 'accepted' && (
                                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-soft/60 px-4 py-3">
                                            <p className="text-sm font-medium text-soft-foreground">
                                                You have been placed in the{' '}
                                                <strong>
                                                    {app.division.name}
                                                </strong>{' '}
                                                workspace!
                                            </p>
                                            <Button size="sm" asChild>
                                                <Link
                                                    href={`/volunteer/workspace/${app.division.id}`}
                                                >
                                                    Open Division Workspace
                                                    <ArrowRight className="ml-1.5 size-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </VolunteerLayout>
    );
}

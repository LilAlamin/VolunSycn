import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    Compass,
    Download,
    ExternalLink,
    FileText,
    Globe,
    MessageSquareText,
    Phone,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
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

type ApplicationItem = {
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

const statusBadgeMap: Record<
    ApplicationItem['status'],
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

function ApplicationStepper({
    status,
}: {
    status: ApplicationItem['status'];
}) {
    const stepIndex =
        status === 'submitted'
            ? 0
            : status === 'under_review'
              ? 1
              : 2;

    const steps = [
        { label: 'Submitted', done: true },
        { label: 'Under Review', done: stepIndex >= 1 },
        {
            label: status === 'rejected' ? 'Not Selected' : 'Accepted',
            done: stepIndex >= 2,
            rejected: status === 'rejected',
        },
    ];

    return (
        <div className="flex items-center gap-2">
            {steps.map((step, idx) => (
                <div key={step.label} className="flex flex-1 items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <span
                            className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                step.rejected
                                    ? 'bg-destructive text-white'
                                    : step.done
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            {step.rejected ? '✕' : step.done ? '✓' : idx + 1}
                        </span>
                        <span
                            className={`text-xs whitespace-nowrap ${
                                step.done
                                    ? 'font-semibold text-foreground'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            {step.label}
                        </span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div
                            className={`h-0.5 flex-1 rounded-full ${
                                stepIndex > idx ? 'bg-primary' : 'bg-border'
                            }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

export default function Applications({ applications }: Props) {
    const [filter, setFilter] = useState<
        'all' | 'accepted' | 'pending' | 'rejected'
    >('all');

    const counts = useMemo(
        () => ({
            all: applications.length,
            accepted: applications.filter((a) => a.status === 'accepted')
                .length,
            pending: applications.filter(
                (a) => a.status === 'submitted' || a.status === 'under_review',
            ).length,
            rejected: applications.filter((a) => a.status === 'rejected')
                .length,
        }),
        [applications],
    );

    const filtered = useMemo(() => {
        return applications.filter((app) => {
            if (filter === 'accepted') return app.status === 'accepted';
            if (filter === 'pending')
                return (
                    app.status === 'submitted' || app.status === 'under_review'
                );
            if (filter === 'rejected') return app.status === 'rejected';
            return true;
        });
    }, [applications, filter]);

    return (
        <VolunteerLayout
            title="My Applications & Timeline"
            subtitle="Track your selection stage across every event. Accepted applications unlock their division workspace automatically."
            actions={
                <Button size="sm" variant="outline" asChild>
                    <Link href="/events">
                        <Compass className="mr-1.5 size-4" />
                        Browse More Events
                    </Link>
                </Button>
            }
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
                    {/* Filter Pill Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                        {(
                            [
                                { key: 'all', label: `All (${counts.all})` },
                                {
                                    key: 'accepted',
                                    label: `Accepted (${counts.accepted})`,
                                },
                                {
                                    key: 'pending',
                                    label: `In Progress (${counts.pending})`,
                                },
                                {
                                    key: 'rejected',
                                    label: `Not Selected (${counts.rejected})`,
                                },
                            ] as const
                        ).map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setFilter(tab.key)}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                                    filter === tab.key
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {filtered.length === 0 ? (
                        <Card>
                            <CardContent className="py-10 text-center text-sm text-muted-foreground">
                                No applications in this status filter.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {filtered.map((app) => {
                                const badge = statusBadgeMap[app.status];
                                return (
                                    <Card key={app.id} className="shadow-panel">
                                        <CardHeader className="pb-3">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <CardTitle className="text-base font-bold">
                                                            {app.division.name}
                                                        </CardTitle>
                                                        <span className="text-xs text-muted-foreground">
                                                            · {app.event.title}
                                                        </span>
                                                    </div>
                                                    <CardDescription className="mt-1 text-xs">
                                                        {app.event.venue_name} ·
                                                        Applied{' '}
                                                        {new Date(
                                                            app.created_at,
                                                        ).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            },
                                                        )}
                                                    </CardDescription>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        className={
                                                            badge.className
                                                        }
                                                    >
                                                        {app.status ===
                                                            'accepted' && (
                                                            <CheckCircle2 className="mr-1 size-3" />
                                                        )}
                                                        {app.status ===
                                                            'rejected' && (
                                                            <XCircle className="mr-1 size-3" />
                                                        )}
                                                        {(app.status ===
                                                            'submitted' ||
                                                            app.status ===
                                                                'under_review') && (
                                                            <Clock className="mr-1 size-3" />
                                                        )}
                                                        {badge.label}
                                                    </Badge>
                                                    {app.status ===
                                                        'accepted' && (
                                                        <Button
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/volunteer/workspace/${app.division.id}`}
                                                            >
                                                                Workspace
                                                                <ArrowRight className="ml-1 size-3.5" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-3 pt-0">
                                            {/* Compact 3-Step Visual Stepper */}
                                            <div className="rounded-lg border border-border bg-surface px-3.5 py-2.5">
                                                <ApplicationStepper
                                                    status={app.status}
                                                />
                                            </div>

                                            {/* Compact 2-Column Motivation & Reviewer Feedback */}
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <div className="rounded-lg border border-border/70 bg-card p-3">
                                                    <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                        Your Motivation
                                                    </p>
                                                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                                                        {app.motivation}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-border/70 bg-card p-3">
                                                    <p className="flex items-center gap-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                        <MessageSquareText className="size-3 text-primary" />
                                                        Coordinator Feedback
                                                        {app.reviewer_name
                                                            ? ` (${app.reviewer_name})`
                                                            : ''}
                                                    </p>
                                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                                        {app.reviewer_notes ||
                                                            'Waiting for coordinator screening notes.'}
                                                    </p>
                                                </div>
                                            </div>

                                            {(app.phone ||
                                                app.instagram ||
                                                app.linkedin ||
                                                app.cv_url) && (
                                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-surface/60 px-3 py-2 text-xs">
                                                    <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                                                        {app.phone && (
                                                            <span className="inline-flex items-center gap-1 font-mono">
                                                                <Phone className="size-3 text-primary" />
                                                                {app.phone}
                                                            </span>
                                                        )}
                                                        {app.instagram && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <Globe className="size-3 text-primary" />
                                                                IG:{' '}
                                                                {app.instagram}
                                                            </span>
                                                        )}
                                                        {app.linkedin && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <ExternalLink className="size-3 text-primary" />
                                                                LinkedIn:{' '}
                                                                {app.linkedin}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {app.cv_url && (
                                                        <div className="flex items-center gap-2">
                                                            <a
                                                                href={
                                                                    app.cv_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                                                            >
                                                                <FileText className="size-3.5" />
                                                                {app.cv_original_name ||
                                                                    'View CV'}
                                                            </a>
                                                            <a
                                                                href={`${app.cv_url}?download=1`}
                                                                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                                                title="Download CV"
                                                            >
                                                                <Download className="size-3.5" />
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </VolunteerLayout>
    );
}

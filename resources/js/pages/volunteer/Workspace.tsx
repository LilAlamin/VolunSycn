import { Head, Link, router, useForm } from '@inertiajs/react';
import { Html5Qrcode } from 'html5-qrcode';
import {
    Award,
    CalendarClock,
    Camera,
    CameraOff,
    CheckCircle2,
    FileArchive,
    FileText,
    FolderLock,
    Globe,
    LocateFixed,
    Mail,
    MapPin,
    Megaphone,
    Phone,
    Pin,
    QrCode,
    Search,
    Users,
    WifiOff,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VenueMap } from '@/components/venue-map';
import VolunteerLayout from '@/layouts/VolunteerLayout';
import { detectUserCoordinates } from '@/lib/geolocation';

type ShiftRow = {
    id: number;
    title: string;
    description: string | null;
    location: string | null;
    start_time: string;
    end_time: string;
    is_assigned_to_me: boolean;
    qr_token: string | null;
    volunteers: { id: number; name: string }[];
    my_attendance: {
        status: string;
        checked_in_at: string | null;
        checked_out_at: string | null;
        verification_method?: string;
        verified_hours: number;
    } | null;
};

type DocumentRow = {
    id: number;
    title: string;
    mime_type: string;
    file_size: number;
    visibility: 'event_all' | 'division_only' | 'organizers_only';
    uploader_name: string;
    created_at: string | null;
};

type AnnouncementRow = {
    id: number;
    title: string;
    body: string;
    is_pinned: boolean;
    scope: 'event_wide' | 'division_only';
    author_name: string;
    created_at: string | null;
};

type Props = {
    division: {
        id: number;
        name: string;
        description: string | null;
        announcements: string | null;
        quota: number;
        event: {
            id: number;
            title: string;
            venue_name: string;
            venue_lat: number;
            venue_lng: number;
            checkin_radius_meters: number;
            organization_name?: string;
            start_date: string;
            end_date: string;
            status: string;
        };
        coordinator: {
            id: number;
            name: string;
            email: string;
            phone: string | null;
            bio: string | null;
        } | null;
    };
    announcements?: AnnouncementRow[];
    members: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        bio: string | null;
        is_me: boolean;
    }[];
    shifts: ShiftRow[];
    divisionVerifiedHours: number;
    documents: DocumentRow[];
};

const getInitials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

export default function Workspace({
    division,
    announcements = [],
    members,
    shifts,
    divisionVerifiedHours,
    documents,
}: Props) {
    const [activeTab, setActiveTab] = useState('overview');

    // Scoped QR + Geolocation Check-In state (lives inside this Division Workspace!)
    const [scanning, setScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [gpsStatus, setGpsStatus] = useState<
        'idle' | 'locating' | 'locked' | 'error'
    >('idle');
    const [gpsMessage, setGpsMessage] = useState<string>(
        `Verify proximity within ${division.event.checkin_radius_meters}m of ${division.event.venue_name}.`,
    );
    const [isOffline, setIsOffline] = useState(
        typeof navigator !== 'undefined' ? !navigator.onLine : false,
    );
    const scannerRef = useRef<Html5Qrcode | null>(null);

    // Document Archive filter state (scoped per Event vs per Division)
    const [docScope, setDocScope] = useState<
        'all' | 'event_all' | 'division_only'
    >('all');
    const [docSearch, setDocSearch] = useState('');

    const checkInForm = useForm({
        qr_token: '',
        lat: '',
        lng: '',
    });

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(() => undefined);
            }
        };
    }, []);

    // Stop camera automatically if user switches away from Shifts & QR tab
    useEffect(() => {
        if (activeTab !== 'shifts' && scannerRef.current?.isScanning) {
            scannerRef.current.stop().catch(() => undefined);
            setScanning(false);
        }
    }, [activeTab]);

    const myShifts = useMemo(
        () => shifts.filter((s) => s.is_assigned_to_me),
        [shifts],
    );

    const filteredDocs = useMemo(() => {
        return documents.filter((doc) => {
            if (docScope !== 'all' && doc.visibility !== docScope) {
                return false;
            }
            if (docSearch.trim()) {
                return doc.title
                    .toLowerCase()
                    .includes(docSearch.trim().toLowerCase());
            }
            return true;
        });
    }, [documents, docScope, docSearch]);

    const captureLocation = async () => {
        setGpsStatus('locating');
        setGpsMessage('Detecting your GPS coordinates...');
        try {
            const loc = await detectUserCoordinates();
            checkInForm.setData((prev) => ({
                ...prev,
                lat: String(loc.lat),
                lng: String(loc.lng),
            }));
            setGpsStatus('locked');
            setGpsMessage(loc.label);
        } catch (err) {
            setGpsStatus('error');
            setGpsMessage(
                err instanceof Error
                    ? err.message
                    : 'Unable to detect GPS coordinates.',
            );
        }
    };

    // Auto-detect GPS when volunteer opens Shifts & QR Check-In tab
    useEffect(() => {
        if (
            activeTab === 'shifts' &&
            gpsStatus === 'idle' &&
            !checkInForm.data.lat &&
            !checkInForm.data.lng
        ) {
            void captureLocation();
        }
    }, [activeTab]);

    const startScanner = async () => {
        setCameraError(null);
        try {
            const readerId = `volunsync-qr-reader-div-${division.id}`;
            const scanner = new Html5Qrcode(readerId);
            scannerRef.current = scanner;
            setScanning(true);
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 210, height: 210 } },
                (decodedText) => {
                    checkInForm.setData('qr_token', decodedText.trim());
                    scanner.stop().catch(() => undefined);
                    setScanning(false);
                },
                () => undefined,
            );
        } catch (err) {
            setScanning(false);
            setCameraError(
                err instanceof Error
                    ? err.message
                    : 'Unable to access camera. Enter your shift QR code manually below.',
            );
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop().catch(() => undefined);
        }
        setScanning(false);
    };

    const handleCheckIn = (e: FormEvent) => {
        e.preventDefault();
        if (isOffline) {
            localStorage.setItem(
                `volunsync_pending_checkin_${division.id}`,
                JSON.stringify({
                    ...checkInForm.data,
                    savedAt: new Date().toISOString(),
                }),
            );
            return;
        }
        checkInForm.post('/volunteer/check-in', {
            preserveScroll: true,
        });
    };

    const handleCheckOut = (shiftId: number) => {
        router.post(
            `/volunteer/check-out/${shiftId}`,
            {},
            { preserveScroll: true },
        );
    };

    const autofillShiftDemo = (shift: ShiftRow) => {
        if (!shift.qr_token) return;
        checkInForm.setData({
            qr_token: shift.qr_token,
            lat: division.event.venue_lat.toFixed(6),
            lng: division.event.venue_lng.toFixed(6),
        });
        setGpsStatus('locked');
        setGpsMessage(
            `Simulated on-site GPS at ${division.event.venue_name} (${division.event.venue_lat.toFixed(5)}, ${division.event.venue_lng.toFixed(5)})`,
        );
    };

    // Priority 2 preview blueprint items showing clear Event-Wide vs Division-Only archive separation
    const plannedArchiveExamples = [
        {
            scope: 'event_all' as const,
            title: `${division.event.title} — Official Event Guidebook & Venue Map`,
            meta: 'Event-Wide · Visible to all accepted volunteers in this event',
        },
        {
            scope: 'event_all' as const,
            title: 'Emergency SOP, Venue Check-In Radius & Contact Directory',
            meta: 'Event-Wide · Uploaded by Event Organizer',
        },
        {
            scope: 'division_only' as const,
            title: `${division.name} — Operational Playbook & Shift Handover Notes`,
            meta: `Division-Only · Scoped exclusively to ${division.name}`,
        },
        {
            scope: 'division_only' as const,
            title: `${division.name} — Pre-Event Briefing & Meeting Minutes`,
            meta: `Division-Only · Uploaded by ${division.coordinator?.name ?? 'Division Coordinator'}`,
        },
    ].filter((item) => docScope === 'all' || item.scope === docScope);

    return (
        <VolunteerLayout
            title={`${division.name} Workspace`}
            subtitle={`${division.event.title} · ${division.event.venue_name}`}
            actions={
                <Button size="sm" variant="outline" asChild>
                    <Link href="/volunteer/workspaces">All Workspaces</Link>
                </Button>
            }
        >
            <Head title={`${division.name} Workspace — VolunSync`} />

            {/* Event Context Banner so multi-event volunteers ALWAYS know which event they're in */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-brand text-brand-foreground">
                        {division.event.organization_name ?? 'Organization'}
                    </Badge>
                    <span className="font-semibold text-foreground">
                        {division.event.title}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="size-3.5 text-primary" />
                        {division.event.venue_name} (
                        {division.event.checkin_radius_meters}m geofence)
                    </span>
                </div>
                <span className="flex items-center gap-1.5 font-mono font-semibold text-primary">
                    <Award className="size-3.5" />
                    {divisionVerifiedHours}h in this division
                </span>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-5"
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <TabsList className="flex h-auto flex-wrap justify-start">
                        <TabsTrigger value="overview">
                            <Megaphone className="size-4" />
                            Overview & Briefings
                        </TabsTrigger>
                        <TabsTrigger value="directory">
                            <Users className="size-4" />
                            Peer Directory ({members.length})
                        </TabsTrigger>
                        <TabsTrigger value="shifts">
                            <QrCode className="size-4" />
                            Shifts & QR Check-In ({shifts.length})
                        </TabsTrigger>
                        <TabsTrigger value="documents">
                            <FileArchive className="size-4" />
                            Documents
                            <Badge
                                variant="outline"
                                className="ml-1 px-1.5 py-0 text-[10px]"
                            >
                                P2
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    {activeTab !== 'shifts' && (
                        <Button
                            size="sm"
                            onClick={() => setActiveTab('shifts')}
                        >
                            <QrCode className="mr-1.5 size-4" />
                            Check In for {division.name}
                        </Button>
                    )}
                </div>

                {/* TAB 1: Overview & Coordinator Contact */}
                <TabsContent
                    value="overview"
                    className="grid gap-5 lg:grid-cols-3"
                >
                    <Card className="shadow-panel lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Megaphone className="size-5 text-highlight" />
                                Division Announcements & Briefing
                            </CardTitle>
                            <CardDescription>
                                Latest operational instructions specifically for{' '}
                                <strong>{division.name}</strong>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {announcements.length > 0 ? (
                                <div className="space-y-3">
                                    {announcements.map((ann) => (
                                        <div
                                            key={ann.id}
                                            className={`rounded-xl border p-4 ${
                                                ann.is_pinned
                                                    ? 'border-primary/40 bg-primary/5'
                                                    : 'border-border bg-surface'
                                            }`}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {ann.is_pinned && (
                                                        <Badge className="bg-primary text-[10px] text-primary-foreground">
                                                            <Pin className="mr-1 size-2.5" />
                                                            Pinned
                                                        </Badge>
                                                    )}
                                                    <Badge
                                                        variant={
                                                            ann.scope ===
                                                            'event_wide'
                                                                ? 'secondary'
                                                                : 'outline'
                                                        }
                                                        className="text-[10px]"
                                                    >
                                                        {ann.scope ===
                                                        'event_wide'
                                                            ? 'Event-Wide'
                                                            : division.name}
                                                    </Badge>
                                                </div>
                                                <span className="text-[11px] text-muted-foreground">
                                                    {ann.author_name}
                                                    {ann.created_at
                                                        ? ` · ${new Date(
                                                              ann.created_at,
                                                          ).toLocaleDateString(
                                                              'en-US',
                                                              {
                                                                  month: 'short',
                                                                  day: 'numeric',
                                                                  hour: '2-digit',
                                                                  minute: '2-digit',
                                                              },
                                                          )}`
                                                        : ''}
                                                </span>
                                            </div>
                                            <h4 className="mt-2 text-sm font-semibold text-foreground">
                                                {ann.title}
                                            </h4>
                                            <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                                                {ann.body}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-primary/20 bg-surface p-4 text-sm leading-relaxed">
                                    {division.announcements ||
                                        'No announcements posted yet. Check back before event day!'}
                                </div>
                            )}
                            {division.description && (
                                <div>
                                    <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Division Mandate
                                    </h4>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {division.description}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-panel">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Division Coordinator
                            </CardTitle>
                            <CardDescription>
                                Primary contact for on-site questions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {division.coordinator ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-12">
                                            <AvatarFallback className="bg-brand font-semibold text-brand-foreground">
                                                {getInitials(
                                                    division.coordinator.name,
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">
                                                {division.coordinator.name}
                                            </p>
                                            <Badge variant="secondary">
                                                Coordinator
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p className="flex items-center gap-2">
                                            <Mail className="size-4 text-primary" />
                                            {division.coordinator.email}
                                        </p>
                                        {division.coordinator.phone && (
                                            <p className="flex items-center gap-2">
                                                <Phone className="size-4 text-primary" />
                                                {division.coordinator.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Coordinator assignment pending.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: Peer Directory */}
                <TabsContent value="directory">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {members.map((member) => (
                            <Card key={member.id} className="shadow-panel">
                                <CardContent className="flex items-start gap-3 pt-5">
                                    <Avatar className="size-10 shrink-0">
                                        <AvatarFallback className="bg-soft text-xs font-semibold text-soft-foreground">
                                            {getInitials(member.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate font-semibold">
                                                {member.name}
                                            </p>
                                            {member.is_me && (
                                                <Badge className="bg-soft text-[10px] text-soft-foreground">
                                                    You
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                                            <a
                                                href={`mailto:${member.email}`}
                                                className="flex items-center gap-1.5 hover:text-primary hover:underline"
                                            >
                                                <Mail className="size-3.5 shrink-0 text-primary" />
                                                <span className="truncate">
                                                    {member.email}
                                                </span>
                                            </a>
                                            {member.phone ? (
                                                <a
                                                    href={`tel:${member.phone}`}
                                                    className="flex items-center gap-1.5 font-mono hover:text-primary hover:underline"
                                                >
                                                    <Phone className="size-3.5 shrink-0 text-primary" />
                                                    <span className="truncate">
                                                        {member.phone}
                                                    </span>
                                                </a>
                                            ) : (
                                                <p className="flex items-center gap-1.5 text-muted-foreground/70">
                                                    <Phone className="size-3.5 shrink-0" />
                                                    <span>No phone number</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* TAB 3: Scoped Shifts & On-Site QR + GPS Check-In */}
                <TabsContent value="shifts" className="space-y-5">
                    {isOffline && (
                        <Alert variant="destructive">
                            <WifiOff className="size-4" />
                            <AlertTitle>Low / Offline Connectivity</AlertTitle>
                            <AlertDescription>
                                Check-in payload will be cached locally on your
                                device until signal returns.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-6 lg:grid-cols-12">
                        {/* Left: Division Shift Roster */}
                        <div className="space-y-4 lg:col-span-7">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold">
                                    {division.name} Shift Schedule (
                                    {shifts.length})
                                </h3>
                                <Badge variant="outline" className="font-mono text-xs">
                                    {myShifts.length} assigned to you
                                </Badge>
                            </div>

                            {shifts.length === 0 ? (
                                <Card>
                                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                                        No shifts scheduled for {division.name}{' '}
                                        yet.
                                    </CardContent>
                                </Card>
                            ) : (
                                shifts.map((shift) => (
                                    <Card
                                        key={shift.id}
                                        className={
                                            shift.is_assigned_to_me
                                                ? 'border-primary/40 shadow-panel'
                                                : 'shadow-panel'
                                        }
                                    >
                                        <CardHeader className="pb-2">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <CardTitle className="text-base">
                                                    {shift.title}
                                                </CardTitle>
                                                <div className="flex items-center gap-1.5">
                                                    {shift.is_assigned_to_me && (
                                                        <Badge className="bg-brand text-brand-foreground">
                                                            Assigned to You
                                                        </Badge>
                                                    )}
                                                    {shift.my_attendance && (
                                                        <Badge
                                                            className={
                                                                shift
                                                                    .my_attendance
                                                                    .status ===
                                                                'completed'
                                                                    ? 'bg-success text-success-foreground'
                                                                    : 'bg-highlight text-highlight-foreground'
                                                            }
                                                        >
                                                            {shift.my_attendance
                                                                .status ===
                                                            'completed'
                                                                ? `Verified ${shift.my_attendance.verified_hours}h`
                                                                : 'Checked In'}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <CardDescription className="flex flex-wrap gap-3 text-xs">
                                                <span className="flex items-center gap-1">
                                                    <CalendarClock className="size-3.5 text-primary" />
                                                    {new Date(
                                                        shift.start_time,
                                                    ).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                    {' – '}
                                                    {new Date(
                                                        shift.end_time,
                                                    ).toLocaleTimeString(
                                                        'en-US',
                                                        {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )}
                                                </span>
                                                {shift.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="size-3.5" />
                                                        {shift.location}
                                                    </span>
                                                )}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3 pt-2">
                                            <div className="flex flex-wrap gap-1.5">
                                                {shift.volunteers.map((vol) => (
                                                    <Badge
                                                        key={vol.id}
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        {vol.name}
                                                    </Badge>
                                                ))}
                                            </div>

                                            {shift.is_assigned_to_me && (
                                                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                                                    {!shift.my_attendance && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                autofillShiftDemo(
                                                                    shift,
                                                                )
                                                            }
                                                        >
                                                            Autofill Venue GPS +
                                                            Token (Demo)
                                                        </Button>
                                                    )}
                                                    {shift.my_attendance
                                                        ?.status ===
                                                        'checked_in' && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleCheckOut(
                                                                    shift.id,
                                                                )
                                                            }
                                                        >
                                                            Check Out & Log
                                                            Hours
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>

                        {/* Right: Scoped On-Site QR + GPS Check-In Panel */}
                        <Card className="h-fit shadow-panel lg:col-span-5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <QrCode className="size-5 text-primary" />
                                    QR & GPS Check-In ({division.name})
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Venue: {division.event.venue_name} (
                                    {division.event.checkin_radius_meters}m
                                    radius)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="overflow-hidden rounded-xl border border-border bg-surface p-3">
                                    <div
                                        id={`volunsync-qr-reader-div-${division.id}`}
                                        className="mx-auto min-h-36 w-full max-w-xs overflow-hidden rounded-lg bg-muted/60"
                                    />
                                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                                        {!scanning ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={startScanner}
                                            >
                                                <Camera className="mr-1.5 size-4" />
                                                Scan QR
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={stopScanner}
                                            >
                                                <CameraOff className="mr-1.5 size-4" />
                                                Stop Camera
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            disabled={gpsStatus === 'locating'}
                                            onClick={() => void captureLocation()}
                                        >
                                            <LocateFixed className="mr-1.5 size-4" />
                                            {gpsStatus === 'locating'
                                                ? 'Detecting...'
                                                : 'Refresh GPS'}
                                        </Button>
                                    </div>
                                    {cameraError && (
                                        <p className="mt-2 text-center text-xs text-destructive">
                                            {cameraError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-center text-xs text-muted-foreground">
                                        {gpsMessage}
                                    </p>
                                </div>

                                <VenueMap
                                    mode="checkin"
                                    venueLat={division.event.venue_lat}
                                    venueLng={division.event.venue_lng}
                                    radiusMeters={
                                        division.event.checkin_radius_meters
                                    }
                                    venueName={division.event.venue_name}
                                    userLat={
                                        checkInForm.data.lat
                                            ? Number(checkInForm.data.lat)
                                            : null
                                    }
                                    userLng={
                                        checkInForm.data.lng
                                            ? Number(checkInForm.data.lng)
                                            : null
                                    }
                                    heightClass="h-44"
                                />

                                <form
                                    onSubmit={handleCheckIn}
                                    className="space-y-3"
                                >
                                    <div className="space-y-1">
                                        <Label htmlFor="ws_qr_token">
                                            Shift QR Token
                                        </Label>
                                        <Input
                                            id="ws_qr_token"
                                            required
                                            className="font-mono text-xs"
                                            placeholder="e.g. VS-A1B2C3D4E5"
                                            value={checkInForm.data.qr_token}
                                            onChange={(e) =>
                                                checkInForm.setData(
                                                    'qr_token',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {checkInForm.errors.qr_token && (
                                            <p className="text-xs text-destructive">
                                                {checkInForm.errors.qr_token}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div className="space-y-1">
                                            <Label htmlFor="ws_lat">
                                                Latitude
                                            </Label>
                                            <Input
                                                id="ws_lat"
                                                className="font-mono text-xs"
                                                placeholder={division.event.venue_lat.toFixed(
                                                    5,
                                                )}
                                                value={checkInForm.data.lat}
                                                onChange={(e) =>
                                                    checkInForm.setData(
                                                        'lat',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="ws_lng">
                                                Longitude
                                            </Label>
                                            <Input
                                                id="ws_lng"
                                                className="font-mono text-xs"
                                                placeholder={division.event.venue_lng.toFixed(
                                                    5,
                                                )}
                                                value={checkInForm.data.lng}
                                                onChange={(e) =>
                                                    checkInForm.setData(
                                                        'lng',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    {(
                                        checkInForm.errors as Record<
                                            string,
                                            string
                                        >
                                    ).location && (
                                        <Alert variant="destructive">
                                            <AlertTitle>
                                                Outside Venue Geofence
                                            </AlertTitle>
                                            <AlertDescription>
                                                {
                                                    (
                                                        checkInForm.errors as Record<
                                                            string,
                                                            string
                                                        >
                                                    ).location
                                                }
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={checkInForm.processing}
                                    >
                                        <CheckCircle2 className="mr-1.5 size-4" />
                                        {checkInForm.processing
                                            ? 'Verifying...'
                                            : gpsStatus === 'locked'
                                              ? 'Verify QR + GPS & Check In'
                                              : 'Check In with QR Token'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 4: Scoped Document Archive (Priority 2 Ready — Per Event & Per Division) */}
                <TabsContent value="documents" className="space-y-5">
                    <Card className="shadow-panel">
                        <CardHeader className="border-b border-border pb-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <FileArchive className="size-4 text-primary" />
                                        Document Archive — {division.name}
                                    </CardTitle>
                                    <CardDescription className="mt-1 text-xs">
                                        Automatically scoped to{' '}
                                        <strong>{division.event.title}</strong>{' '}
                                        (Event-Wide) and{' '}
                                        <strong>{division.name}</strong>{' '}
                                        (Division-Only) so files from different
                                        events or divisions never mix.
                                    </CardDescription>
                                </div>
                                <Badge variant="outline">
                                    Priority 2 · Final Day (Dec 16, 2026)
                                </Badge>
                            </div>

                            {/* Search + Scope Filter Pills */}
                            <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div className="relative w-full sm:max-w-xs">
                                    <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        placeholder="Search division or event docs..."
                                        value={docSearch}
                                        onChange={(e) =>
                                            setDocSearch(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {(
                                        [
                                            {
                                                key: 'all',
                                                label: 'All Scoped Docs',
                                            },
                                            {
                                                key: 'event_all',
                                                label: 'Event-Wide',
                                            },
                                            {
                                                key: 'division_only',
                                                label: `${division.name} Only`,
                                            },
                                        ] as const
                                    ).map((pill) => (
                                        <button
                                            key={pill.key}
                                            type="button"
                                            onClick={() =>
                                                setDocScope(pill.key)
                                            }
                                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                docScope === pill.key
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'border border-border bg-surface text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {pill.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4 pt-5">
                            {filteredDocs.length > 0 ? (
                                <div className="divide-y divide-border rounded-xl border border-border">
                                    {filteredDocs.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex flex-wrap items-center justify-between gap-3 p-4"
                                        >
                                            <div className="flex items-start gap-3">
                                                <FileText className="mt-0.5 size-4 text-primary" />
                                                <div>
                                                    <p className="text-sm font-semibold">
                                                        {doc.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Uploaded by{' '}
                                                        {doc.uploader_name} ·{' '}
                                                        {Math.max(
                                                            1,
                                                            Math.round(
                                                                doc.file_size /
                                                                    1024,
                                                            ),
                                                        )}{' '}
                                                        KB
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge
                                                className={
                                                    doc.visibility ===
                                                    'division_only'
                                                        ? 'bg-soft text-soft-foreground'
                                                        : 'bg-secondary text-secondary-foreground'
                                                }
                                            >
                                                {doc.visibility ===
                                                'division_only' ? (
                                                    <FolderLock className="mr-1 size-3" />
                                                ) : (
                                                    <Globe className="mr-1 size-3" />
                                                )}
                                                {doc.visibility ===
                                                'division_only'
                                                    ? `${division.name} Only`
                                                    : 'Event-Wide'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Alert className="border-dashed bg-surface">
                                        <FileArchive className="size-4 text-primary" />
                                        <AlertTitle>
                                            Role-Protected Document Repository
                                            (Priority 2 Slot Ready)
                                        </AlertTitle>
                                        <AlertDescription className="text-xs">
                                            Database schema (
                                            <code>documents.event_id</code>,{' '}
                                            <code>documents.division_id</code>,{' '}
                                            <code>documents.visibility</code>)
                                            and workspace scoping are already in
                                            place. Upload & secure Laravel
                                            Storage downloads will be enabled in
                                            the Priority 2 Final Day session.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="divide-y divide-border rounded-xl border border-dashed border-border bg-surface/50">
                                        {plannedArchiveExamples.map((ex) => (
                                            <div
                                                key={ex.title}
                                                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 opacity-75"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <FileText className="mt-0.5 size-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {ex.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {ex.meta}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className="text-[11px]"
                                                >
                                                    {ex.scope ===
                                                    'division_only' ? (
                                                        <FolderLock className="mr-1 size-3" />
                                                    ) : (
                                                        <Globe className="mr-1 size-3" />
                                                    )}
                                                    {ex.scope ===
                                                    'division_only'
                                                        ? `${division.name} Only`
                                                        : 'Event-Wide'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </VolunteerLayout>
    );
}

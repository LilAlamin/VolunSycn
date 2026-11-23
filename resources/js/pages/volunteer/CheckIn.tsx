import { Head, router, useForm } from '@inertiajs/react';
import { Html5Qrcode } from 'html5-qrcode';
import {
    Award,
    Camera,
    CameraOff,
    CheckCircle2,
    Clock,
    LocateFixed,
    MapPin,
    QrCode,
    WifiOff,
} from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VenueMap } from '@/components/venue-map';
import VolunteerLayout from '@/layouts/VolunteerLayout';

type AssignedShift = {
    id: number;
    title: string;
    location: string | null;
    start_time: string;
    end_time: string;
    qr_token: string;
    division_name: string;
    event: {
        id: number;
        title: string;
        venue_name: string;
        venue_lat: number;
        venue_lng: number;
        checkin_radius_meters: number;
    };
    attendance: {
        id: number;
        status: 'checked_in' | 'completed' | 'flagged';
        checked_in_at: string | null;
        checked_out_at: string | null;
        verification_method: string;
        verified_hours: number;
    } | null;
};

type Props = {
    assignedShifts: AssignedShift[];
    totalVerifiedHours: number;
};

export default function CheckIn({ assignedShifts, totalVerifiedHours }: Props) {
    const [scanning, setScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [gpsStatus, setGpsStatus] = useState<
        'idle' | 'locating' | 'locked' | 'error'
    >('idle');
    const [gpsMessage, setGpsMessage] = useState<string>(
        'Tap "Capture GPS" to verify proximity to the venue.',
    );
    const [isOffline, setIsOffline] = useState(
        typeof navigator !== 'undefined' ? !navigator.onLine : false,
    );

    const scannerRef = useRef<Html5Qrcode | null>(null);

    const form = useForm<{
        qr_token: string;
        lat: string;
        lng: string;
    }>({
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

    const captureLocation = () => {
        if (!navigator.geolocation) {
            setGpsStatus('error');
            setGpsMessage('Geolocation is not supported by this browser.');
            return;
        }
        setGpsStatus('locating');
        setGpsMessage('Acquiring GPS coordinates...');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude.toFixed(6);
                const lng = pos.coords.longitude.toFixed(6);
                form.setData((prev) => ({ ...prev, lat, lng }));
                setGpsStatus('locked');
                setGpsMessage(
                    `GPS locked: ${lat}, ${lng} (±${Math.round(pos.coords.accuracy)}m)`,
                );
            },
            (err) => {
                setGpsStatus('error');
                setGpsMessage(`GPS unavailable: ${err.message}`);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    const startScanner = async () => {
        setCameraError(null);
        try {
            const scanner = new Html5Qrcode('volunsync-qr-reader');
            scannerRef.current = scanner;
            setScanning(true);
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 220, height: 220 } },
                (decodedText) => {
                    form.setData('qr_token', decodedText.trim());
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
                    : 'Unable to access camera. You can enter the shift QR code manually below.',
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
                'volunsync_pending_checkin',
                JSON.stringify({
                    ...form.data,
                    savedAt: new Date().toISOString(),
                }),
            );
            return;
        }
        form.post('/volunteer/check-in', {
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

    const useVenueDemoCoordinates = (shift: AssignedShift) => {
        form.setData({
            qr_token: shift.qr_token,
            lat: shift.event.venue_lat.toFixed(6),
            lng: shift.event.venue_lng.toFixed(6),
        });
        setGpsStatus('locked');
        setGpsMessage(
            `Simulated on-site GPS at ${shift.event.venue_name} (${shift.event.venue_lat.toFixed(5)}, ${shift.event.venue_lng.toFixed(5)})`,
        );
    };

    return (
        <VolunteerLayout
            title="On-Site QR & Geolocation Check-In"
            subtitle="Scan your division shift QR code and verify venue proximity to log verified volunteer service hours."
        >
            <Head title="QR Check-In — VolunSync" />

            {isOffline && (
                <Alert variant="destructive" className="mb-5">
                    <WifiOff className="size-4" />
                    <AlertTitle>Low / Offline Venue Connectivity</AlertTitle>
                    <AlertDescription>
                        Your check-in payload will be cached locally on this
                        device and can be retried as soon as signal returns.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left: Scanner + GPS Form */}
                <Card className="shadow-panel lg:col-span-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="size-5 text-primary" />
                            Shift Check-In Verification
                        </CardTitle>
                        <CardDescription>
                            Scan the QR displayed by your Coordinator and attach
                            your GPS location.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Camera QR Viewport */}
                        <div className="overflow-hidden rounded-xl border border-border bg-surface p-3">
                            <div
                                id="volunsync-qr-reader"
                                className="mx-auto min-h-44 w-full max-w-xs overflow-hidden rounded-lg bg-muted/60"
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
                                        Start Camera Scanner
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
                                    onClick={captureLocation}
                                >
                                    <LocateFixed className="mr-1.5 size-4" />
                                    Capture GPS
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

                        {assignedShifts[0] && (
                            <VenueMap
                                mode="checkin"
                                venueLat={assignedShifts[0].event.venue_lat}
                                venueLng={assignedShifts[0].event.venue_lng}
                                radiusMeters={
                                    assignedShifts[0].event
                                        .checkin_radius_meters
                                }
                                venueName={assignedShifts[0].event.venue_name}
                                userLat={
                                    form.data.lat ? Number(form.data.lat) : null
                                }
                                userLng={
                                    form.data.lng ? Number(form.data.lng) : null
                                }
                                heightClass="h-44"
                            />
                        )}

                        <form onSubmit={handleCheckIn} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="qr_token">Shift QR Token</Label>
                                <Input
                                    id="qr_token"
                                    required
                                    className="font-mono"
                                    placeholder="e.g. VS-A1B2C3D4E5"
                                    value={form.data.qr_token}
                                    onChange={(e) =>
                                        form.setData('qr_token', e.target.value)
                                    }
                                />
                                {form.errors.qr_token && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.qr_token}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="lat">Latitude</Label>
                                    <Input
                                        id="lat"
                                        className="font-mono text-xs"
                                        placeholder="-6.886800"
                                        value={form.data.lat}
                                        onChange={(e) =>
                                            form.setData('lat', e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="lng">Longitude</Label>
                                    <Input
                                        id="lng"
                                        className="font-mono text-xs"
                                        placeholder="107.608500"
                                        value={form.data.lng}
                                        onChange={(e) =>
                                            form.setData('lng', e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            {(form.errors as Record<string, string>)
                                .location && (
                                <Alert variant="destructive">
                                    <AlertTitle>
                                        Outside Check-In Radius
                                    </AlertTitle>
                                    <AlertDescription>
                                        {
                                            (
                                                form.errors as Record<
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
                                disabled={form.processing}
                            >
                                <CheckCircle2 className="mr-2 size-4" />
                                {form.processing
                                    ? 'Verifying...'
                                    : gpsStatus === 'locked'
                                      ? 'Verify QR + GPS & Check In'
                                      : 'Check In with QR Token'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Right: Verified Hours Summary + Assigned Shifts */}
                <div className="space-y-5 lg:col-span-6">
                    <Card className="border-primary/25 bg-soft/40 shadow-panel">
                        <CardContent className="flex items-center justify-between py-5">
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Total Verified Service Hours
                                </p>
                                <p className="mt-1 font-mono text-3xl font-bold text-primary">
                                    {totalVerifiedHours} hrs
                                </p>
                            </div>
                            <div className="flex size-12 items-center justify-center rounded-xl bg-brand text-brand-foreground">
                                <Award className="size-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-panel">
                        <CardHeader>
                            <CardTitle className="text-base">
                                My Assigned Shifts ({assignedShifts.length})
                            </CardTitle>
                            <CardDescription>
                                Check out once your shift ends to automatically
                                compute verified service hours.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {assignedShifts.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    You have no assigned shifts yet.
                                </p>
                            ) : (
                                assignedShifts.map((shift) => (
                                    <div
                                        key={shift.id}
                                        className="rounded-xl border border-border bg-surface p-4"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="font-semibold">
                                                    {shift.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {shift.event.title} ·{' '}
                                                    {shift.division_name}
                                                </p>
                                            </div>
                                            {shift.attendance ? (
                                                <Badge
                                                    className={
                                                        shift.attendance
                                                            .status ===
                                                        'completed'
                                                            ? 'bg-success text-success-foreground'
                                                            : 'bg-highlight text-highlight-foreground'
                                                    }
                                                >
                                                    {shift.attendance.status ===
                                                    'completed'
                                                        ? `Verified ${shift.attendance.verified_hours}h`
                                                        : 'Checked In'}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    Not Checked In
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="size-3.5" />
                                                {new Date(
                                                    shift.start_time,
                                                ).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="size-3.5" />
                                                {shift.event.venue_name}
                                            </span>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {!shift.attendance && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        useVenueDemoCoordinates(
                                                            shift,
                                                        )
                                                    }
                                                >
                                                    Autofill Venue GPS + Token
                                                    (Demo)
                                                </Button>
                                            )}
                                            {shift.attendance?.status ===
                                                'checked_in' && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleCheckOut(shift.id)
                                                    }
                                                >
                                                    Check Out & Log Hours
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </VolunteerLayout>
    );
}

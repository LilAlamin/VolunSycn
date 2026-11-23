import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarClock,
    MapPin,
    Plus,
    QrCode,
    Trash2,
    UserPlus,
    X,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/AdminLayout';

type VolunteerLite = {
    id: number;
    name: string;
    email: string;
};

type ShiftItem = {
    id: number;
    event_id: number;
    division_id: number;
    title: string;
    description: string | null;
    location: string | null;
    start_time: string;
    end_time: string;
    qr_token: string;
    qr_svg: string;
    event_title: string;
    division_name: string;
    volunteers: VolunteerLite[];
    checked_in_count: number;
};

type DivisionOption = {
    id: number;
    event_id: number;
    name: string;
    event_title: string;
    accepted_volunteers: VolunteerLite[];
};

type Props = {
    shifts: ShiftItem[];
    divisions: DivisionOption[];
};

export default function ShiftsIndex({ shifts, divisions }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [qrShift, setQrShift] = useState<ShiftItem | null>(null);
    const [assignShift, setAssignShift] = useState<ShiftItem | null>(null);

    const createForm = useForm({
        division_id: divisions[0] ? String(divisions[0].id) : '',
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
    });

    const assignForm = useForm({
        user_id: '',
    });

    const handleCreateShift = (e: FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/shifts', {
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset('title', 'description', 'start_time', 'end_time', 'location');
            },
        });
    };

    const openAssignDialog = (shift: ShiftItem) => {
        setAssignShift(shift);
        assignForm.setData('user_id', '');
        assignForm.clearErrors();
    };

    const handleAssign = (e: FormEvent) => {
        e.preventDefault();
        if (!assignShift) return;
        assignForm.post(`/admin/shifts/${assignShift.id}/assign`, {
            preserveScroll: true,
            onSuccess: () => {
                setAssignShift(null);
                assignForm.reset();
            },
        });
    };

    const activeDivisionForAssign = divisions.find(
        (d) => d.id === assignShift?.division_id,
    );

    return (
        <AdminLayout
            title="Shift Scheduling & QR Codes"
            subtitle="Schedule division shifts with server-enforced zero-overlap validation and display check-in QR codes."
            actions={
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-1.5 size-4" />
                    New Shift
                </Button>
            }
        >
            <Head title="Shifts & QR Codes — VolunSync Admin" />

            <div className="grid gap-4 md:grid-cols-2">
                {shifts.map((shift) => (
                    <Card key={shift.id} className="shadow-panel">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <CardTitle className="text-base">
                                        {shift.title}
                                    </CardTitle>
                                    <CardDescription className="mt-0.5 text-xs">
                                        {shift.division_name} ·{' '}
                                        {shift.event_title}
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {shift.checked_in_count}/
                                    {shift.volunteers.length} in
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <CalendarClock className="size-3.5 text-primary" />
                                    {new Date(shift.start_time).toLocaleString(
                                        'en-US',
                                        {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        },
                                    )}{' '}
                                    –{' '}
                                    {new Date(shift.end_time).toLocaleTimeString(
                                        'en-US',
                                        {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        },
                                    )}
                                </span>
                                {shift.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="size-3.5 text-primary" />
                                        {shift.location}
                                    </span>
                                )}
                            </div>

                            {/* Assigned Volunteers */}
                            <div>
                                <p className="mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    Assigned Volunteers (
                                    {shift.volunteers.length})
                                </p>
                                {shift.volunteers.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        No volunteers assigned yet.
                                    </p>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {shift.volunteers.map((vol) => (
                                            <Badge
                                                key={vol.id}
                                                variant="outline"
                                                className="gap-1 pr-1"
                                            >
                                                <span>{vol.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.delete(
                                                            `/admin/shifts/${shift.id}/volunteers/${vol.id}`,
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                    className="rounded-full p-0.5 hover:bg-destructive/15 hover:text-destructive"
                                                    aria-label={`Remove ${vol.name}`}
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openAssignDialog(shift)}
                                    >
                                        <UserPlus className="mr-1.5 size-3.5" />
                                        Assign
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setQrShift(shift)}
                                    >
                                        <QrCode className="mr-1.5 size-3.5" />
                                        Show QR
                                    </Button>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive"
                                    onClick={() => {
                                        if (
                                            confirm(
                                                `Delete shift "${shift.title}"?`,
                                            )
                                        ) {
                                            router.delete(
                                                `/admin/shifts/${shift.id}`,
                                            );
                                        }
                                    }}
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create Shift Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create Shift</DialogTitle>
                        <DialogDescription>
                            A unique check-in QR token is automatically
                            generated for every shift.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateShift} className="space-y-3">
                        <div className="space-y-1">
                            <Label>Division</Label>
                            <Select
                                value={createForm.data.division_id}
                                onValueChange={(v) =>
                                    createForm.setData('division_id', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select division" />
                                </SelectTrigger>
                                <SelectContent>
                                    {divisions.map((d) => (
                                        <SelectItem
                                            key={d.id}
                                            value={String(d.id)}
                                        >
                                            {d.name} — {d.event_title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Shift Title</Label>
                            <Input
                                required
                                placeholder="e.g. Gate A Morning Registration"
                                value={createForm.data.title}
                                onChange={(e) =>
                                    createForm.setData('title', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Start Time</Label>
                                <Input
                                    type="datetime-local"
                                    required
                                    value={createForm.data.start_time}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'start_time',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>End Time</Label>
                                <Input
                                    type="datetime-local"
                                    required
                                    value={createForm.data.end_time}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'end_time',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Location / Post</Label>
                            <Input
                                placeholder="e.g. Main Lobby Gate A"
                                value={createForm.data.location}
                                onChange={(e) =>
                                    createForm.setData(
                                        'location',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Notes</Label>
                            <Textarea
                                rows={2}
                                value={createForm.data.description}
                                onChange={(e) =>
                                    createForm.setData(
                                        'description',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createForm.processing}
                            >
                                Create Shift
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Assign Volunteer Dialog with Overlap Conflict Alert */}
            <Dialog
                open={assignShift !== null}
                onOpenChange={(open) => !open && setAssignShift(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Assign Volunteer to {assignShift?.title}
                        </DialogTitle>
                        <DialogDescription>
                            Overlap guard automatically blocks double-booking
                            across any division or event.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAssign} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Accepted Division Volunteer</Label>
                            <Select
                                value={assignForm.data.user_id}
                                onValueChange={(v) =>
                                    assignForm.setData('user_id', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose volunteer..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(
                                        activeDivisionForAssign?.accepted_volunteers ??
                                        []
                                    ).map((vol) => (
                                        <SelectItem
                                            key={vol.id}
                                            value={String(vol.id)}
                                        >
                                            {vol.name} ({vol.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {assignForm.errors.user_id && (
                            <Alert variant="destructive">
                                <AlertTriangle className="size-4" />
                                <AlertTitle>
                                    Shift Conflict Detected
                                </AlertTitle>
                                <AlertDescription>
                                    {assignForm.errors.user_id}
                                </AlertDescription>
                            </Alert>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAssignShift(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    assignForm.processing ||
                                    !assignForm.data.user_id
                                }
                            >
                                Assign Volunteer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* QR Code Display Modal */}
            <Dialog
                open={qrShift !== null}
                onOpenChange={(open) => !open && setQrShift(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{qrShift?.title}</DialogTitle>
                        <DialogDescription>
                            {qrShift?.division_name} · {qrShift?.event_title}
                        </DialogDescription>
                    </DialogHeader>
                    {qrShift && (
                        <div className="flex flex-col items-center gap-4 py-2">
                            <div
                                className="rounded-xl border border-border bg-white p-4 shadow-xs"
                                dangerouslySetInnerHTML={{
                                    __html: qrShift.qr_svg,
                                }}
                            />
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">
                                    Manual Check-In Token
                                </p>
                                <p className="mt-1 rounded-md bg-muted px-3 py-1 font-mono text-sm font-bold tracking-wider">
                                    {qrShift.qr_token}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}


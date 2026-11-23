import { Head, router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    MapPin,
    Pencil,
    Plus,
    Trash2,
    Users,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { VenueMap } from '@/components/venue-map';
import AdminLayout from '@/layouts/AdminLayout';

type CoordinatorOption = {
    id: number;
    name: string;
    email: string;
};

type DivisionRow = {
    id: number;
    event_id: number;
    name: string;
    description: string | null;
    announcements: string | null;
    quota: number;
    coordinator_id: number | null;
    coordinator_name: string | null;
    accepted_count: number;
    pending_count: number;
    shifts_count: number;
};

type EventRow = {
    id: number;
    title: string;
    slug: string;
    description: string;
    venue_name: string;
    venue_lat: number;
    venue_lng: number;
    checkin_radius_meters: number;
    start_date: string;
    end_date: string;
    status: string;
    divisions: DivisionRow[];
};

type Props = {
    events: EventRow[];
    coordinators: CoordinatorOption[];
    isOrganizer: boolean;
};

export default function EventsIndex({
    events,
    coordinators,
    isOrganizer,
}: Props) {
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);

    const [divisionModalOpen, setDivisionModalOpen] = useState(false);
    const [editingDivision, setEditingDivision] = useState<DivisionRow | null>(
        null,
    );

    const eventForm = useForm({
        title: '',
        description: '',
        venue_name: '',
        venue_lat: '-6.8868',
        venue_lng: '107.6085',
        checkin_radius_meters: '250',
        start_date: '',
        end_date: '',
        status: 'open',
    });

    const divisionForm = useForm({
        event_id: 0,
        coordinator_id: '' as string,
        name: '',
        description: '',
        announcements: '',
        quota: '15',
    });

    const openCreateEvent = () => {
        setEditingEvent(null);
        eventForm.setData({
            title: '',
            description: '',
            venue_name: '',
            venue_lat: '-6.8868',
            venue_lng: '107.6085',
            checkin_radius_meters: '250',
            start_date: '',
            end_date: '',
            status: 'open',
        });
        eventForm.clearErrors();
        setEventModalOpen(true);
    };

    const openEditEvent = (ev: EventRow) => {
        setEditingEvent(ev);
        eventForm.setData({
            title: ev.title,
            description: ev.description,
            venue_name: ev.venue_name,
            venue_lat: String(ev.venue_lat),
            venue_lng: String(ev.venue_lng),
            checkin_radius_meters: String(ev.checkin_radius_meters),
            start_date: ev.start_date,
            end_date: ev.end_date,
            status: ev.status,
        });
        eventForm.clearErrors();
        setEventModalOpen(true);
    };

    const submitEvent = (e: FormEvent) => {
        e.preventDefault();
        if (editingEvent) {
            eventForm.put(`/admin/events/${editingEvent.id}`, {
                onSuccess: () => setEventModalOpen(false),
            });
        } else {
            eventForm.post('/admin/events', {
                onSuccess: () => setEventModalOpen(false),
            });
        }
    };

    const openCreateDivision = (eventId: number) => {
        setEditingDivision(null);
        divisionForm.setData({
            event_id: eventId,
            coordinator_id: '',
            name: '',
            description: '',
            announcements: '',
            quota: '15',
        });
        divisionForm.clearErrors();
        setDivisionModalOpen(true);
    };

    const openEditDivision = (div: DivisionRow) => {
        setEditingDivision(div);
        divisionForm.setData({
            event_id: div.event_id,
            coordinator_id: div.coordinator_id
                ? String(div.coordinator_id)
                : '',
            name: div.name,
            description: div.description ?? '',
            announcements: div.announcements ?? '',
            quota: String(div.quota),
        });
        divisionForm.clearErrors();
        setDivisionModalOpen(true);
    };

    const submitDivision = (e: FormEvent) => {
        e.preventDefault();
        divisionForm.transform((data) => ({
            ...data,
            coordinator_id:
                data.coordinator_id && data.coordinator_id !== 'none'
                    ? Number(data.coordinator_id)
                    : null,
            quota: Number(data.quota),
        }));

        if (editingDivision) {
            divisionForm.put(`/admin/divisions/${editingDivision.id}`, {
                onSuccess: () => setDivisionModalOpen(false),
            });
        } else {
            divisionForm.post('/admin/divisions', {
                onSuccess: () => setDivisionModalOpen(false),
            });
        }
    };

    return (
        <AdminLayout
            title="Events & Divisions"
            subtitle="Manage community events, GPS check-in geofences, division quotas, and coordinator assignments."
            actions={
                isOrganizer ? (
                    <Button size="sm" onClick={openCreateEvent}>
                        <Plus className="mr-1.5 size-4" />
                        New Event
                    </Button>
                ) : undefined
            }
        >
            <Head title="Events & Divisions — VolunSync Admin" />

            <div className="space-y-6">
                {events.map((ev) => (
                    <Card key={ev.id} className="shadow-panel">
                        <CardHeader className="border-b border-border pb-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <CardTitle className="text-lg">
                                            {ev.title}
                                        </CardTitle>
                                        <Badge variant="secondary">
                                            {ev.status}
                                        </Badge>
                                    </div>
                                    <CardDescription className="mt-1 flex flex-wrap gap-4 text-xs">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="size-3.5 text-primary" />
                                            {ev.venue_name} (
                                            {ev.venue_lat.toFixed(4)},{' '}
                                            {ev.venue_lng.toFixed(4)} ·{' '}
                                            {ev.checkin_radius_meters}m)
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <CalendarDays className="size-3.5 text-primary" />
                                            {ev.start_date.replace('T', ' ')} →{' '}
                                            {ev.end_date.replace('T', ' ')}
                                        </span>
                                    </CardDescription>
                                </div>
                                {isOrganizer && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                openCreateDivision(ev.id)
                                            }
                                        >
                                            <Plus className="mr-1 size-3.5" />
                                            Add Division
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => openEditEvent(ev)}
                                        >
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-destructive"
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        `Delete "${ev.title}" and all its divisions?`,
                                                    )
                                                ) {
                                                    router.delete(
                                                        `/admin/events/${ev.id}`,
                                                    );
                                                }
                                            }}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Division</TableHead>
                                        <TableHead>Coordinator</TableHead>
                                        <TableHead>Quota Fill</TableHead>
                                        <TableHead>Pending</TableHead>
                                        <TableHead>Shifts</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ev.divisions.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="text-center text-muted-foreground"
                                            >
                                                No divisions configured yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        ev.divisions.map((div) => (
                                            <TableRow key={div.id}>
                                                <TableCell className="font-medium">
                                                    <div>{div.name}</div>
                                                    {div.description && (
                                                        <div className="max-w-xs truncate text-xs text-muted-foreground">
                                                            {div.description}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {div.coordinator_name ?? (
                                                        <span className="text-xs text-muted-foreground">
                                                            Unassigned
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Users className="size-3.5 text-primary" />
                                                        {div.accepted_count}/
                                                        {div.quota}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {div.pending_count}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {div.shifts_count}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            openEditDivision(
                                                                div,
                                                            )
                                                        }
                                                    >
                                                        <Pencil className="mr-1 size-3.5" />
                                                        Edit
                                                    </Button>
                                                    {isOrganizer && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                if (
                                                                    confirm(
                                                                        `Delete division "${div.name}"?`,
                                                                    )
                                                                ) {
                                                                    router.delete(
                                                                        `/admin/divisions/${div.id}`,
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Event Dialog */}
            <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingEvent ? 'Edit Event' : 'Create New Event'}
                        </DialogTitle>
                        <DialogDescription>
                            Configure event dates and GPS venue geofence for
                            on-site check-in verification.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitEvent} className="space-y-3">
                        <div className="space-y-1">
                            <Label>Title</Label>
                            <Input
                                required
                                value={eventForm.data.title}
                                onChange={(e) =>
                                    eventForm.setData('title', e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Description</Label>
                            <Textarea
                                required
                                rows={3}
                                value={eventForm.data.description}
                                onChange={(e) =>
                                    eventForm.setData(
                                        'description',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Venue Name</Label>
                                <Input
                                    required
                                    value={eventForm.data.venue_name}
                                    onChange={(e) =>
                                        eventForm.setData(
                                            'venue_name',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Status</Label>
                                <Select
                                    value={eventForm.data.status}
                                    onValueChange={(val) =>
                                        eventForm.setData('status', val)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">
                                            Draft
                                        </SelectItem>
                                        <SelectItem value="open">
                                            Open
                                        </SelectItem>
                                        <SelectItem value="ongoing">
                                            Ongoing
                                        </SelectItem>
                                        <SelectItem value="completed">
                                            Completed
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {/* Interactive OpenStreetMap Venue & Geofence Picker */}
                        <div className="space-y-2 rounded-xl border border-border bg-surface/50 p-3">
                            <Label>
                                Venue Location & Geofence (OpenStreetMap)
                            </Label>
                            <VenueMap
                                mode="picker"
                                venueLat={Number(eventForm.data.venue_lat)}
                                venueLng={Number(eventForm.data.venue_lng)}
                                radiusMeters={Number(
                                    eventForm.data.checkin_radius_meters,
                                )}
                                venueName={eventForm.data.venue_name}
                                onLocationChange={(lat, lng, suggestedName) => {
                                    eventForm.setData((prev) => ({
                                        ...prev,
                                        venue_lat: String(lat),
                                        venue_lng: String(lng),
                                        venue_name:
                                            !prev.venue_name.trim() &&
                                            suggestedName
                                                ? suggestedName
                                                : prev.venue_name,
                                    }));
                                }}
                                heightClass="h-52"
                            />
                            <div className="grid grid-cols-3 gap-3 pt-1">
                                <div className="space-y-1">
                                    <Label className="text-xs">Latitude</Label>
                                    <Input
                                        required
                                        className="font-mono text-xs"
                                        value={eventForm.data.venue_lat}
                                        onChange={(e) =>
                                            eventForm.setData(
                                                'venue_lat',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Longitude</Label>
                                    <Input
                                        required
                                        className="font-mono text-xs"
                                        value={eventForm.data.venue_lng}
                                        onChange={(e) =>
                                            eventForm.setData(
                                                'venue_lng',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">
                                        Radius (m)
                                    </Label>
                                    <Input
                                        type="number"
                                        min={20}
                                        max={5000}
                                        required
                                        className="font-mono text-xs"
                                        value={
                                            eventForm.data.checkin_radius_meters
                                        }
                                        onChange={(e) =>
                                            eventForm.setData(
                                                'checkin_radius_meters',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Start Date</Label>
                                <Input
                                    type="datetime-local"
                                    required
                                    value={eventForm.data.start_date}
                                    onChange={(e) =>
                                        eventForm.setData(
                                            'start_date',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>End Date</Label>
                                <Input
                                    type="datetime-local"
                                    required
                                    value={eventForm.data.end_date}
                                    onChange={(e) =>
                                        eventForm.setData(
                                            'end_date',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEventModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={eventForm.processing}
                            >
                                {editingEvent ? 'Save Changes' : 'Create Event'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Division Dialog */}
            <Dialog
                open={divisionModalOpen}
                onOpenChange={setDivisionModalOpen}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingDivision
                                ? `Edit ${editingDivision.name}`
                                : 'Add Division'}
                        </DialogTitle>
                        <DialogDescription>
                            Assign a coordinator, set volunteer quota, and post
                            workspace briefing announcements.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitDivision} className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 space-y-1">
                                <Label>Division Name</Label>
                                <Input
                                    required
                                    value={divisionForm.data.name}
                                    onChange={(e) =>
                                        divisionForm.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Quota</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    required
                                    value={divisionForm.data.quota}
                                    onChange={(e) =>
                                        divisionForm.setData(
                                            'quota',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                        {isOrganizer && (
                            <div className="space-y-1">
                                <Label>Division Coordinator</Label>
                                <Select
                                    value={
                                        divisionForm.data.coordinator_id ||
                                        'none'
                                    }
                                    onValueChange={(val) =>
                                        divisionForm.setData(
                                            'coordinator_id',
                                            val,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select coordinator" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            Unassigned
                                        </SelectItem>
                                        {coordinators.map((c) => (
                                            <SelectItem
                                                key={c.id}
                                                value={String(c.id)}
                                            >
                                                {c.name} ({c.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label>Description</Label>
                            <Textarea
                                rows={2}
                                value={divisionForm.data.description}
                                onChange={(e) =>
                                    divisionForm.setData(
                                        'description',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Workspace Announcements</Label>
                            <Textarea
                                rows={3}
                                placeholder="Visible to all accepted volunteers in this division workspace..."
                                value={divisionForm.data.announcements}
                                onChange={(e) =>
                                    divisionForm.setData(
                                        'announcements',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDivisionModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={divisionForm.processing}
                            >
                                Save Division
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}


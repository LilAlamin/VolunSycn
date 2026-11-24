import { Head, router, useForm } from '@inertiajs/react';
import {
    Globe,
    Layers,
    Megaphone,
    Pencil,
    Pin,
    PinOff,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

type EventOption = {
    id: number;
    title: string;
    status: string;
    divisions: { id: number; name: string }[];
};

type AnnouncementItem = {
    id: number;
    event_id: number;
    division_id: number | null;
    title: string;
    body: string;
    is_pinned: boolean;
    scope: 'event_wide' | 'division_only';
    event_title: string;
    division_name: string | null;
    author_name: string;
    can_manage: boolean;
    created_at: string | null;
    updated_at: string | null;
};

type Props = {
    isOrganizer: boolean;
    events: EventOption[];
    announcements: AnnouncementItem[];
};

export default function AnnouncementsIndex({
    isOrganizer,
    events,
    announcements,
}: Props) {
    const [search, setSearch] = useState('');
    const [eventFilter, setEventFilter] = useState('all');
    const [scopeFilter, setScopeFilter] = useState<
        'all' | 'event_wide' | 'division_only'
    >('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<AnnouncementItem | null>(null);

    const coordinatorDivisions = useMemo(
        () =>
            events.flatMap((ev) =>
                ev.divisions.map((div) => ({
                    id: div.id,
                    name: div.name,
                    event_id: ev.id,
                    event_title: ev.title,
                })),
            ),
        [events],
    );

    const form = useForm<{
        event_id: string;
        division_id: string;
        title: string;
        body: string;
        is_pinned: boolean;
    }>({
        event_id: '',
        division_id: '',
        title: '',
        body: '',
        is_pinned: false,
    });

    const selectedEventForForm = useMemo(
        () => events.find((e) => String(e.id) === form.data.event_id) ?? null,
        [events, form.data.event_id],
    );

    const openCreate = () => {
        setEditing(null);
        const defaultEvent = events[0];
        const defaultCoordDiv = coordinatorDivisions[0];
        form.setData({
            event_id: isOrganizer
                ? defaultEvent
                    ? String(defaultEvent.id)
                    : ''
                : defaultCoordDiv
                  ? String(defaultCoordDiv.event_id)
                  : '',
            division_id: isOrganizer
                ? 'all'
                : defaultCoordDiv
                  ? String(defaultCoordDiv.id)
                  : '',
            title: '',
            body: '',
            is_pinned: false,
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const openEdit = (item: AnnouncementItem) => {
        setEditing(item);
        form.setData({
            event_id: String(item.event_id),
            division_id:
                item.division_id === null ? 'all' : String(item.division_id),
            title: item.title,
            body: item.body,
            is_pinned: item.is_pinned,
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const divisionIdPayload =
            form.data.division_id === '' || form.data.division_id === 'all'
                ? null
                : Number(form.data.division_id);

        const payload = {
            event_id: form.data.event_id ? Number(form.data.event_id) : null,
            division_id: divisionIdPayload,
            title: form.data.title,
            body: form.data.body,
            is_pinned: form.data.is_pinned,
        };

        if (editing) {
            form.transform(() => payload);
            form.put(`/admin/announcements/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => setDialogOpen(false),
            });
        } else {
            form.transform(() => payload);
            form.post('/admin/announcements', {
                preserveScroll: true,
                onSuccess: () => {
                    setDialogOpen(false);
                    form.reset();
                },
            });
        }
    };

    const togglePin = (item: AnnouncementItem) => {
        router.put(
            `/admin/announcements/${item.id}`,
            {
                division_id: item.division_id,
                title: item.title,
                body: item.body,
                is_pinned: !item.is_pinned,
            },
            { preserveScroll: true },
        );
    };

    const handleDelete = (item: AnnouncementItem) => {
        if (!window.confirm(`Delete announcement "${item.title}"?`)) {
            return;
        }
        router.delete(`/admin/announcements/${item.id}`, {
            preserveScroll: true,
        });
    };

    const filteredAnnouncements = useMemo(() => {
        return announcements.filter((item) => {
            if (
                eventFilter !== 'all' &&
                String(item.event_id) !== eventFilter
            ) {
                return false;
            }
            if (scopeFilter !== 'all' && item.scope !== scopeFilter) {
                return false;
            }
            if (search.trim()) {
                const q = search.toLowerCase();
                return (
                    item.title.toLowerCase().includes(q) ||
                    item.body.toLowerCase().includes(q) ||
                    item.event_title.toLowerCase().includes(q) ||
                    (item.division_name?.toLowerCase().includes(q) ?? false)
                );
            }
            return true;
        });
    }, [announcements, eventFilter, scopeFilter, search]);

    const canCreate = isOrganizer
        ? events.length > 0
        : coordinatorDivisions.length > 0;

    return (
        <AdminLayout
            title="Announcements & Briefings"
            subtitle={
                isOrganizer
                    ? 'Publish multiple event-wide or division-specific announcements for accepted volunteers.'
                    : 'Publish multiple announcements and operational briefings for your assigned divisions.'
            }
            actions={
                <Button size="sm" disabled={!canCreate} onClick={openCreate}>
                    <Plus className="mr-1.5 size-4" />
                    New Announcement
                </Button>
            }
        >
            <Head title="Announcements — VolunSync Admin" />

            <div className="space-y-5">
                {/* Filter Bar */}
                <Card className="shadow-panel">
                    <CardContent className="grid gap-3 pt-5 md:grid-cols-3">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                            <Input
                                className="pl-8"
                                placeholder="Search title, message, or division..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <Select
                            value={eventFilter}
                            onValueChange={setEventFilter}
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
                            value={scopeFilter}
                            onValueChange={(v) =>
                                setScopeFilter(
                                    v as 'all' | 'event_wide' | 'division_only',
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Scopes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Scopes</SelectItem>
                                <SelectItem value="event_wide">
                                    Event-Wide
                                </SelectItem>
                                <SelectItem value="division_only">
                                    Division-Only
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Announcements List */}
                {filteredAnnouncements.length === 0 ? (
                    <Card className="shadow-panel">
                        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                            <Megaphone className="size-10 text-primary/70" />
                            <div>
                                <p className="font-semibold">
                                    No announcements yet
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {canCreate
                                        ? 'Post your first briefing or update — volunteers will see it immediately in their Division Workspace.'
                                        : isOrganizer
                                          ? 'Create an event first before publishing announcements.'
                                          : 'You are not assigned to any division yet.'}
                                </p>
                            </div>
                            {canCreate && (
                                <Button size="sm" onClick={openCreate}>
                                    <Plus className="mr-1.5 size-4" />
                                    New Announcement
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredAnnouncements.map((item) => (
                            <Card
                                key={item.id}
                                className={
                                    item.is_pinned
                                        ? 'border-primary/40 shadow-panel'
                                        : 'shadow-panel'
                                }
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {item.is_pinned && (
                                                    <Badge className="bg-primary text-primary-foreground">
                                                        <Pin className="mr-1 size-3" />
                                                        Pinned
                                                    </Badge>
                                                )}
                                                {item.scope === 'event_wide' ? (
                                                    <Badge className="bg-soft text-soft-foreground">
                                                        <Globe className="mr-1 size-3" />
                                                        Event-Wide
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">
                                                        <Layers className="mr-1 size-3 text-primary" />
                                                        {item.division_name}
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {item.event_title}
                                                </span>
                                            </div>
                                            <CardTitle className="text-base font-bold">
                                                {item.title}
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                Posted by {item.author_name}
                                                {item.created_at
                                                    ? ` · ${new Date(
                                                          item.created_at,
                                                      ).toLocaleString(
                                                          'en-US',
                                                          {
                                                              month: 'short',
                                                              day: 'numeric',
                                                              year: 'numeric',
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          },
                                                      )}`
                                                    : ''}
                                            </CardDescription>
                                        </div>

                                        {item.can_manage && (
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    title={
                                                        item.is_pinned
                                                            ? 'Unpin'
                                                            : 'Pin to top'
                                                    }
                                                    onClick={() =>
                                                        togglePin(item)
                                                    }
                                                >
                                                    {item.is_pinned ? (
                                                        <PinOff className="size-4" />
                                                    ) : (
                                                        <Pin className="size-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        openEdit(item)
                                                    }
                                                >
                                                    <Pencil className="mr-1 size-3.5" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() =>
                                                        handleDelete(item)
                                                    }
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="rounded-lg border border-border/70 bg-surface/60 p-3.5 text-sm leading-relaxed whitespace-pre-line text-foreground">
                                        {item.body}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create / Edit Announcement Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit Announcement' : 'New Announcement'}
                        </DialogTitle>
                        <DialogDescription>
                            {isOrganizer
                                ? 'Broadcast an event-wide update or target a specific division.'
                                : 'Post an operational update to your assigned division workspace.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isOrganizer ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>Event</Label>
                                    <Select
                                        value={form.data.event_id}
                                        disabled={editing !== null}
                                        onValueChange={(val) => {
                                            form.setData((prev) => ({
                                                ...prev,
                                                event_id: val,
                                                division_id: 'all',
                                            }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select event" />
                                        </SelectTrigger>
                                        <SelectContent>
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
                                    {form.errors.event_id && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.event_id}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Target Audience</Label>
                                    <Select
                                        value={form.data.division_id}
                                        onValueChange={(val) =>
                                            form.setData('division_id', val)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select target" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Divisions (Event-Wide)
                                            </SelectItem>
                                            {(
                                                selectedEventForForm?.divisions ??
                                                []
                                            ).map((div) => (
                                                <SelectItem
                                                    key={div.id}
                                                    value={String(div.id)}
                                                >
                                                    {div.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.division_id && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.division_id}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <Label>Target Division</Label>
                                <Select
                                    value={form.data.division_id}
                                    onValueChange={(val) => {
                                        const found = coordinatorDivisions.find(
                                            (d) => String(d.id) === val,
                                        );
                                        form.setData((prev) => ({
                                            ...prev,
                                            division_id: val,
                                            event_id: found
                                                ? String(found.event_id)
                                                : prev.event_id,
                                        }));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your division" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {coordinatorDivisions.map((div) => (
                                            <SelectItem
                                                key={div.id}
                                                value={String(div.id)}
                                            >
                                                {div.name} — {div.event_title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.division_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.division_id}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="ann-title">Title</Label>
                            <Input
                                id="ann-title"
                                required
                                placeholder="e.g. Gate Briefing & Uniform Pickup at 07:00"
                                value={form.data.title}
                                onChange={(e) =>
                                    form.setData('title', e.target.value)
                                }
                            />
                            {form.errors.title && (
                                <p className="text-xs text-destructive">
                                    {form.errors.title}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ann-body">Message</Label>
                            <Textarea
                                id="ann-body"
                                rows={5}
                                required
                                placeholder="Write operational instructions, meeting points, or reminders for volunteers..."
                                value={form.data.body}
                                onChange={(e) =>
                                    form.setData('body', e.target.value)
                                }
                            />
                            {form.errors.body && (
                                <p className="text-xs text-destructive">
                                    {form.errors.body}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="ann-pinned"
                                checked={form.data.is_pinned}
                                onCheckedChange={(checked) =>
                                    form.setData('is_pinned', checked === true)
                                }
                            />
                            <Label
                                htmlFor="ann-pinned"
                                className="cursor-pointer text-xs font-normal"
                            >
                                Pin this announcement to the top of the
                                volunteer workspace
                            </Label>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing
                                    ? 'Saving...'
                                    : editing
                                      ? 'Update Announcement'
                                      : 'Publish Announcement'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

import { Head, router, useForm } from '@inertiajs/react';
import {
    Mail,
    Pencil,
    ShieldCheck,
    Trash2,
    UserCheck,
    UserPlus,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/AdminLayout';

type CoordinatorRow = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    provisioned_by_me: boolean;
    divisions: {
        id: number;
        name: string;
        event_title: string;
    }[];
};

type DivisionOption = {
    id: number;
    name: string;
    event_title: string;
    coordinator_name: string | null;
};

type Props = {
    coordinators: CoordinatorRow[];
    divisions: DivisionOption[];
    organizationName: string;
};

export default function CoordinatorsIndex({
    coordinators,
    divisions,
    organizationName,
}: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [editingCoordinator, setEditingCoordinator] =
        useState<CoordinatorRow | null>(null);

    const createForm = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        division_id: '',
    });

    const assignForm = useForm({
        email: '',
        division_id: divisions[0] ? String(divisions[0].id) : '',
    });

    const editForm = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        division_ids: [] as number[],
    });

    const submitCreate = (e: FormEvent) => {
        e.preventDefault();
        createForm.transform((data) => ({
            ...data,
            division_id:
                data.division_id && data.division_id !== 'none'
                    ? Number(data.division_id)
                    : null,
        }));
        createForm.post('/admin/coordinators', {
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const submitAssign = (e: FormEvent) => {
        e.preventDefault();
        assignForm.post('/admin/coordinators/assign', {
            onSuccess: () => {
                setAssignOpen(false);
                assignForm.reset('email');
            },
        });
    };

    const openEditModal = (coord: CoordinatorRow) => {
        setEditingCoordinator(coord);
        editForm.setData({
            name: coord.name,
            email: coord.email,
            phone: coord.phone ?? '',
            password: '',
            division_ids: coord.divisions.map((d) => d.id),
        });
        editForm.clearErrors();
    };

    const toggleDivision = (divisionId: number, checked: boolean) => {
        const current = editForm.data.division_ids;
        if (checked) {
            if (!current.includes(divisionId)) {
                editForm.setData('division_ids', [...current, divisionId]);
            }
        } else {
            editForm.setData(
                'division_ids',
                current.filter((id) => id !== divisionId),
            );
        }
    };

    const submitEdit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingCoordinator) return;
        editForm.put(`/admin/coordinators/${editingCoordinator.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingCoordinator(null);
                editForm.reset('password');
            },
        });
    };

    const handleDelete = (coord: CoordinatorRow) => {
        const message = coord.provisioned_by_me
            ? `Delete provisioned coordinator "${coord.name}" and unassign their divisions?`
            : `Unassign "${coord.name}" from all your divisions?`;

        if (confirm(message)) {
            router.delete(`/admin/coordinators/${coord.id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <AdminLayout
            title="Division Coordinators"
            subtitle={`Provision Coordinator accounts or assign existing users to divisions under ${organizationName}.`}
            actions={
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssignOpen(true)}
                    >
                        <UserCheck className="mr-1.5 size-4" />
                        Assign Existing
                    </Button>
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <UserPlus className="mr-1.5 size-4" />
                        New Coordinator
                    </Button>
                </div>
            }
        >
            <Head title="Division Coordinators — VolunSync Admin" />

            <Card className="shadow-panel">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className="size-4 text-primary" />
                        Provisioned & Assigned Coordinators (
                        {coordinators.length})
                    </CardTitle>
                    <CardDescription>
                        Coordinators can only screen applicants, schedule
                        shifts, and verify attendance for their assigned
                        divisions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Coordinator</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Assigned Divisions</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {coordinators.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="py-10 text-center text-muted-foreground"
                                        >
                                            No coordinators provisioned yet.
                                            Create a new coordinator or assign
                                            an existing user.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    coordinators.map((coord) => (
                                        <TableRow key={coord.id}>
                                            <TableCell className="font-medium">
                                                {coord.name}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Mail className="size-3.5 text-primary" />
                                                    {coord.email}
                                                </div>
                                                {coord.phone && (
                                                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                                                        {coord.phone}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {coord.divisions.length ===
                                                0 ? (
                                                    <span className="text-xs text-muted-foreground">
                                                        Unassigned
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {coord.divisions.map(
                                                            (d) => (
                                                                <Badge
                                                                    key={d.id}
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    {d.name} ·{' '}
                                                                    {
                                                                        d.event_title
                                                                    }
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        coord.provisioned_by_me
                                                            ? 'bg-soft text-soft-foreground'
                                                            : 'bg-secondary text-secondary-foreground'
                                                    }
                                                >
                                                    {coord.provisioned_by_me
                                                        ? 'Provisioned'
                                                        : 'Assigned'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        openEditModal(coord)
                                                    }
                                                >
                                                    <Pencil className="mr-1 size-3.5" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-destructive"
                                                    onClick={() =>
                                                        handleDelete(coord)
                                                    }
                                                    aria-label={`Remove ${coord.name}`}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Create Coordinator Account Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Coordinator Account</DialogTitle>
                        <DialogDescription>
                            Provision a new Division Coordinator account bound
                            to {organizationName}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-3">
                        <div className="space-y-1">
                            <Label>Full Name</Label>
                            <Input
                                required
                                value={createForm.data.name}
                                onChange={(e) =>
                                    createForm.setData('name', e.target.value)
                                }
                            />
                            {createForm.errors.name && (
                                <p className="text-xs text-destructive">
                                    {createForm.errors.name}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                required
                                value={createForm.data.email}
                                onChange={(e) =>
                                    createForm.setData('email', e.target.value)
                                }
                            />
                            {createForm.errors.email && (
                                <p className="text-xs text-destructive">
                                    {createForm.errors.email}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label>Phone (optional)</Label>
                            <Input
                                placeholder="+62 812-xxxx-xxxx"
                                value={createForm.data.phone}
                                onChange={(e) =>
                                    createForm.setData('phone', e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Temporary Password</Label>
                            <Input
                                type="password"
                                required
                                minLength={8}
                                placeholder="Min. 8 characters"
                                value={createForm.data.password}
                                onChange={(e) =>
                                    createForm.setData(
                                        'password',
                                        e.target.value,
                                    )
                                }
                            />
                            {createForm.errors.password && (
                                <p className="text-xs text-destructive">
                                    {createForm.errors.password}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label>Assign to Division (optional)</Label>
                            <Select
                                value={createForm.data.division_id || 'none'}
                                onValueChange={(v) =>
                                    createForm.setData('division_id', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose division" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        Assign later
                                    </SelectItem>
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
                                Create Coordinator
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Coordinator Dialog */}
            <Dialog
                open={editingCoordinator !== null}
                onOpenChange={(open) => !open && setEditingCoordinator(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Edit Coordinator: {editingCoordinator?.name}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCoordinator?.provisioned_by_me
                                ? 'Update account details, reset password, or change assigned divisions.'
                                : 'Update which divisions this existing user coordinates.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-3">
                        <div className="space-y-1">
                            <Label>Full Name</Label>
                            <Input
                                required
                                disabled={
                                    !editingCoordinator?.provisioned_by_me
                                }
                                value={editForm.data.name}
                                onChange={(e) =>
                                    editForm.setData('name', e.target.value)
                                }
                            />
                            {editForm.errors.name && (
                                <p className="text-xs text-destructive">
                                    {editForm.errors.name}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                required
                                disabled={
                                    !editingCoordinator?.provisioned_by_me
                                }
                                value={editForm.data.email}
                                onChange={(e) =>
                                    editForm.setData('email', e.target.value)
                                }
                            />
                            {editForm.errors.email && (
                                <p className="text-xs text-destructive">
                                    {editForm.errors.email}
                                </p>
                            )}
                        </div>

                        {editingCoordinator?.provisioned_by_me && (
                            <>
                                <div className="space-y-1">
                                    <Label>Phone</Label>
                                    <Input
                                        placeholder="+62 812-xxxx-xxxx"
                                        value={editForm.data.phone}
                                        onChange={(e) =>
                                            editForm.setData(
                                                'phone',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>
                                        Reset Password{' '}
                                        <span className="text-xs font-normal text-muted-foreground">
                                            (leave blank to keep current)
                                        </span>
                                    </Label>
                                    <Input
                                        type="password"
                                        minLength={8}
                                        placeholder="New temporary password..."
                                        value={editForm.data.password}
                                        onChange={(e) =>
                                            editForm.setData(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {editForm.errors.password && (
                                        <p className="text-xs text-destructive">
                                            {editForm.errors.password}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="space-y-2 pt-1">
                            <Label>Assigned Divisions</Label>
                            {divisions.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    Create an event & division first to assign
                                    this coordinator.
                                </p>
                            ) : (
                                <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-border bg-surface p-3">
                                    {divisions.map((div) => {
                                        const checked =
                                            editForm.data.division_ids.includes(
                                                div.id,
                                            );
                                        return (
                                            <label
                                                key={div.id}
                                                className="flex cursor-pointer items-start gap-2.5 text-xs"
                                            >
                                                <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={(val) =>
                                                        toggleDivision(
                                                            div.id,
                                                            val === true,
                                                        )
                                                    }
                                                />
                                                <span className="leading-snug">
                                                    <span className="font-medium text-foreground">
                                                        {div.name}
                                                    </span>{' '}
                                                    <span className="text-muted-foreground">
                                                        — {div.event_title}
                                                    </span>
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingCoordinator(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={editForm.processing}
                            >
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Assign Existing User Dialog */}
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Assign Existing User as Coordinator
                        </DialogTitle>
                        <DialogDescription>
                            Enter the email of an existing VolunSync user to
                            grant them the Coordinator role for a division.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitAssign} className="space-y-3">
                        <div className="space-y-1">
                            <Label>User Email</Label>
                            <Input
                                type="email"
                                required
                                placeholder="existing.user@example.com"
                                value={assignForm.data.email}
                                onChange={(e) =>
                                    assignForm.setData('email', e.target.value)
                                }
                            />
                            {assignForm.errors.email && (
                                <p className="text-xs text-destructive">
                                    {assignForm.errors.email}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label>Target Division</Label>
                            <Select
                                value={assignForm.data.division_id}
                                onValueChange={(v) =>
                                    assignForm.setData('division_id', v)
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
                            {assignForm.errors.division_id && (
                                <p className="text-xs text-destructive">
                                    {assignForm.errors.division_id}
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAssignOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={assignForm.processing}
                            >
                                Assign Coordinator
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

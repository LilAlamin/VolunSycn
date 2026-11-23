import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    Camera,
    CheckCircle2,
    MapPin,
    ShieldAlert,
    UserCheck,
} from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { edit, update } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        user.avatar_url ?? null,
    );

    const form = useForm<{
        _method: string;
        name: string;
        email: string;
        phone: string;
        city: string;
        address: string;
        date_of_birth: string;
        emergency_contact_name: string;
        emergency_contact_phone: string;
        skills: string;
        bio: string;
        avatar: File | null;
    }>({
        _method: 'patch',
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        city: user.city ?? '',
        address: user.address ?? '',
        date_of_birth: user.date_of_birth ?? '',
        emergency_contact_name: user.emergency_contact_name ?? '',
        emergency_contact_phone: user.emergency_contact_phone ?? '',
        skills: user.skills ?? '',
        bio: user.bio ?? '',
        avatar: null,
    });

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        form.setData('avatar', file);
        const objectUrl = URL.createObjectURL(file);
        setAvatarPreview(objectUrl);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(update.url(), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const verificationChecks = [
        { label: 'Phone / WhatsApp', ok: Boolean(form.data.phone.trim()) },
        { label: 'City / Domicile', ok: Boolean(form.data.city.trim()) },
        { label: 'Full Street Address', ok: Boolean(form.data.address.trim()) },
        {
            label: 'Emergency Contact Name',
            ok: Boolean(form.data.emergency_contact_name.trim()),
        },
        {
            label: 'Emergency Contact Phone',
            ok: Boolean(form.data.emergency_contact_phone.trim()),
        },
    ];
    const completedCount = verificationChecks.filter((c) => c.ok).length;
    const completionPercent = Math.round(
        (completedCount / verificationChecks.length) * 100,
    );
    const isVerified = Boolean(user.is_profile_verified);

    const initials = (user.name ?? 'VS')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <>
            <Head title="Profile & Verification Settings" />

            <div className="space-y-6">
                {/* Volunteer Verification Readiness Card */}
                <Card
                    className={
                        isVerified
                            ? 'border-primary/30 bg-soft/30 shadow-panel'
                            : 'border-border shadow-panel'
                    }
                >
                    <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                {isVerified ? (
                                    <BadgeCheck className="size-5 text-primary" />
                                ) : (
                                    <ShieldAlert className="size-5 text-highlight" />
                                )}
                                Volunteer Identity Verification
                            </CardTitle>
                            <Badge
                                className={
                                    isVerified
                                        ? 'bg-success text-success-foreground'
                                        : 'bg-warning text-warning-foreground'
                                }
                            >
                                {isVerified
                                    ? 'Verified Profile'
                                    : `${completedCount}/${verificationChecks.length} Completed`}
                            </Badge>
                        </div>
                        <CardDescription className="text-xs">
                            Organizers & Division Coordinators rely on verified
                            phone, residential address, and emergency contacts
                            before on-site deployment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Progress value={completionPercent} />
                        <div className="flex flex-wrap gap-2">
                            {verificationChecks.map((check) => (
                                <span
                                    key={check.label}
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                                        check.ok
                                            ? 'bg-success/80 text-success-foreground'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    <CheckCircle2 className="size-3" />
                                    {check.label}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Main Profile & Photo Form */}
                <Card className="shadow-panel">
                    <CardHeader>
                        <CardTitle className="text-base">
                            Profile Photo & Personal Details
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Upload a clear portrait photo and fill in your full
                            verification details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            {/* Avatar Upload Widget */}
                            <div className="flex flex-wrap items-center gap-5 rounded-xl border border-border bg-surface p-4">
                                <Avatar className="size-20 shrink-0 ring-2 ring-primary/20">
                                    {avatarPreview && (
                                        <AvatarImage
                                            src={avatarPreview}
                                            alt={user.name}
                                            className="object-cover"
                                        />
                                    )}
                                    <AvatarFallback className="bg-soft text-lg font-bold text-soft-foreground">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm font-semibold">
                                            Profile Picture
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            JPG, PNG, or WEBP up to 2 MB. Shown
                                            in division peer directories & admin
                                            rosters.
                                        </p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                        >
                                            <Camera className="mr-1.5 size-3.5" />
                                            {avatarPreview
                                                ? 'Change Photo'
                                                : 'Upload Photo'}
                                        </Button>
                                        {form.data.avatar && (
                                            <span className="font-mono text-xs text-primary">
                                                {form.data.avatar.name}
                                            </span>
                                        )}
                                    </div>
                                    <InputError message={form.errors.avatar} />
                                </div>
                            </div>

                            {/* Basic Identity */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        required
                                        value={form.data.name}
                                        onChange={(e) =>
                                            form.setData('name', e.target.value)
                                        }
                                    />
                                    <InputError message={form.errors.name} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        value={form.data.email}
                                        onChange={(e) =>
                                            form.setData(
                                                'email',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.email} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="phone">
                                        Phone / WhatsApp Number
                                    </Label>
                                    <Input
                                        id="phone"
                                        placeholder="+62 812-xxxx-xxxx"
                                        value={form.data.phone}
                                        onChange={(e) =>
                                            form.setData(
                                                'phone',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.phone} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="date_of_birth">
                                        Date of Birth
                                    </Label>
                                    <Input
                                        id="date_of_birth"
                                        type="date"
                                        value={form.data.date_of_birth}
                                        onChange={(e) =>
                                            form.setData(
                                                'date_of_birth',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.date_of_birth}
                                    />
                                </div>
                            </div>

                            {/* Address Details */}
                            <div className="space-y-4 rounded-xl border border-border bg-surface/60 p-4">
                                <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    <MapPin className="size-3.5 text-primary" />
                                    Residential Address
                                </p>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="grid gap-1.5 sm:col-span-1">
                                        <Label htmlFor="city">
                                            City / Regency
                                        </Label>
                                        <Input
                                            id="city"
                                            placeholder="e.g. Surakarta"
                                            value={form.data.city}
                                            onChange={(e) =>
                                                form.setData(
                                                    'city',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={form.errors.city}
                                        />
                                    </div>

                                    <div className="grid gap-1.5 sm:col-span-2">
                                        <Label htmlFor="address">
                                            Complete Street Address
                                        </Label>
                                        <Input
                                            id="address"
                                            placeholder="Street, house number, district, postal code"
                                            value={form.data.address}
                                            onChange={(e) =>
                                                form.setData(
                                                    'address',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={form.errors.address}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div className="space-y-4 rounded-xl border border-border bg-surface/60 p-4">
                                <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    <UserCheck className="size-3.5 text-primary" />
                                    Emergency Contact (Required for Verification)
                                </p>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="emergency_contact_name">
                                            Contact Name & Relation
                                        </Label>
                                        <Input
                                            id="emergency_contact_name"
                                            placeholder="e.g. Budi Santoso (Father)"
                                            value={
                                                form.data.emergency_contact_name
                                            }
                                            onChange={(e) =>
                                                form.setData(
                                                    'emergency_contact_name',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                form.errors
                                                    .emergency_contact_name
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="emergency_contact_phone">
                                            Emergency Phone Number
                                        </Label>
                                        <Input
                                            id="emergency_contact_phone"
                                            placeholder="+62 812-xxxx-xxxx"
                                            value={
                                                form.data
                                                    .emergency_contact_phone
                                            }
                                            onChange={(e) =>
                                                form.setData(
                                                    'emergency_contact_phone',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                form.errors
                                                    .emergency_contact_phone
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Skills & Bio */}
                            <div className="grid gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="skills">
                                        Skills & Certifications (comma
                                        separated)
                                    </Label>
                                    <Input
                                        id="skills"
                                        placeholder="e.g. First Aid, Crowd Management, Photography, English"
                                        value={form.data.skills}
                                        onChange={(e) =>
                                            form.setData(
                                                'skills',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.skills} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="bio">Short Bio</Label>
                                    <Textarea
                                        id="bio"
                                        rows={3}
                                        placeholder="Tell coordinators a little about your background and volunteering interests..."
                                        value={form.data.bio}
                                        onChange={(e) =>
                                            form.setData('bio', e.target.value)
                                        }
                                    />
                                    <InputError message={form.errors.bio} />
                                </div>
                            </div>

                            {/* Email verification notice */}
                            {mustVerifyEmail &&
                                user.email_verified_at === null && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current!"
                                            >
                                                Click here to re-send the
                                                verification email.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                    data-test="update-profile-button"
                                >
                                    {form.processing
                                        ? 'Saving...'
                                        : 'Save & Verify Profile'}
                                </Button>
                                {form.recentlySuccessful && (
                                    <span className="text-xs font-medium text-primary">
                                        Saved!
                                    </span>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <DeleteUser />
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};

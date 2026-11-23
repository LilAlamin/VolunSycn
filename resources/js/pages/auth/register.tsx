import { Form, Head } from '@inertiajs/react';
import { Building2, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    const [accountType, setAccountType] = useState<'volunteer' | 'organizer'>(
        'volunteer',
    );

    return (
        <>
            <Head title="Register — VolunSync" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        {/* Two-Role Registration Switcher (Volunteer vs Organizer ONLY) */}
                        <div className="space-y-2">
                            <Label>Register as</Label>
                            <Tabs
                                value={accountType}
                                onValueChange={(v) =>
                                    setAccountType(
                                        v === 'organizer'
                                            ? 'organizer'
                                            : 'volunteer',
                                    )
                                }
                            >
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="volunteer">
                                        <UserRound className="size-3.5" />
                                        Volunteer
                                    </TabsTrigger>
                                    <TabsTrigger value="organizer">
                                        <Building2 className="size-3.5" />
                                        Organizer
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <input
                                type="hidden"
                                name="account_type"
                                value={accountType}
                            />
                            <InputError message={errors.account_type} />
                        </div>

                        <div className="grid gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="name">
                                    {accountType === 'organizer'
                                        ? 'PIC / Representative Name'
                                        : 'Full Name'}
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    autoComplete="name"
                                    name="name"
                                    placeholder={
                                        accountType === 'organizer'
                                            ? 'e.g. Ronald Ramadhani'
                                            : 'Full name'
                                    }
                                />
                                <InputError message={errors.name} />
                            </div>

                            {accountType === 'organizer' && (
                                <>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="organization_name">
                                            Organization / Community Name
                                        </Label>
                                        <Input
                                            id="organization_name"
                                            type="text"
                                            required
                                            name="organization_name"
                                            placeholder="e.g. SIPA Cultural Collective"
                                        />
                                        <InputError
                                            message={errors.organization_name}
                                        />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="organization_description">
                                            Organization Description{' '}
                                            <span className="text-xs font-normal text-muted-foreground">
                                                (optional)
                                            </span>
                                        </Label>
                                        <Textarea
                                            id="organization_description"
                                            name="organization_description"
                                            rows={2}
                                            className="min-h-16"
                                            placeholder="Brief summary of your community events and mission..."
                                        />
                                        <InputError
                                            message={
                                                errors.organization_description
                                            }
                                        />
                                    </div>
                                </>
                            )}

                            <div className="grid gap-1.5">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-1 w-full"
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                {accountType === 'organizer'
                                    ? 'Create Organizer Account'
                                    : 'Create Volunteer Account'}
                            </Button>
                        </div>

                        <div className="flex items-start gap-2 rounded-lg border border-border bg-surface p-3 text-xs text-muted-foreground">
                            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                            <span>
                                <strong>Division Coordinators</strong> do not
                                self-register — accounts are provisioned
                                directly by their Event Organizer.
                            </span>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()}>Log in</TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create your VolunSync account',
    description: 'Join as a Community Volunteer or register your Organization',
};

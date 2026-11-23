import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import VolunteerLayout from '@/layouts/VolunteerLayout';
import type { Auth } from '@/types';

type Props = {
    children: ReactNode;
};

export default function ConsoleLayout({ children }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const roles = auth?.user?.roles ?? [];
    const isAdmin =
        roles.includes('organizer') || roles.includes('coordinator');

    if (isAdmin) {
        return (
            <AdminLayout
                title="Account & Profile Settings"
                subtitle="Manage your profile photo, contact details, security, and appearance."
            >
                {children}
            </AdminLayout>
        );
    }

    return (
        <VolunteerLayout
            title="Account & Volunteer Verification"
            subtitle="Complete your profile photo, address, and emergency contact to earn Verified Volunteer status."
        >
            {children}
        </VolunteerLayout>
    );
}


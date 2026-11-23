import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    Briefcase,
    ClipboardList,
    Compass,
    FolderKanban,
    LayoutDashboard,
    LogOut,
    Menu,
    Moon,
    Settings,
    Sun,
    X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VolunSyncLogo } from '@/components/volunsync-logo';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import type { Auth, FlashMessages } from '@/types';

type VolunteerLayoutProps = {
    title?: string;
    subtitle?: string;
    actions?: ReactNode;
    children: ReactNode;
};

export default function VolunteerLayout({
    title,
    subtitle,
    actions,
    children,
}: VolunteerLayoutProps) {
    const { auth, flash } = usePage<{
        auth: Auth;
        flash?: FlashMessages;
    }>().props;
    const { appearance, updateAppearance } = useAppearance();
    const [mobileOpen, setMobileOpen] = useState(false);

    const user = auth?.user;
    const roles = user?.roles ?? [];
    const isAdmin =
        roles.includes('organizer') || roles.includes('coordinator');
    const acceptedDivisions = user?.accepted_divisions ?? [];
    const currentPath =
        typeof window !== 'undefined' ? window.location.pathname : '';

    const mainNav = [
        {
            label: 'Dashboard',
            href: '/volunteer/dashboard',
            icon: LayoutDashboard,
            active: currentPath === '/volunteer/dashboard',
        },
        {
            label: 'Explore Events',
            href: '/events',
            icon: Compass,
            active: currentPath === '/events',
        },
        {
            label: 'My Applications',
            href: '/volunteer/applications',
            icon: ClipboardList,
            active: currentPath.startsWith('/volunteer/applications'),
        },
        {
            label: 'My Workspaces',
            href: '/volunteer/workspaces',
            icon: FolderKanban,
            badge:
                acceptedDivisions.length > 0 ? acceptedDivisions.length : null,
            active: currentPath === '/volunteer/workspaces',
        },
    ];

    const toggleDark = () => {
        updateAppearance(appearance === 'dark' ? 'light' : 'dark');
    };

    const initials = (user?.name ?? 'VS')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const sidebarNavContent = (onNavigate?: () => void) => (
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Volunteer Menu
            </p>
            {mainNav.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                        'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        item.active
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )}
                >
                    <span className="flex items-center gap-3">
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                    </span>
                    {item.badge !== null && item.badge !== undefined && (
                        <span
                            className={cn(
                                'rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold',
                                item.active
                                    ? 'bg-white/20 text-white'
                                    : 'bg-soft text-soft-foreground',
                            )}
                        >
                            {item.badge}
                        </span>
                    )}
                </Link>
            ))}

            {/* Accepted Divisions Section — Separate Workspace per Accepted Event/Division */}
            <div className="pt-4">
                <div className="flex items-center justify-between px-3 py-1.5">
                    <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Accepted Divisions
                    </p>
                    <span className="font-mono text-[10px] text-muted-foreground">
                        {acceptedDivisions.length}
                    </span>
                </div>

                {acceptedDivisions.length === 0 ? (
                    <div className="mx-1 rounded-lg border border-dashed border-border bg-surface/60 px-3 py-2.5 text-xs text-muted-foreground">
                        No accepted divisions yet. Apply to an event to unlock
                        your division workspace.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {acceptedDivisions.map((div) => {
                            const href = `/volunteer/workspace/${div.id}`;
                            const active = currentPath === href;
                            return (
                                <Link
                                    key={div.id}
                                    href={href}
                                    onClick={onNavigate}
                                    className={cn(
                                        'flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                                        active
                                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs'
                                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                    )}
                                >
                                    <Briefcase className="mt-0.5 size-4 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate leading-tight font-medium">
                                            {div.name}
                                        </p>
                                        <p
                                            className={cn(
                                                'mt-0.5 truncate text-[11px]',
                                                active
                                                    ? 'text-white/80'
                                                    : 'text-muted-foreground',
                                            )}
                                        >
                                            {div.event_title}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Account & Admin Switch */}
            <div className="pt-4">
                <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Account
                </p>
                <Link
                    href="/settings/profile"
                    onClick={onNavigate}
                    className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        currentPath.startsWith('/settings')
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent',
                    )}
                >
                    <Settings className="size-4" />
                    <span>Profile Settings</span>
                </Link>
                {isAdmin && (
                    <Link
                        href="/admin/dashboard"
                        onClick={onNavigate}
                        className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                    >
                        <LayoutDashboard className="size-4" />
                        <span>Switch to Admin Console</span>
                    </Link>
                )}
            </div>
        </nav>
    );

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Desktop Volunteer Sidebar */}
            <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
                <div className="flex h-16 items-center border-b border-sidebar-border px-5">
                    <Link href="/">
                        <VolunSyncLogo
                            variant="mark"
                            subtitle="Volunteer Console"
                        />
                    </Link>
                </div>

                {sidebarNavContent()}

                <div className="border-t border-sidebar-border p-3">
                    <div className="flex items-center gap-3 rounded-lg bg-card p-2.5 shadow-xs ring-1 ring-border/60">
                        <Avatar className="size-9">
                            <AvatarFallback className="bg-soft text-xs font-semibold text-soft-foreground">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                                {user?.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {user?.email}
                            </p>
                        </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={toggleDark}
                        >
                            {appearance === 'dark' ? (
                                <Sun className="mr-1.5 size-3.5" />
                            ) : (
                                <Moon className="mr-1.5 size-3.5" />
                            )}
                            {appearance === 'dark' ? 'Light' : 'Dark'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-destructive hover:text-destructive"
                        >
                            <Link href="/logout" method="post" as="button">
                                <LogOut className="size-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div
                        className="fixed inset-0 bg-black/50"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="relative z-10 flex w-72 flex-col bg-sidebar shadow-xl">
                        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
                            <VolunSyncLogo
                                variant="mark"
                                subtitle="Volunteer Console"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMobileOpen(false)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                        {sidebarNavContent(() => setMobileOpen(false))}
                        <div className="border-t border-sidebar-border p-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-destructive"
                                asChild
                            >
                                <Link href="/logout" method="post" as="button">
                                    <LogOut className="mr-2 size-4" />
                                    Sign out
                                </Link>
                            </Button>
                        </div>
                    </aside>
                </div>
            )}

            {/* Main Content Column */}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/85 px-4 backdrop-blur-md lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setMobileOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu className="size-5" />
                        </Button>
                        <div className="min-w-0">
                            {title && (
                                <h1 className="truncate text-lg font-bold tracking-tight">
                                    {title}
                                </h1>
                            )}
                            {subtitle && (
                                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        {actions}
                        {user && (
                            <Badge className="bg-soft text-soft-foreground">
                                <Award className="mr-1 size-3.5" />
                                {user.verified_hours ?? 0} hrs verified
                            </Badge>
                        )}
                    </div>
                </header>

                <main className="mx-auto w-full max-w-6xl flex-1 p-4 lg:p-8">
                    {flash?.success && (
                        <div className="mb-5 rounded-lg border border-primary/30 bg-success px-4 py-3 text-sm font-medium text-success-foreground">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                            {flash.error}
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}

import { Link, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    CalendarDays,
    ChevronRight,
    ClipboardCheck,
    Clock,
    Compass,
    FileArchive,
    LayoutDashboard,
    LogOut,
    Menu,
    Moon,
    QrCode,
    Sun,
    Users,
    X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VolunSyncLogo } from '@/components/volunsync-logo';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import type { Auth, FlashMessages } from '@/types';

type AdminLayoutProps = {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    children: ReactNode;
};

export default function AdminLayout({
    title,
    subtitle,
    actions,
    children,
}: AdminLayoutProps) {
    const { auth, flash } = usePage<{
        auth: Auth;
        flash?: FlashMessages;
    }>().props;
    const { appearance, updateAppearance } = useAppearance();
    const [mobileOpen, setMobileOpen] = useState(false);

    const user = auth.user;
    const roles = user?.roles ?? [];
    const isOrganizer = roles.includes('organizer');
    const roleLabel = isOrganizer ? 'Organizer' : 'Coordinator';
    const currentPath =
        typeof window !== 'undefined' ? window.location.pathname : '';

    const navItems = [
        {
            label: 'Dashboard',
            href: '/admin/dashboard',
            icon: LayoutDashboard,
            active: currentPath === '/admin/dashboard',
        },
        {
            label: 'Events & Divisions',
            href: '/admin/events',
            icon: CalendarDays,
            active: currentPath.startsWith('/admin/events'),
        },
        ...(isOrganizer
            ? [
                  {
                      label: 'Coordinators',
                      href: '/admin/coordinators',
                      icon: Users,
                      active: currentPath.startsWith('/admin/coordinators'),
                  },
              ]
            : []),
        {
            label: 'Screening Portal',
            href: '/admin/applications',
            icon: ClipboardCheck,
            active: currentPath.startsWith('/admin/applications'),
        },
        {
            label: 'Shifts & QR Codes',
            href: '/admin/shifts',
            icon: QrCode,
            active: currentPath.startsWith('/admin/shifts'),
        },
        {
            label: 'Attendance Logs',
            href: '/admin/attendance',
            icon: Clock,
            active: currentPath.startsWith('/admin/attendance'),
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

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Fixed-Height Sticky Desktop Sidebar */}
            <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
                <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
                    <VolunSyncLogo
                        variant="mark"
                        subtitle={`${roleLabel} Console`}
                    />
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Operations
                    </p>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                item.active
                                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            )}
                        >
                            <item.icon className="size-4 shrink-0" />
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    <div className="pt-4">
                        <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Priority 2 (Final Day)
                        </p>
                        <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-70">
                            <span className="flex items-center gap-3">
                                <FileArchive className="size-4" />
                                Document Archive
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                                P2
                            </Badge>
                        </div>
                    </div>

                    <div className="pt-4">
                        <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Switch View
                        </p>
                        <Link
                            href="/events"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                        >
                            <Compass className="size-4" />
                            <span>Public Event Explorer</span>
                        </Link>
                    </div>
                </nav>

                <div className="border-t border-sidebar-border p-3">
                    <Link
                        href="/settings/profile"
                        title="Click to edit profile"
                        className={cn(
                            'group flex items-center gap-3 rounded-xl border bg-card p-2.5 shadow-xs transition-all hover:border-primary/40 hover:bg-accent/50',
                            currentPath.startsWith('/settings')
                                ? 'border-primary bg-accent/60'
                                : 'border-border/70',
                        )}
                    >
                        <Avatar className="size-9 shrink-0 ring-1 ring-border">
                            {user?.avatar_url && (
                                <AvatarImage
                                    src={user.avatar_url}
                                    alt={user.name}
                                    className="object-cover"
                                />
                            )}
                            <AvatarFallback className="bg-soft text-xs font-semibold text-soft-foreground">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                                <p className="truncate text-sm font-semibold group-hover:text-primary">
                                    {user?.name}
                                </p>
                                {user?.is_profile_verified && (
                                    <BadgeCheck className="size-3.5 shrink-0 text-primary" />
                                )}
                            </div>
                            <p className="truncate text-[11px] text-muted-foreground">
                                Edit profile & settings
                            </p>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
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
                    <aside className="relative z-10 flex w-72 flex-col bg-sidebar p-4 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="font-bold">VolunSync Admin</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMobileOpen(false)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                        <nav className="space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                                        item.active
                                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                            : 'text-sidebar-foreground hover:bg-sidebar-accent',
                                    )}
                                >
                                    <item.icon className="size-4" />
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </aside>
                </div>
            )}

            {/* Main Area */}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/85 px-4 backdrop-blur-md lg:px-8">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu className="size-5" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="hidden text-xs text-muted-foreground sm:block">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {actions}
                        <Badge className="hidden bg-soft text-soft-foreground sm:inline-flex">
                            <Users className="mr-1 size-3" />
                            {roleLabel}
                        </Badge>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-7xl flex-1 p-4 lg:p-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-lg border border-primary/30 bg-success px-4 py-3 text-sm font-medium text-success-foreground">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                            {flash.error}
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}

import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import { VolunSyncLogo } from '@/components/volunsync-logo';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';

type PublicNavbarProps = {
    active?: 'home' | 'explore';
};

export function PublicNavbar({ active = 'home' }: PublicNavbarProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth?.user;

    const navLinks = [
        { label: 'Overview', href: '/#why', isActive: false },
        { label: 'Explore', href: '/events', isActive: active === 'explore' },
        { label: 'Modules', href: '/#focus', isActive: false },
        { label: 'Workflow', href: '/#workflow', isActive: false },
        { label: 'Passes', href: '/#passes', isActive: false },
        { label: 'FAQ', href: '/#faq', isActive: false },
    ];

    return (
        <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur-md dark:bg-background/90">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex shrink-0 items-center gap-2">
                    <VolunSyncLogo variant="mark" />
                    <span className="rounded bg-gradient-to-r from-[#008c8d] to-[#2563eb] px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">
                        26
                    </span>
                </Link>

                <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
                    {navLinks.map((item) =>
                        item.href.startsWith('/#') ? (
                            <a
                                key={item.label}
                                href={item.href}
                                className="transition-colors hover:text-foreground"
                            >
                                {item.label}
                            </a>
                        ) : (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    'transition-colors hover:text-foreground',
                                    item.isActive &&
                                        'font-semibold text-primary',
                                )}
                            >
                                {item.label}
                            </Link>
                        ),
                    )}
                </nav>

                <div className="flex items-center gap-3">
                    <span className="hidden font-mono text-[11px] tracking-wider text-muted-foreground uppercase lg:inline-block">
                        [ EDITION 2026 · LIVE ]
                    </span>

                    {!user && (
                        <Link
                            href="/login"
                            className="hidden text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
                        >
                            Sign in
                        </Link>
                    )}

                    <Link
                        href={user ? '/dashboard' : '/register'}
                        className="group inline-flex items-center gap-2.5 rounded-full bg-[#0e0f12] py-1.5 pr-1.5 pl-4 text-xs font-semibold text-white transition-transform hover:scale-[1.02] dark:bg-white dark:text-[#0e0f12]"
                    >
                        <span>{user ? 'Open console' : 'Get started'}</span>
                        <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#008c8d] to-[#2563eb] text-white transition-transform duration-300 group-hover:rotate-45">
                            <ArrowUpRight className="size-3.5" />
                        </span>
                    </Link>
                </div>
            </div>
        </header>
    );
}


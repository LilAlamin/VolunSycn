import { cn } from '@/lib/utils';

type VolunSyncLogoProps = {
    variant?: 'mark' | 'full';
    className?: string;
    subtitle?: string;
};

export function VolunSyncLogo({
    variant = 'mark',
    className,
    subtitle,
}: VolunSyncLogoProps) {
    if (variant === 'full') {
        return (
            <div
                className={cn(
                    'inline-flex items-center justify-center rounded-xl dark:bg-white dark:p-2',
                    className,
                )}
            >
                <img
                    src="/images/volunsync-logo.jpg"
                    alt="VolunSync — Community Volunteer Platform"
                    className="h-28 w-auto object-contain mix-blend-multiply dark:mix-blend-normal"
                />
            </div>
        );
    }

    return (
        <div className={cn('flex items-center gap-2.5', className)}>
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5 ring-1 ring-border/60 dark:ring-0">
                <img
                    src="/images/volunsync-mark.jpg"
                    alt="VolunSync Logo"
                    className="h-full w-full object-contain mix-blend-multiply"
                />
            </div>
            <div className="flex flex-col leading-tight">
                <span className="text-base font-bold tracking-tight text-foreground">
                    VolunSync
                </span>
                {subtitle && (
                    <span className="text-[11px] font-medium text-muted-foreground">
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    );
}


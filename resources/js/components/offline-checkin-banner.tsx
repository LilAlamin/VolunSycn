import { CheckCircle2, CloudUpload, RefreshCw, WifiOff, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type {
    PendingCheckIn,
    SyncFeedback,
} from '@/hooks/use-offline-checkin-queue';

type OfflineCheckInBannerProps = {
    isOffline: boolean;
    pendingCheckIn: PendingCheckIn | null;
    syncing: boolean;
    syncFeedback: SyncFeedback | null;
    onSyncNow: () => void;
    onDiscard: () => void;
    className?: string;
};

export function OfflineCheckInBanner({
    isOffline,
    pendingCheckIn,
    syncing,
    syncFeedback,
    onSyncNow,
    onDiscard,
    className,
}: OfflineCheckInBannerProps) {
    if (!isOffline && !pendingCheckIn && !syncFeedback) {
        return null;
    }

    return (
        <div className={className ? `space-y-3 ${className}` : 'space-y-3'}>
            {isOffline && (
                <Alert variant="destructive">
                    <WifiOff className="size-4" />
                    <AlertTitle>Low / Offline Venue Connectivity</AlertTitle>
                    <AlertDescription>
                        Your check-in payload will be cached locally on this
                        device and auto-synced as soon as signal returns.
                    </AlertDescription>
                </Alert>
            )}

            {pendingCheckIn && (
                <Alert className="border-warning/60 bg-warning/10">
                    <CloudUpload className="size-4 text-warning-foreground" />
                    <AlertTitle className="flex flex-wrap items-center justify-between gap-2">
                        <span>Pending Offline Check-In Queued</span>
                        <div className="flex items-center gap-1.5">
                            <Button
                                type="button"
                                size="sm"
                                variant="default"
                                className="h-7 px-2.5 text-xs"
                                disabled={isOffline || syncing}
                                onClick={onSyncNow}
                            >
                                <RefreshCw
                                    className={`mr-1.5 size-3.5 ${syncing ? 'animate-spin' : ''}`}
                                />
                                {syncing
                                    ? 'Syncing...'
                                    : isOffline
                                      ? 'Waiting for Signal'
                                      : 'Sync Pending Check-In'}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-muted-foreground"
                                disabled={syncing}
                                onClick={onDiscard}
                                title="Discard queued check-in"
                            >
                                <X className="size-3.5" />
                            </Button>
                        </div>
                    </AlertTitle>
                    <AlertDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span>
                            Token:{' '}
                            <code className="font-mono font-semibold text-foreground">
                                {pendingCheckIn.qr_token}
                            </code>
                        </span>
                        {pendingCheckIn.lat && pendingCheckIn.lng && (
                            <span className="font-mono">
                                GPS: {Number(pendingCheckIn.lat).toFixed(5)},{' '}
                                {Number(pendingCheckIn.lng).toFixed(5)}
                            </span>
                        )}
                        <span className="text-muted-foreground">
                            Saved{' '}
                            {new Date(
                                pendingCheckIn.savedAt,
                            ).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    </AlertDescription>
                </Alert>
            )}

            {syncFeedback && (
                <Alert
                    variant={
                        syncFeedback.type === 'error'
                            ? 'destructive'
                            : 'default'
                    }
                    className={
                        syncFeedback.type === 'success'
                            ? 'border-primary/40 bg-success/40'
                            : undefined
                    }
                >
                    <CheckCircle2 className="size-4" />
                    <AlertDescription className="text-xs font-medium">
                        {syncFeedback.message}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}


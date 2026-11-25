import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type PendingCheckIn = {
    qr_token: string;
    lat: string;
    lng: string;
    savedAt: string;
};

export type SyncFeedback = {
    type: 'success' | 'error';
    message: string;
};

const readStoredCheckIn = (storageKey: string): PendingCheckIn | null => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<PendingCheckIn>;
        if (!parsed.qr_token) return null;
        return {
            qr_token: String(parsed.qr_token),
            lat: String(parsed.lat ?? ''),
            lng: String(parsed.lng ?? ''),
            savedAt: String(parsed.savedAt ?? new Date().toISOString()),
        };
    } catch {
        return null;
    }
};

export function useOfflineCheckInQueue(storageKey: string) {
    const [isOffline, setIsOffline] = useState(
        typeof navigator !== 'undefined' ? !navigator.onLine : false,
    );
    const [pendingCheckIn, setPendingCheckIn] = useState<PendingCheckIn | null>(
        () => readStoredCheckIn(storageKey),
    );
    const [syncing, setSyncing] = useState(false);
    const [syncFeedback, setSyncFeedback] = useState<SyncFeedback | null>(null);

    const syncingRef = useRef(false);
    const pendingRef = useRef<PendingCheckIn | null>(pendingCheckIn);
    pendingRef.current = pendingCheckIn;

    // Reload pending queue if storageKey changes (e.g. switching division workspace)
    useEffect(() => {
        setPendingCheckIn(readStoredCheckIn(storageKey));
        setSyncFeedback(null);
    }, [storageKey]);

    const syncPendingCheckIn = useCallback(() => {
        const payload = pendingRef.current ?? readStoredCheckIn(storageKey);
        if (!payload || syncingRef.current) return;
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            setSyncFeedback({
                type: 'error',
                message: 'Still offline. Waiting for connection to return.',
            });
            return;
        }

        syncingRef.current = true;
        setSyncing(true);
        setSyncFeedback(null);

        router.post(
            '/volunteer/check-in',
            {
                qr_token: payload.qr_token,
                lat: payload.lat,
                lng: payload.lng,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    window.localStorage.removeItem(storageKey);
                    setPendingCheckIn(null);
                    setSyncFeedback({
                        type: 'success',
                        message:
                            'Pending offline check-in synced automatically!',
                    });
                },
                onError: (errors) => {
                    const firstError =
                        Object.values(errors)[0] ||
                        'Could not sync pending check-in. Please verify token or GPS coordinates.';
                    setSyncFeedback({
                        type: 'error',
                        message: String(firstError),
                    });
                },
                onFinish: () => {
                    syncingRef.current = false;
                    setSyncing(false);
                },
            },
        );
    }, [storageKey]);

    const queueCheckIn = useCallback(
        (payload: { qr_token: string; lat: string; lng: string }) => {
            const item: PendingCheckIn = {
                qr_token: payload.qr_token.trim(),
                lat: payload.lat,
                lng: payload.lng,
                savedAt: new Date().toISOString(),
            };
            window.localStorage.setItem(storageKey, JSON.stringify(item));
            setPendingCheckIn(item);
            setSyncFeedback({
                type: 'success',
                message:
                    'Check-in saved locally on this device. It will auto-sync as soon as connection returns.',
            });
        },
        [storageKey],
    );

    const discardPendingCheckIn = useCallback(() => {
        window.localStorage.removeItem(storageKey);
        setPendingCheckIn(null);
        setSyncFeedback(null);
    }, [storageKey]);

    // Listen for browser online/offline transitions and auto-sync when online
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            if (pendingRef.current || readStoredCheckIn(storageKey)) {
                syncPendingCheckIn();
            }
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // If already online on mount and a queued payload exists, auto-sync once
        if (
            typeof navigator !== 'undefined' &&
            navigator.onLine &&
            readStoredCheckIn(storageKey)
        ) {
            syncPendingCheckIn();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [storageKey, syncPendingCheckIn]);

    return {
        isOffline,
        pendingCheckIn,
        syncing,
        syncFeedback,
        queueCheckIn,
        syncPendingCheckIn,
        discardPendingCheckIn,
    };
}


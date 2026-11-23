export type GeoDetectionResult = {
    lat: number;
    lng: number;
    accuracyMeters: number | null;
    source: 'gps' | 'network' | 'ip';
    label: string;
};

function getPositionPromise(
    options: PositionOptions,
): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
}

async function fetchIpFallback(
    permissionDenied: boolean,
    rawReason?: string,
): Promise<GeoDetectionResult | null> {
    const endpoints = [
        async () => {
            const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
            if (!res.ok) return null;
            const json = (await res.json()) as {
                latitude?: string;
                longitude?: string;
                city?: string;
            };
            const lat = Number(json.latitude);
            const lng = Number(json.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return { lat, lng, city: json.city };
        },
        async () => {
            const res = await fetch('https://ipapi.co/json/');
            if (!res.ok) return null;
            const json = (await res.json()) as {
                latitude?: number;
                longitude?: number;
                city?: string;
            };
            const lat = Number(json.latitude);
            const lng = Number(json.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return { lat, lng, city: json.city };
        },
    ];

    for (const lookup of endpoints) {
        try {
            const found = await lookup();
            if (found) {
                const isInsecureOrigin =
                    typeof window !== 'undefined' &&
                    !window.isSecureContext &&
                    window.location.hostname === '127.0.0.1';
                const reasonHint = isInsecureOrigin
                    ? 'Open via http://localhost:8000 (Chrome blocks GPS on non-HTTPS 127.0.0.1).'
                    : rawReason?.toLowerCase().includes('denied')
                      ? 'Check macOS System Settings -> Privacy & Security -> Location Services -> Google Chrome.'
                      : 'Allow browser & OS Location access for exact GPS.';

                const prefix = permissionDenied
                    ? 'Device GPS unavailable — using approx. network location'
                    : 'Approx. network location';
                return {
                    lat: Number(found.lat.toFixed(6)),
                    lng: Number(found.lng.toFixed(6)),
                    accuracyMeters: null,
                    source: 'ip',
                    label: `${prefix}${found.city ? ` (${found.city})` : ''}: ${found.lat.toFixed(5)}, ${found.lng.toFixed(5)}. ${reasonHint}`,
                };
            }
        } catch {
            // Try next fallback endpoint
        }
    }

    return null;
}

export async function detectUserCoordinates(): Promise<GeoDetectionResult> {
    let permissionDenied = false;
    let rawReason: string | undefined;

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        try {
            const highAcc = await getPositionPromise({
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 60000,
            });

            return {
                lat: Number(highAcc.coords.latitude.toFixed(6)),
                lng: Number(highAcc.coords.longitude.toFixed(6)),
                accuracyMeters: Math.round(highAcc.coords.accuracy),
                source: 'gps',
                label: `GPS locked: ${highAcc.coords.latitude.toFixed(5)}, ${highAcc.coords.longitude.toFixed(5)} (±${Math.round(highAcc.coords.accuracy)}m)`,
            };
        } catch (err) {
            const geoErr = err as GeolocationPositionError | undefined;
            permissionDenied = geoErr?.code === 1;
            rawReason = geoErr?.message;

            if (!permissionDenied) {
                try {
                    const lowAcc = await getPositionPromise({
                        enableHighAccuracy: false,
                        timeout: 7000,
                        maximumAge: 120000,
                    });

                    return {
                        lat: Number(lowAcc.coords.latitude.toFixed(6)),
                        lng: Number(lowAcc.coords.longitude.toFixed(6)),
                        accuracyMeters: Math.round(lowAcc.coords.accuracy),
                        source: 'network',
                        label: `Location locked (Wi-Fi/Network): ${lowAcc.coords.latitude.toFixed(5)}, ${lowAcc.coords.longitude.toFixed(5)} (±${Math.round(lowAcc.coords.accuracy)}m)`,
                    };
                } catch (lowErr) {
                    const lowGeoErr = lowErr as GeolocationPositionError | undefined;
                    permissionDenied = lowGeoErr?.code === 1;
                    rawReason = lowGeoErr?.message ?? rawReason;
                }
            }
        }
    }

    // Fallback to IP geolocation even when browser GPS permission is blocked on desktop
    const ipResult = await fetchIpFallback(permissionDenied, rawReason);
    if (ipResult) {
        return ipResult;
    }

    if (permissionDenied) {
        throw new Error(
            'Browser Location is blocked (click the pin icon in the URL bar -> Allow). Or click Autofill Demo GPS.',
        );
    }

    throw new Error(
        'Unable to detect location. Please enable browser Location permission or use the Demo GPS button.',
    );
}

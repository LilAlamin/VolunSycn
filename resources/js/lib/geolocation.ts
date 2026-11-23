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

export async function detectUserCoordinates(): Promise<GeoDetectionResult> {
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

            // Retry with standard network/Wi-Fi accuracy if high-accuracy GPS timed out or failed
            if (geoErr?.code !== 1) {
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
                } catch {
                    // Fall through to IP fallback
                }
            } else {
                throw new Error(
                    'Location permission blocked by browser. Click the lock/site icon next to the URL bar and allow Location.',
                );
            }
        }
    }

    // Last-resort IP geolocation fallback when device CoreLocation/GPS is unavailable on desktop
    try {
        const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (res.ok) {
            const json = (await res.json()) as {
                latitude?: string;
                longitude?: string;
                city?: string;
            };
            const lat = Number(json.latitude);
            const lng = Number(json.longitude);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                return {
                    lat: Number(lat.toFixed(6)),
                    lng: Number(lng.toFixed(6)),
                    accuracyMeters: null,
                    source: 'ip',
                    label: `Approx. network location${json.city ? ` (${json.city})` : ''}: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                };
            }
        }
    } catch {
        // Ignore network error and throw user-friendly message
    }

    throw new Error(
        'Unable to detect location. Please enable browser Location permission or use the Demo GPS button.',
    );
}

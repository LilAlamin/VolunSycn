import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, MapPin, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type NominatimResult = {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
};

type VenueMapProps = {
    mode: 'picker' | 'checkin';
    venueLat: number;
    venueLng: number;
    radiusMeters: number;
    venueName?: string;
    userLat?: number | null;
    userLng?: number | null;
    onLocationChange?: (
        lat: number,
        lng: number,
        suggestedName?: string,
    ) => void;
    heightClass?: string;
};

function haversineMeters(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    return Math.round(R * 2 * Math.asin(Math.sqrt(a)));
}

function createPinIcon(color: string, label: string) {
    return L.divIcon({
        className: 'volunsync-map-pin',
        html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
            <div style="background:${color};color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:9999px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.28);border:1.5px solid #fff;">${label}</div>
            <div style="width:12px;height:12px;border-radius:9999px;background:${color};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);margin-top:2px;"></div>
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });
}

export function VenueMap({
    mode,
    venueLat,
    venueLng,
    radiusMeters,
    venueName = 'Event Venue',
    userLat = null,
    userLng = null,
    onLocationChange,
    heightClass = 'h-56',
}: VenueMapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const venueMarkerRef = useRef<L.Marker | null>(null);
    const circleRef = useRef<L.Circle | null>(null);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const lineRef = useRef<L.Polyline | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<NominatimResult[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);

    const safeLat = Number.isFinite(venueLat) ? venueLat : -6.8868;
    const safeLng = Number.isFinite(venueLng) ? venueLng : 107.6085;
    const safeRadius = Number.isFinite(radiusMeters) && radiusMeters > 0 ? radiusMeters : 200;

    const distanceMeters = useMemo(() => {
        if (
            mode !== 'checkin' ||
            userLat === null ||
            userLng === null ||
            !Number.isFinite(userLat) ||
            !Number.isFinite(userLng)
        ) {
            return null;
        }
        return haversineMeters(safeLat, safeLng, userLat, userLng);
    }, [mode, safeLat, safeLng, userLat, userLng]);

    // Initialize Leaflet Map once
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [safeLat, safeLng],
            zoom: 16,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        const venueMarker = L.marker([safeLat, safeLng], {
            draggable: mode === 'picker',
            icon: createPinIcon('#008c8d', 'Venue'),
        }).addTo(map);

        const circle = L.circle([safeLat, safeLng], {
            radius: safeRadius,
            color: '#008c8d',
            fillColor: '#008c8d',
            fillOpacity: 0.14,
            weight: 2,
        }).addTo(map);

        if (mode === 'picker') {
            map.on('click', (e: L.LeafletMouseEvent) => {
                onLocationChange?.(
                    Number(e.latlng.lat.toFixed(6)),
                    Number(e.latlng.lng.toFixed(6)),
                );
            });

            venueMarker.on('dragend', () => {
                const pos = venueMarker.getLatLng();
                onLocationChange?.(
                    Number(pos.lat.toFixed(6)),
                    Number(pos.lng.toFixed(6)),
                );
            });
        }

        mapRef.current = map;
        venueMarkerRef.current = venueMarker;
        circleRef.current = circle;

        // Ensure tiles fit cleanly inside dialogs/tabs
        const timer = window.setTimeout(() => map.invalidateSize(), 150);

        return () => {
            window.clearTimeout(timer);
            map.remove();
            mapRef.current = null;
            venueMarkerRef.current = null;
            circleRef.current = null;
            userMarkerRef.current = null;
            lineRef.current = null;
        };
    }, [mode]);

    // Sync Venue Coordinates & Radius updates
    useEffect(() => {
        const map = mapRef.current;
        const venueMarker = venueMarkerRef.current;
        const circle = circleRef.current;
        if (!map || !venueMarker || !circle) return;

        venueMarker.setLatLng([safeLat, safeLng]);
        circle.setLatLng([safeLat, safeLng]);
        circle.setRadius(safeRadius);

        if (userLat === null || userLng === null) {
            map.panTo([safeLat, safeLng], { animate: true });
        }
    }, [safeLat, safeLng, safeRadius, userLat, userLng]);

    // Sync Volunteer GPS Marker & Distance Line (Check-In mode)
    useEffect(() => {
        const map = mapRef.current;
        if (!map || mode !== 'checkin') return;

        if (
            userLat !== null &&
            userLng !== null &&
            Number.isFinite(userLat) &&
            Number.isFinite(userLng)
        ) {
            const within =
                distanceMeters !== null && distanceMeters <= safeRadius;
            const pinColor = within ? '#16a34a' : '#dc2626';

            if (!userMarkerRef.current) {
                userMarkerRef.current = L.marker([userLat, userLng], {
                    icon: createPinIcon(pinColor, 'You'),
                }).addTo(map);
            } else {
                userMarkerRef.current.setLatLng([userLat, userLng]);
                userMarkerRef.current.setIcon(createPinIcon(pinColor, 'You'));
            }

            if (!lineRef.current) {
                lineRef.current = L.polyline(
                    [
                        [safeLat, safeLng],
                        [userLat, userLng],
                    ],
                    {
                        color: pinColor,
                        dashArray: '5, 6',
                        weight: 2,
                    },
                ).addTo(map);
            } else {
                lineRef.current.setLatLngs([
                    [safeLat, safeLng],
                    [userLat, userLng],
                ]);
                lineRef.current.setStyle({ color: pinColor });
            }

            const bounds = L.latLngBounds([
                [safeLat, safeLng],
                [userLat, userLng],
            ]);
            map.fitBounds(bounds, { padding: [36, 36], maxZoom: 17 });
        } else {
            if (userMarkerRef.current) {
                userMarkerRef.current.remove();
                userMarkerRef.current = null;
            }
            if (lineRef.current) {
                lineRef.current.remove();
                lineRef.current = null;
            }
        }
    }, [mode, safeLat, safeLng, safeRadius, userLat, userLng, distanceMeters]);

    const searchOpenStreetMap = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        setSearchError(null);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=4&q=${encodeURIComponent(searchQuery.trim())}`,
                { headers: { Accept: 'application/json' } },
            );
            if (!res.ok) {
                throw new Error('Geocoding service unavailable.');
            }
            const data = (await res.json()) as NominatimResult[];
            setResults(data);
            if (data.length === 0) {
                setSearchError('No matching location found on OpenStreetMap.');
            }
        } catch {
            setSearchError('Unable to reach OpenStreetMap search right now.');
        } finally {
            setSearching(false);
        }
    };

    const locateOrganizer = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            onLocationChange?.(
                Number(pos.coords.latitude.toFixed(6)),
                Number(pos.coords.longitude.toFixed(6)),
            );
            mapRef.current?.setView(
                [pos.coords.latitude, pos.coords.longitude],
                16,
            );
        });
    };

    return (
        <div className="space-y-2.5">
            {mode === 'picker' && (
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        <div className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                            <Input
                                type="text"
                                className="h-8 pl-8 text-xs"
                                placeholder="Search venue on OpenStreetMap (e.g. Taman Balekambang, Monas)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        void searchOpenStreetMap();
                                    }
                                }}
                            />
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-8 text-xs"
                            disabled={searching}
                            onClick={() => void searchOpenStreetMap()}
                        >
                            {searching ? 'Searching...' : 'Find'}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={locateOrganizer}
                            title="Use my current GPS"
                        >
                            <LocateFixed className="mr-1 size-3.5" />
                            My GPS
                        </Button>
                    </div>

                    {searchError && (
                        <p className="text-xs text-destructive">
                            {searchError}
                        </p>
                    )}

                    {results.length > 0 && (
                        <div className="max-h-32 divide-y divide-border overflow-y-auto rounded-lg border border-border bg-card text-xs">
                            {results.map((item) => (
                                <button
                                    key={item.place_id}
                                    type="button"
                                    onClick={() => {
                                        const lat = Number(
                                            parseFloat(item.lat).toFixed(6),
                                        );
                                        const lng = Number(
                                            parseFloat(item.lon).toFixed(6),
                                        );
                                        const shortName =
                                            item.display_name.split(',')[0];
                                        onLocationChange?.(lat, lng, shortName);
                                        mapRef.current?.setView([lat, lng], 16);
                                        setResults([]);
                                    }}
                                    className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-surface"
                                >
                                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                                    <span className="line-clamp-2">
                                        {item.display_name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="relative overflow-hidden rounded-xl border border-border">
                <div
                    ref={containerRef}
                    className={`z-0 w-full ${heightClass}`}
                />

                {mode === 'checkin' && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface px-3 py-2 text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="size-3.5 text-primary" />
                            <span className="truncate font-medium text-foreground">
                                {venueName}
                            </span>
                            <span>({safeRadius}m radius)</span>
                        </span>

                        {distanceMeters !== null ? (
                            <Badge
                                className={
                                    distanceMeters <= safeRadius
                                        ? 'bg-success text-success-foreground'
                                        : 'bg-destructive/15 text-destructive'
                                }
                            >
                                {distanceMeters}m away ·{' '}
                                {distanceMeters <= safeRadius
                                    ? 'Inside Geofence ✓'
                                    : 'Outside Radius'}
                            </Badge>
                        ) : (
                            <span className="font-mono text-[11px] text-muted-foreground">
                                OpenStreetMap Geofence
                            </span>
                        )}
                    </div>
                )}

                {mode === 'picker' && (
                    <div className="flex items-center justify-between border-t border-border bg-surface px-3 py-1.5 text-[11px] text-muted-foreground">
                        <span>
                            Click map or drag the teal pin to adjust venue
                            coordinates
                        </span>
                        <span className="font-mono text-primary">
                            {safeRadius}m radius
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

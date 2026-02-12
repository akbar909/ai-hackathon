import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import type { OptimizedRoute, RiskZone } from '../types';

// Fix default marker icon issue with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons
const createNumberedIcon = (number: number, color: string) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 14px;
        ">${number}</span>
      </div>
    `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
};

interface RouteMapProps {
    route: OptimizedRoute | null;
    riskZones: RiskZone[];
    showRiskZones?: boolean;
}

const RouteMap: React.FC<RouteMapProps> = ({ route, riskZones, showRiskZones = true }) => {
    const [center, setCenter] = useState<[number, number]>([25.3960, 68.3578]); // Hyderabad, Pakistan default
    const [zoom, setZoom] = useState(12);

    useEffect(() => {
        if (route && route.coordinates.length > 0) {
            // Center map on route
            const lats = route.coordinates.map(c => c.lat);
            const lngs = route.coordinates.map(c => c.lng);
            const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
            const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
            setCenter([centerLat, centerLng]);
            setZoom(11);
        }
    }, [route]);

    const getRiskColor = (riskLevel: number): string => {
        if (riskLevel <= 3) return '#10b981';
        if (riskLevel <= 5) return '#f59e0b';
        if (riskLevel <= 7) return '#fb923c';
        return '#ef4444';
    };

    const getZoneColor = (zoneType: string): string => {
        switch (zoneType) {
            case 'construction': return '#f59e0b';
            case 'accident': return '#ef4444';
            case 'congestion': return '#fb923c';
            case 'crime': return '#a855f7';
            default: return '#6b7280';
        }
    };

    return (
        <div className="glass-card p-4 h-full">

            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Route Map</h3>
                    <p className="text-xs text-gray-400">Showing: <span className="text-blue-400 font-bold">Recommended Route</span></p>
                </div>
                {route && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="px-3 py-1 glass rounded-full">
                            {route.total_distance_km.toFixed(1)} km
                        </span>
                        <span className="px-3 py-1 glass rounded-full">
                            {route.total_time_min.toFixed(0)} min
                        </span>
                    </div>
                )}
            </div>

            <div className="rounded-xl overflow-hidden" style={{ height: '600px' }}>
                <MapContainer
                    center={center}
                    zoom={zoom}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Risk Zones */}
                    {showRiskZones && riskZones.map((zone, index) => (
                        <React.Fragment key={`zone-${index}`}>
                            <Circle
                                center={[zone.center.lat, zone.center.lng]}
                                radius={zone.radius_km * 1000}
                                pathOptions={{
                                    color: getZoneColor(zone.zone_type),
                                    fillColor: getZoneColor(zone.zone_type),
                                    fillOpacity: 0.15,
                                    weight: 2,
                                }}
                            />
                            <Marker
                                position={[zone.center.lat, zone.center.lng]}
                                icon={L.divIcon({
                                    className: 'risk-zone-label',
                                    html: `
                    <div style="
                      background: ${getZoneColor(zone.zone_type)};
                      color: white;
                      padding: 4px 8px;
                      border-radius: 6px;
                      font-size: 11px;
                      font-weight: bold;
                      white-space: nowrap;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    ">
                      ${zone.zone_type.toUpperCase()}
                    </div>
                  `,
                                    iconSize: [100, 20],
                                    iconAnchor: [50, 10],
                                })}
                            >
                                <Popup>
                                    <div className="text-gray-900">
                                        <strong>{zone.name}</strong><br />
                                        Type: {zone.zone_type}<br />
                                        Risk: {zone.risk_level}/10
                                    </div>
                                </Popup>
                            </Marker>
                        </React.Fragment>
                    ))}

                    {/* Route */}
                    {route && (
                        <>
                            {/* Start marker (green) */}
                            <Marker
                                position={[route.coordinates[0].lat, route.coordinates[0].lng]}
                                icon={createNumberedIcon(0, '#10b981')}
                            >
                                <Popup>
                                    <div className="text-gray-900">
                                        <strong>🟢 Start (Depot)</strong><br />
                                        {route.ordered_stops[0]}
                                    </div>
                                </Popup>
                            </Marker>

                            {/* Delivery stop markers */}
                            {route.coordinates.slice(1).map((coord, index) => (
                                <Marker
                                    key={`stop-${index}`}
                                    position={[coord.lat, coord.lng]}
                                    icon={createNumberedIcon(
                                        index + 1,
                                        index === route.coordinates.length - 2 ? '#ef4444' : '#3b82f6'
                                    )}
                                >
                                    <Popup>
                                        <div className="text-gray-900">
                                            <strong>
                                                {index === route.coordinates.length - 2
                                                    ? `🔴 Final Stop ${index + 1}`
                                                    : `📦 Stop ${index + 1}`
                                                }
                                            </strong><br />
                                            {route.ordered_stops[index + 1]}
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                            {/* Route line - use OSRM road geometry if available */}
                            {route.route_geometry ? (
                                <Polyline
                                    positions={route.route_geometry.map((c: number[]) => [c[1], c[0]] as [number, number])}
                                    pathOptions={{
                                        color: '#3b82f6',
                                        weight: 5,
                                        opacity: 0.85,
                                    }}
                                />
                            ) : (
                                <Polyline
                                    positions={route.coordinates.map(c => [c.lat, c.lng])}
                                    pathOptions={{
                                        color: '#3b82f6',
                                        weight: 4,
                                        opacity: 0.8,
                                        dashArray: '10, 5',
                                    }}
                                />
                            )}
                        </>
                    )}
                </MapContainer>
            </div>

            {/* Legend */}
            {showRiskZones && riskZones.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
                        <span>Construction</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                        <span>Accident</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fb923c' }}></div>
                        <span>Congestion</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#a855f7' }}></div>
                        <span>Crime</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RouteMap;

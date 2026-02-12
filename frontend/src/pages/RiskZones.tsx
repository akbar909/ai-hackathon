import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    AlertTriangle, ArrowLeft,
    Car,
    ChevronLeft, ChevronRight,
    Construction,
    Search, Shield, Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { getRiskZones } from '../services/api';
import type { RiskZone } from '../types';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ZONE_COLORS: Record<string, string> = {
    construction: '#f59e0b',
    accident: '#ef4444',
    congestion: '#fb923c',
    crime: '#a855f7',
};

const ZONE_ICONS: Record<string, React.ReactNode> = {
    construction: <Construction className="w-5 h-5" />,
    accident: <Car className="w-5 h-5" />,
    congestion: <AlertTriangle className="w-5 h-5" />,
    crime: <Users className="w-5 h-5" />,
};

const ZONES_PER_PAGE = 9;

const RiskZonesPage: React.FC = () => {
    const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const load = async () => {
            try {
                const zones = await getRiskZones();
                setRiskZones(zones);
            } catch (err) {
                console.error('Failed to load risk zones:', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedType, searchQuery]);

    // Filter by type + search
    const filteredZones = riskZones.filter((z) => {
        const matchesType = selectedType ? z.zone_type === selectedType : true;
        const matchesSearch = searchQuery
            ? z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            z.zone_type.toLowerCase().includes(searchQuery.toLowerCase())
            : true;
        return matchesType && matchesSearch;
    });

    // Pagination
    const totalPages = Math.ceil(filteredZones.length / ZONES_PER_PAGE);
    const paginatedZones = filteredZones.slice(
        (currentPage - 1) * ZONES_PER_PAGE,
        currentPage * ZONES_PER_PAGE
    );

    const zoneCounts = riskZones.reduce<Record<string, number>>((acc, z) => {
        acc[z.zone_type] = (acc[z.zone_type] || 0) + 1;
        return acc;
    }, {});

    const getRiskLabel = (level: number): string => {
        if (level <= 3) return 'Low';
        if (level <= 5) return 'Medium';
        if (level <= 7) return 'High';
        return 'Critical';
    };

    const getRiskBadgeColor = (level: number): string => {
        if (level <= 3) return 'bg-green-500/20 text-green-400';
        if (level <= 5) return 'bg-yellow-500/20 text-yellow-400';
        if (level <= 7) return 'bg-orange-500/20 text-orange-400';
        return 'bg-red-500/20 text-red-400';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner w-16 h-16 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading risk zones...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 px-4 md:px-6 relative">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-green-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-red-600/5 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto max-w-7xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-1">
                                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                    Risk Zones
                                </span>
                            </h1>
                            <p className="text-gray-400">
                                Safety analysis across your delivery area — {riskZones.length} zones tracked
                            </p>
                        </div>
                        <div className="glass px-6 py-3 rounded-full self-start">
                            <span className="text-sm flex items-center gap-2">
                                <Shield className="w-4 h-4 text-green-400" />
                                <span className="font-bold text-green-400">{riskZones.length}</span> zones monitored
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Filter Chips */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-wrap gap-3 mb-6"
                >
                    <button
                        onClick={() => setSelectedType(null)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedType === null
                            ? 'bg-white/15 text-white border border-white/20'
                            : 'glass text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        All ({riskZones.length})
                    </button>
                    {Object.entries(zoneCounts).map(([type, count]) => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(selectedType === type ? null : type)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${selectedType === type
                                ? 'border border-white/20 text-white'
                                : 'glass text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            style={selectedType === type ? { backgroundColor: `${ZONE_COLORS[type]}30` } : {}}
                        >
                            <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: ZONE_COLORS[type] }}
                            />
                            {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                        </button>
                    ))}
                </motion.div>

                {/* Map */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-4 mb-8"
                >
                    <div className="rounded-xl overflow-hidden" style={{ height: '500px' }}>
                        <MapContainer
                            center={[25.3960, 68.3578]}
                            zoom={12}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {filteredZones.map((zone, index) => (
                                <React.Fragment key={`zone-${index}`}>
                                    <Circle
                                        center={[zone.center.lat, zone.center.lng]}
                                        radius={zone.radius_km * 1000}
                                        pathOptions={{
                                            color: ZONE_COLORS[zone.zone_type] || '#6b7280',
                                            fillColor: ZONE_COLORS[zone.zone_type] || '#6b7280',
                                            fillOpacity: 0.2,
                                            weight: 2,
                                        }}
                                    />
                                    <Marker
                                        position={[zone.center.lat, zone.center.lng]}
                                        icon={L.divIcon({
                                            className: 'risk-zone-label',
                                            html: `
                                                <div style="
                                                    background: ${ZONE_COLORS[zone.zone_type] || '#6b7280'};
                                                    color: white;
                                                    padding: 4px 10px;
                                                    border-radius: 6px;
                                                    font-size: 11px;
                                                    font-weight: bold;
                                                    white-space: nowrap;
                                                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                                ">
                                                    ${zone.zone_type.toUpperCase()} (${zone.risk_level}/10)
                                                </div>
                                            `,
                                            iconSize: [120, 24],
                                            iconAnchor: [60, 12],
                                        })}
                                    >
                                        <Popup>
                                            <div className="text-gray-900">
                                                <strong>{zone.name}</strong><br />
                                                Type: {zone.zone_type}<br />
                                                Risk Level: {zone.risk_level}/10<br />
                                                Radius: {zone.radius_km} km
                                            </div>
                                        </Popup>
                                    </Marker>
                                </React.Fragment>
                            ))}
                        </MapContainer>
                    </div>
                </motion.div>

                {/* Search + Zone List Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <h2 className="text-xl font-bold">Zone Details</h2>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search zones by name or type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass text-sm text-white placeholder-gray-500 border border-white/10 focus:border-green-400/50 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Results count */}
                    <p className="text-sm text-gray-400 mb-4">
                        Showing {paginatedZones.length} of {filteredZones.length} zones
                        {searchQuery && <span> matching "<span className="text-white">{searchQuery}</span>"</span>}
                    </p>

                    {paginatedZones.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-gray-300 mb-1">No zones found</h3>
                            <p className="text-gray-500">Try adjusting your search or filter.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[400px] content-start">
                            {paginatedZones.map((zone, i) => (
                                <motion.div
                                    key={`${zone.name}-${i}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 * i }}
                                    className="glass-card p-5 hover:bg-white/5 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: `${ZONE_COLORS[zone.zone_type]}20`, color: ZONE_COLORS[zone.zone_type] }}
                                            >
                                                {ZONE_ICONS[zone.zone_type] || <AlertTriangle className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-sm">{zone.name}</h3>
                                                <span className="text-xs text-gray-400 capitalize">{zone.zone_type}</span>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRiskBadgeColor(zone.risk_level)}`}>
                                            {getRiskLabel(zone.risk_level)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="text-gray-400">
                                            Risk: <span className="text-white font-medium">{zone.risk_level}/10</span>
                                        </div>
                                        <div className="text-gray-400">
                                            Radius: <span className="text-white font-medium">{zone.radius_km} km</span>
                                        </div>
                                    </div>

                                    {/* Risk bar */}
                                    <div className="mt-3 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${(zone.risk_level / 10) * 100}%`,
                                                backgroundColor: ZONE_COLORS[zone.zone_type],
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg glass hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${currentPage === page
                                        ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                                        : 'glass text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg glass hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default RiskZonesPage;

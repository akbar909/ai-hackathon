import { motion } from 'framer-motion';
import {
    AlertCircle, ArrowLeft, Banknote,
    Calendar, Clock,
    Map, Route, Shield, Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CostDashboard from '../components/CostDashboard';
import ExplanationPanel from '../components/ExplanationPanel';
import RouteComparison from '../components/RouteComparison';
import RouteMap from '../components/RouteMap';
import { getHistoryDetail, getRiskZones } from '../services/api';
import type { RiskZone } from '../types';

const HistoryDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<any>(null);
    const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            try {
                const [detail, zones] = await Promise.all([
                    getHistoryDetail(id),
                    getRiskZones(),
                ]);
                if (detail.error) {
                    setError(detail.error);
                } else {
                    setData(detail);
                    setRiskZones(zones);
                }
            } catch (err: any) {
                console.error('Failed to load history detail:', err);
                setError('Failed to load optimization details.');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner w-16 h-16 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading optimization details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen py-8 px-4 md:px-6">
                <div className="container mx-auto max-w-7xl">
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <div className="glass-card p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Error</h2>
                        <p className="text-gray-400">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const hasFullDetails = data.has_full_details && data.full_details;
    const details = data.full_details;

    return (
        <div className="min-h-screen py-8 px-4 md:px-6 relative">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px]" />
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
                                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    Optimization Details
                                </span>
                            </h1>
                            <p className="text-gray-400 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(data.created_at).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                        {hasFullDetails && details.processing_time_ms && (
                            <div className="glass px-6 py-3 rounded-full self-start">
                                <span className="text-sm">
                                    ⚡ Optimized in <span className="font-bold text-blue-400">
                                        {details.processing_time_ms.toFixed(0)}ms
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Summary Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
                >
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Map className="w-5 h-5 text-blue-400" />
                            <span className="text-xs text-gray-400">Start</span>
                        </div>
                        <div className="text-sm font-medium truncate" title={data.start_location}>
                            {data.start_location}
                        </div>
                    </div>
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Route className="w-5 h-5 text-green-400" />
                            <span className="text-xs text-gray-400">Distance</span>
                        </div>
                        <div className="text-2xl font-bold">{data.total_distance_km.toFixed(1)} km</div>
                    </div>
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-yellow-400" />
                            <span className="text-xs text-gray-400">Time</span>
                        </div>
                        <div className="text-2xl font-bold">{data.total_time_min.toFixed(0)} min</div>
                    </div>
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Banknote className="w-5 h-5 text-green-400" />
                            <span className="text-xs text-gray-400">Cost</span>
                        </div>
                        <div className="text-2xl font-bold text-green-400">PKR {data.predicted_cost.toFixed(0)}</div>
                    </div>
                </motion.div>

                {hasFullDetails ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-8"
                    >
                        {/* Route Map */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <RouteMap
                                route={details.primary_route}
                                riskZones={riskZones}
                                showRiskZones={true}
                            />
                        </motion.div>

                        {/* Cost + Risk Dashboard */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <CostDashboard
                                cost={details.cost_prediction}
                                risk={details.risk_analysis}
                                distance={details.primary_route.total_distance_km}
                                time={details.primary_route.total_time_min}
                            />
                        </motion.div>

                        {/* Route Comparison */}
                        {details.alternatives && details.alternatives.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <RouteComparison
                                    primaryRoute={{
                                        distance: details.primary_route.total_distance_km,
                                        time: details.primary_route.total_time_min,
                                        cost: details.cost_prediction.predicted_cost_usd,
                                        risk: details.risk_analysis.total_risk_score,
                                    }}
                                    alternatives={details.alternatives}
                                />
                            </motion.div>
                        )}

                        {/* AI Explanation */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <ExplanationPanel explanation={details.explanation || null} />
                        </motion.div>
                    </motion.div>
                ) : (
                    /* No full details available - show summary only */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-12 text-center"
                    >
                        <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2 text-gray-300">
                            Detailed View Not Available
                        </h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            This optimization was created before detailed history tracking was enabled.
                            The summary data above is all that's available.
                        </p>
                        <Link
                            to="/optimizer"
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <Zap className="w-5 h-5" />
                            Create New Optimization
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default HistoryDetails;

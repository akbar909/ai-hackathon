import { motion } from 'framer-motion';
import {
    Activity, ArrowRight, Calendar, DollarSign,
    Map, Route, Shield, TrendingUp, Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface DashboardStats {
    total_routes: number;
    total_distance: number;
    total_cost: number;
    avg_risk_score: number;
    avg_quality_score: number;
    recent_routes: { date: string; distance: number; cost: number }[];
    member_since: string;
}

interface HistoryItem {
    id: string;
    start_location: string;
    num_stops: number;
    total_distance_km: number;
    total_time_min: number;
    predicted_cost: number;
    risk_score: number;
    quality_score: number;
    created_at: string;
}

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [statsRes, historyRes] = await Promise.all([
                    api.get('/api/dashboard/stats'),
                    api.get('/api/history'),
                ]);
                setStats(statsRes.data);
                setHistory(historyRes.data.history);
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner w-16 h-16 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Routes',
            value: stats?.total_routes || 0,
            icon: <Route className="w-6 h-6 text-blue-400" />,
            bg: 'bg-blue-500/10',
        },
        {
            label: 'Distance Optimized',
            value: `${(stats?.total_distance || 0).toFixed(0)} km`,
            icon: <Map className="w-6 h-6 text-green-400" />,
            bg: 'bg-green-500/10',
        },
        {
            label: 'Cost Predicted',
            value: `PKR ${(stats?.total_cost || 0).toFixed(0)}`,
            icon: <DollarSign className="w-6 h-6 text-purple-400" />,
            bg: 'bg-purple-500/10',
        },
        {
            label: 'Avg Safety Score',
            value: `${(100 - (stats?.avg_risk_score || 0) * 10).toFixed(0)}%`,
            icon: <Shield className="w-6 h-6 text-orange-400" />,
            bg: 'bg-orange-500/10',
        },
    ];

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
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
                >
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-1">
                            Welcome, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{user?.name?.split(' ')[0] || 'User'}</span>
                        </h1>
                        <p className="text-gray-400">
                            {stats?.member_since
                                ? `Member since ${new Date(stats.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                                : 'Your logistics command center'
                            }
                        </p>
                    </div>
                    <Link
                        to="/optimizer"
                        className="btn-primary flex items-center gap-2 whitespace-nowrap self-start"
                    >
                        <Zap className="w-5 h-5" />
                        New Optimization
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statCards.map((card, i) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-6 hover:bg-white/5 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                                    {card.icon}
                                </div>
                                <TrendingUp className="w-4 h-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-2xl font-bold mb-1">{card.value}</div>
                            <div className="text-sm text-gray-400">{card.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Distance Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card p-6"
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <Activity className="w-5 h-5 text-blue-400" />
                            <h3 className="text-lg font-semibold">Distance Trends</h3>
                        </div>
                        {stats?.recent_routes && stats.recent_routes.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={stats.recent_routes}>
                                    <defs>
                                        <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#666" fontSize={12} />
                                    <YAxis stroke="#666" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#1a1a1a',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="distance"
                                        stroke="#3b82f6"
                                        fill="url(#distGrad)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center">
                                <div className="text-center">
                                    <Map className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-500">No route data yet</p>
                                    <p className="text-gray-600 text-sm mt-1">Optimize a route to see trends here</p>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Cost Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass-card p-6"
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <DollarSign className="w-5 h-5 text-purple-400" />
                            <h3 className="text-lg font-semibold">Cost Analysis</h3>
                        </div>
                        {stats?.recent_routes && stats.recent_routes.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={stats.recent_routes}>
                                    <defs>
                                        <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0.2} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#666" fontSize={12} />
                                    <YAxis stroke="#666" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#1a1a1a',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                        }}
                                    />
                                    <Bar dataKey="cost" fill="url(#costGrad)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center">
                                <div className="text-center">
                                    <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-500">No cost data yet</p>
                                    <p className="text-gray-600 text-sm mt-1">Start optimizing to see cost analysis</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
                >
                    <Link to="/optimizer" className="glass-card p-6 hover:bg-white/5 transition-all group cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Optimize Route</h4>
                                <p className="text-sm text-gray-400">Plan a new delivery</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-600 ml-auto group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>
                    </Link>

                    <div className="glass-card p-6 hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold">View Risk Zones</h4>
                                <p className="text-sm text-gray-400">Safety analysis</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Efficiency</h4>
                                <p className="text-sm text-gray-400">Score: {stats?.avg_quality_score?.toFixed(0) || 0}%</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Route History */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="glass-card overflow-hidden"
                >
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <h3 className="text-lg font-semibold">Recent Optimizations</h3>
                        </div>
                        <span className="text-sm text-gray-500">{history.length} routes</span>
                    </div>

                    {history.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Start Location</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stops</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Distance</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cost</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Efficiency
                                            <span className="ml-1 text-gray-600 cursor-help" title="Composite score based on distance, cost, and risk factors">?</span>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {history.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-sm max-w-[200px] truncate">{item.start_location}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md text-xs font-medium">
                                                    {item.num_stops} stops
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">{item.total_distance_km.toFixed(1)} km</td>
                                            <td className="px-6 py-4 text-sm">{item.total_time_min.toFixed(0)} min</td>
                                            <td className="px-6 py-4 text-sm text-green-400">PKR {item.predicted_cost.toFixed(0)}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                                                            style={{ width: `${Math.min(item.quality_score, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-400">{item.quality_score.toFixed(0)}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <Route className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                            <h4 className="text-lg font-semibold text-gray-400 mb-2">No optimizations yet</h4>
                            <p className="text-gray-500 mb-6">Start optimizing routes to see your history here</p>
                            <Link to="/optimizer" className="btn-primary inline-flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                Optimize Your First Route
                            </Link>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;

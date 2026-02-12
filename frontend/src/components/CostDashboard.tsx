import { AlertTriangle, Clock, DollarSign, TrendingDown } from 'lucide-react';
import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CostPrediction, RiskAnalysis } from '../types';

interface CostDashboardProps {
    cost: CostPrediction;
    risk: RiskAnalysis;
    distance: number;
    time: number;
}

const CostDashboard: React.FC<CostDashboardProps> = ({ cost, risk, distance, time }) => {
    // Prepare cost breakdown data for bar chart
    const costData = [
        { name: 'Base Fuel', value: cost.cost_breakdown.base_fuel_cost, fill: '#3b82f6' },
        { name: 'Traffic', value: cost.cost_breakdown.traffic_penalty, fill: '#f59e0b' },
        { name: 'Idle Time', value: cost.cost_breakdown.idle_cost, fill: '#10b981' },
        { name: 'Stop Penalty', value: cost.cost_breakdown.stop_penalty, fill: '#8b5cf6' },
    ];

    // Risk zones by type for pie chart
    const riskZoneData = Object.entries(risk.zones_by_type || {}).map(([type, count]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: count,
    }));

    const RISK_COLORS: Record<string, string> = {
        Construction: '#f59e0b',
        Accident: '#ef4444',
        Congestion: '#fb923c',
        Crime: '#a855f7',
    };

    const getRiskLevelColor = (level: string): string => {
        switch (level) {
            case 'low': return 'text-success';
            case 'medium': return 'text-warning';
            case 'high': return 'text-orange-500';
            case 'critical': return 'text-danger';
            default: return 'text-gray-400';
        }
    };

    const getRiskLevelBg = (level: string): string => {
        switch (level) {
            case 'low': return 'bg-success/20';
            case 'medium': return 'bg-warning/20';
            case 'high': return 'bg-orange-500/20';
            case 'critical': return 'bg-danger/20';
            default: return 'bg-gray-500/20';
        }

    };

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = outerRadius * 1.25;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                {`${name}: ${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Cost */}
                <div className="glass-card p-5 hover-lift">
                    <div className="flex items-center justify-between mb-2">
                        <DollarSign className="w-8 h-8 text-success" />
                        <span className="text-xs text-gray-400">Predicted</span>
                    </div>
                    <div className="text-3xl font-bold text-success">
                        Rs. {cost.predicted_cost_usd.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        Range: Rs. {cost.confidence_lower.toFixed(0)} - Rs. {cost.confidence_upper.toFixed(0)}
                    </div>
                </div>

                {/* Risk Score */}
                <div className="glass-card p-5 hover-lift">
                    <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className={`w-8 h-8 ${getRiskLevelColor(risk.risk_level)}`} />
                        <span className={`text-xs px-2 py-1 rounded ${getRiskLevelBg(risk.risk_level)} ${getRiskLevelColor(risk.risk_level)}`}>
                            {risk.risk_level.toUpperCase()}
                        </span>
                    </div>
                    <div className={`text-3xl font-bold ${getRiskLevelColor(risk.risk_level)}`}>
                        {risk.total_risk_score.toFixed(1)}/10
                    </div>
                    <div className="text-xs text-white mt-1">
                        {risk.risk_zones_encountered.length} zones encountered
                    </div>
                </div>

                {/* Distance */}
                <div className="glass-card p-5 hover-lift">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingDown className="w-8 h-8 text-primary" />
                        <span className="text-xs text-gray-400">Total</span>
                    </div>
                    <div className="text-3xl font-bold text-primary">
                        {distance.toFixed(1)} km
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        {cost.cost_breakdown.estimated_fuel_liters.toFixed(1)}L fuel
                    </div>
                </div>

                {/* Time */}
                <div className="glass-card p-5 hover-lift">
                    <div className="flex items-center justify-between mb-2">
                        <Clock className="w-8 h-8 text-warning" />
                        <span className="text-xs text-gray-400">Estimated</span>
                    </div>
                    <div className="text-3xl font-bold text-warning">
                        {Math.floor(time)} min
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        {(time / 60).toFixed(1)} hours
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Breakdown Bar Chart */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={costData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#ffffff', fontSize: 12 }}
                                stroke="rgba(254, 251, 251, 0.2)"
                            />
                            <YAxis
                                tick={{ fill: '#ffffff', fontSize: 12 }}
                                stroke="rgba(254, 251, 251, 0.2)"
                                label={{ value: 'PKR (Rs.)', angle: -90, position: 'insideLeft', fill: '#ffffff' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(26, 26, 26, 0.95)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                }}
                                itemStyle={{ color: '#fff' }}
                                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                            />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Risk Zones Pie Chart */}
                {riskZoneData.length > 0 ? (
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold mb-4">Risk Zones Encountered</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={riskZoneData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    labelLine={true}
                                    label={renderCustomizedLabel}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {riskZoneData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#6b7280'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(26, 26, 26, 0.95)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        color: '#fff',
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: '12px', color: '#ffffff' }}
                                    iconType="circle"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="glass-card p-6 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No risk zones encountered</p>
                            <p className="text-xs mt-1">This is a safe route!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CostDashboard;

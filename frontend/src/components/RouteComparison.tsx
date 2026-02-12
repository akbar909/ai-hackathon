import { ArrowRight, CheckCircle, Route } from 'lucide-react';
import React from 'react';
import type { AlternativeRoute } from '../types';

interface RouteComparisonProps {
    primaryRoute: {
        distance: number;
        time: number;
        cost: number;
        risk: number;
    };
    alternatives: AlternativeRoute[];
}

const RouteComparison: React.FC<RouteComparisonProps> = ({ primaryRoute, alternatives }) => {
    const getRiskColor = (risk: number): string => {
        if (risk < 2) return 'text-success';
        if (risk < 5) return 'text-warning';
        if (risk < 7) return 'text-orange-500';
        return 'text-danger';
    };

    const calculateSavings = (altCost: number): string => {
        const diff = primaryRoute.cost - altCost;
        if (diff > 0) {
            return `Save Rs. ${Math.abs(diff).toFixed(0)}`;
        } else if (diff < 0) {
            return `+Rs. ${Math.abs(diff).toFixed(0)} more`;
        }
        return 'Same cost';
    };

    return (
        <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Route className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Route Alternatives</h2>
            </div>

            {/* Primary Route */}
            <div className="mb-6 p-4 rounded-lg bg-primary/10 border-2 border-primary">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        Recommended Route
                    </h3>
                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                        OPTIMAL
                    </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                        <div className="text-xs text-gray-400">Distance</div>
                        <div className="text-lg font-bold">{primaryRoute.distance.toFixed(1)} km</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Time</div>
                        <div className="text-lg font-bold">{Math.floor(primaryRoute.time)} min</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Cost</div>
                        <div className="text-lg font-bold text-success">Rs. {primaryRoute.cost.toFixed(0)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Risk</div>
                        <div className={`text-lg font-bold ${getRiskColor(primaryRoute.risk)}`}>
                            {primaryRoute.risk.toFixed(1)}/10
                        </div>
                    </div>
                </div>
            </div>

            {/* Alternative Routes */}
            <div className="space-y-4">
                {alternatives.length > 0 ? (
                    alternatives.map((alt, index) => (
                        <div
                            key={index}
                            className="glass p-4 rounded-lg hover:bg-white/5 transition-all hover-lift"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h4 className="font-semibold text-lg">{alt.route.ordered_stops.length > 0 ? getAlternativeName(index) : alt.recommendation}</h4>
                                <span className="text-xs text-gray-400">
                                    {calculateSavings(alt.cost.predicted_cost_usd)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                <div>
                                    <div className="text-xs text-gray-400">Distance</div>
                                    <div className="font-semibold">
                                        {alt.route.total_distance_km.toFixed(1)} km
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {getDifferenceText(primaryRoute.distance, alt.route.total_distance_km, 'km')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">Time</div>
                                    <div className="font-semibold">
                                        {Math.floor(alt.route.total_time_min)} min
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {getDifferenceText(primaryRoute.time, alt.route.total_time_min, 'min')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">Cost</div>
                                    <div className="font-semibold text-success">
                                        Rs. {alt.cost.predicted_cost_usd.toFixed(0)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {getDifferenceText(primaryRoute.cost, alt.cost.predicted_cost_usd, 'Rs.', true)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">Risk</div>
                                    <div className={`font-semibold ${getRiskColor(alt.route.total_risk_score)}`}>
                                        {alt.route.total_risk_score.toFixed(1)}/10
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {getDifferenceText(primaryRoute.risk, alt.route.total_risk_score, '', true)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-white/5 rounded-lg">
                                <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="text-xs font-medium text-primary mb-1">Trade-offs</div>
                                    <p className="text-sm text-gray-300">{alt.trade_offs}</p>
                                </div>
                            </div>

                            {alt.recommendation && (
                                <div className="mt-3 text-xs text-gray-400 italic">
                                    💡 {alt.recommendation}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <Route className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No alternative routes available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper functions
const getAlternativeName = (index: number): string => {
    const names = ['Shortest Distance', 'Safest Route', 'Off-Peak Schedule'];
    return names[index] || `Alternative ${index + 1}`;
};

const getDifferenceText = (
    primary: number,
    alternative: number,
    unit: string,
    lowerIsBetter: boolean = false
): string => {
    const diff = alternative - primary;
    const absDiff = Math.abs(diff);

    if (Math.abs(diff) < 0.01) {
        return 'Same';
    }

    const isWorse = lowerIsBetter ? diff > 0 : diff > 0;
    const prefix = isWorse ? '+' : '';
    const color = isWorse ? 'text-danger' : 'text-success';

    return `${prefix}${absDiff.toFixed(1)}${unit}`;
};

export default RouteComparison;

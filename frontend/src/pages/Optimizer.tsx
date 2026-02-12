import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import CostDashboard from '../components/CostDashboard';
import DeliveryForm from '../components/DeliveryForm';
import ExplanationPanel from '../components/ExplanationPanel';
import RouteComparison from '../components/RouteComparison';
import RouteMap from '../components/RouteMap';
import { getRiskZones, optimizeRoute } from '../services/api';
import type { DeliveryRequest, RiskZone, RouteResponse } from '../types';

const Optimizer: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<RouteResponse | null>(null);
    const [riskZones, setRiskZones] = useState<RiskZone[]>([]);

    // Load risk zones on mount
    useEffect(() => {
        const loadRiskZones = async () => {
            try {
                const zones = await getRiskZones();
                setRiskZones(zones);
            } catch (err) {
                console.error('Failed to load risk zones:', err);
            }
        };
        loadRiskZones();
    }, []);

    const handleOptimize = async (request: DeliveryRequest) => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await optimizeRoute(request);
            setResult(response);

            // Scroll to results
            setTimeout(() => {
                document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        } catch (err: any) {
            console.error('Optimization error:', err);

            // Safely extract error message
            let errorMessage = 'Failed to optimize route. Please check your inputs and try again.';

            if (err.response?.data?.detail) {
                // Handle Pydantic validation errors
                if (Array.isArray(err.response.data.detail)) {
                    errorMessage = err.response.data.detail
                        .map((e: any) => `${e.loc?.join(' → ') || 'Field'}: ${e.msg}`)
                        .join('; ');
                } else if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else {
                    errorMessage = JSON.stringify(err.response.data.detail);
                }
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-8 px-4 md:px-6">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Route Optimizer
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Enter your delivery details below to get the optimal route
                    </p>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Left Column - Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-1"
                    >
                        <DeliveryForm onSubmit={handleOptimize} isLoading={isLoading} />
                    </motion.div>

                    {/* Right Column - Map */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <RouteMap
                            route={result?.primary_route || null}
                            riskZones={riskZones}
                            showRiskZones={true}
                        />
                    </motion.div>
                </div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6 mb-8 border-2 border-danger/50"
                    >
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-danger flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-danger mb-1">Optimization Failed</h3>
                                <p className="text-gray-300">{error}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Results Section */}
                {result && (
                    <motion.div
                        id="results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-8"
                    >
                        {/* Processing Time Badge */}
                        <div className="flex justify-center">
                            <div className="glass px-6 py-3 rounded-full">
                                <span className="text-sm">
                                    ⚡ Optimized in <span className="font-bold text-primary">
                                        {result.processing_time_ms.toFixed(0)}ms
                                    </span>
                                </span>
                            </div>
                        </div>

                        {/* Cost Dashboard */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <CostDashboard
                                cost={result.cost_prediction}
                                risk={result.risk_analysis}
                                distance={result.primary_route.total_distance_km}
                                time={result.primary_route.total_time_min}
                            />
                        </motion.div>

                        {/* Route Comparison */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <RouteComparison
                                primaryRoute={{
                                    distance: result.primary_route.total_distance_km,
                                    time: result.primary_route.total_time_min,
                                    cost: result.cost_prediction.predicted_cost_usd,
                                    risk: result.risk_analysis.total_risk_score,
                                }}
                                alternatives={result.alternatives}
                            />
                        </motion.div>

                        {/* AI Explanation */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <ExplanationPanel explanation={result.explanation || null} />
                        </motion.div>
                    </motion.div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="glass-card p-12 text-center">
                        <div className="spinner w-16 h-16 mx-auto mb-4"></div>
                        <h3 className="text-xl font-semibold mb-2">Optimizing Your Route...</h3>
                        <p className="text-gray-400">
                            Our AI is analyzing thousands of route combinations
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Optimizer;

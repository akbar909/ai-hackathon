import { motion } from 'framer-motion';
import { ArrowRight, Brain, Globe, Map, Shield, TrendingUp, Truck, Zap } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a0a0a]">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6">
                <div className="container mx-auto text-center max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-300">AI-Powered Route Intelligence v2.0</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight">
                            Smart Logistics <br />
                            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Made Simple
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
                            Optimize complex delivery routes, predict fuel costs, and minimize risks with our advanced AI decision engine.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link to="/optimizer" className="btn-primary text-lg px-8 py-4 flex items-center gap-2 group">
                                Start Optimizing
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#features" className="px-8 py-4 rounded-lg glass hover:bg-white/10 transition-colors flex items-center gap-2 text-white font-medium">
                                How It Works
                            </a>
                        </div>
                    </motion.div>

                    {/* Stats Strip */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 border-t border-white/10 pt-10"
                    >
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-sm text-gray-500 uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 px-6 relative">
                <div className="container mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Choose Us?</h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Built for modern logistics teams who need speed, accuracy, and safety.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="glass-card p-8 hover:bg-white/5 transition-colors group"
                            >
                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works (Timeline) */}
            <section className="py-24 px-6 bg-gradient-to-b from-transparent to-purple-900/10">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                        <div className="flex-1">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">
                                Optimized in Seconds
                            </h2>
                            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                Stop wasting hours on manual route planning. Our AI processes thousands of variables instantly to give you the perfect plan.
                            </p>

                            <div className="space-y-6">
                                {steps.map((step, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 mt-1">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-semibold text-lg">{step.title}</h4>
                                            <p className="text-gray-500 mt-1">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 w-full relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-[60px] rounded-full" />
                            <div className="glass-card p-6 relative border border-white/10 bg-black/40 backdrop-blur-xl">
                                {/* Mock UI for Step Visualization */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                        <div className="flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                            <div className="w-3 h-3 rounded-full bg-green-500" />
                                        </div>
                                        <div className="text-xs text-gray-500">Route Analysis</div>
                                    </div>
                                    <div className="h-40 rounded bg-white/5 flex items-center justify-center border border-dashed border-white/10">
                                        <Map className="w-12 h-12 text-gray-600" />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="h-2 flex-1 rounded bg-blue-500/50" />
                                        <div className="h-2 w-12 rounded bg-purple-500/50" />
                                    </div>
                                    <div className="h-2 w-2/3 rounded bg-gray-700" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6 text-center">
                <div className="container mx-auto max-w-4xl">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        className="glass-card p-12 md:p-20 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                        <h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">
                            Ready to Transform Your Logistics?
                        </h2>
                        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto relative z-10">
                            Join thousands of logistics managers optimizing their fleet with AI precision.
                        </p>
                        <Link to="/optimizer" className="btn-primary text-xl px-10 py-5 inline-flex items-center gap-3 relative z-10">
                            Get Started Free
                            <ArrowRight className="w-6 h-6" />
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

const stats = [
    { value: '30%', label: 'Cost Reduction' },
    { value: '10k+', label: 'Routes Optimized' },
    { value: '99.9%', label: 'Risk Detection' },
    { value: '24/7', label: 'Availability' },
];

const features = [
    {
        icon: <TrendingUp className="w-6 h-6 text-white" />,
        title: 'Cost Intelligence',
        description: 'Advanced ML models predict fuel costs with 95% accuracy using real-time traffic data.',
        gradient: 'from-green-400 to-emerald-600'
    },
    {
        icon: <Shield className="w-6 h-6 text-white" />,
        title: 'Risk Shield',
        description: 'Proactively identifies and avoids high-risk zones to ensure driver safety and cargo security.',
        gradient: 'from-orange-400 to-red-600'
    },
    {
        icon: <Brain className="w-6 h-6 text-white" />,
        title: 'AI Reasoning',
        description: 'Large Language Models explain every route decision in plain English.',
        gradient: 'from-purple-400 to-indigo-600'
    },
    {
        icon: <Map className="w-6 h-6 text-white" />,
        title: 'Interactive Maps',
        description: 'Visualize your entire fleet operations on beautiful, responsive vector maps.',
        gradient: 'from-blue-400 to-cyan-600'
    },
    {
        icon: <Truck className="w-6 h-6 text-white" />,
        title: 'Fleet Management',
        description: 'Manage vehicle types, fuel efficiency, and capacity constraints effortlessly.',
        gradient: 'from-pink-400 to-rose-600'
    },
    {
        icon: <Globe className="w-6 h-6 text-white" />,
        title: 'Global Coverage',
        description: 'Optimizes routes anywhere in the world with OpenStreetMap integration.',
        gradient: 'from-yellow-400 to-amber-600'
    }
];

const steps = [
    { title: 'Input Stops', desc: 'Add your starting point and all delivery locations.' },
    { title: 'Set Constraints', desc: 'Define vehicle type, time windows, and priorities.' },
    { title: 'AI Analysis', desc: 'Our engine computes millions of possibilities instantly.' },
    { title: 'Execute', desc: 'Get turn-by-turn navigation and cost breakdown.' }
];

export default Home;

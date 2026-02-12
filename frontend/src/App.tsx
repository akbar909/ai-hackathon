import { Home as HomeIcon, Truck } from 'lucide-react';
import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './index.css';
import Home from './pages/Home';
import Optimizer from './pages/Optimizer';

function App() {
    return (
        <Router>
            <div className="min-h-screen flex flex-col">
                {/* Navbar */}
                <nav className="glass border-b border-white/10 sticky top-0 z-50">
                    <div className="container mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <Truck className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xl font-bold">AI Logistics</span>
                            </Link>

                            <div className="flex items-center gap-4">
                                <Link
                                    to="/"
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <HomeIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">Home</span>
                                </Link>
                                <Link
                                    to="/optimizer"
                                    className="btn-primary"
                                >
                                    Optimize Route
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="flex-1">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/optimizer" element={<Optimizer />} />
                    </Routes>
                </main>

                {/* Footer */}
                <footer className="glass border-t border-white/10 py-8">
                    <div className="container mx-auto px-6">
                        <div className="text-center text-gray-400 text-sm">
                            <p className="mb-2">
                                AI Logistics Route Optimizer - Hackathon Project 2026
                            </p>
                            <p className="flex items-center justify-center gap-2">
                                Built with React, FastAPI, OR-Tools, and Gemini AI
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </Router>
    );
}

export default App;

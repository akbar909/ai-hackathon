import { Home as HomeIcon, LayoutDashboard, LogIn, LogOut, Menu, Truck, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Logo from './components/Logo';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';
import Dashboard from './pages/Dashboard';
import HistoryDetails from './pages/HistoryDetails';
import Home from './pages/Home';
import Login from './pages/Login';
import Optimizer from './pages/Optimizer';
import Register from './pages/Register';
import RiskZones from './pages/RiskZones';

function Navbar() {
    const { isAuthenticated, user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    const navLinks = isAuthenticated
        ? [
            { to: '/', label: 'Home', icon: <HomeIcon className="w-5 h-5" /> },
            { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
            { to: '/optimizer', label: 'Optimize Route', icon: <Truck className="w-5 h-5" /> },
        ]
        : [
            { to: '/', label: 'Home', icon: <HomeIcon className="w-5 h-5" /> },
            { to: '/optimizer', label: 'Optimize', icon: <Truck className="w-5 h-5" /> },
            { to: '/login', label: 'Login', icon: <LogIn className="w-5 h-5" /> },
            { to: '/register', label: 'Sign Up', icon: <UserPlus className="w-5 h-5" /> },
        ];

    return (
        <>
            {/* Navbar */}
            <nav className="bg-[#0d0d0d]/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-[9999]">
                <div className="container mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="hover:opacity-80 transition-opacity">
                            <Logo />
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-3">
                            <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm">
                                <HomeIcon className="w-4 h-4" />
                                Home
                            </Link>

                            {isAuthenticated ? (
                                <>
                                    <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm">
                                        <LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </Link>
                                    <Link to="/optimizer" className="btn-primary text-sm !py-2 !px-4">
                                        Optimize
                                    </Link>
                                    <div className="flex items-center gap-2 ml-1">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <button
                                            onClick={logout}
                                            className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm text-gray-400 hover:text-white"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link to="/optimizer" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm">
                                        Optimize
                                    </Link>
                                    <Link to="/login" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm">
                                        <LogIn className="w-4 h-4" />
                                        Login
                                    </Link>
                                    <Link to="/register" className="btn-primary text-sm !py-2 !px-4 flex items-center gap-1">
                                        <UserPlus className="w-4 h-4" />
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] md:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Mobile Sidebar Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-72 bg-[#111111] border-l border-white/10 z-[10001] transform transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <span className="font-bold text-lg">Menu</span>
                    <button onClick={closeSidebar} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* User Info (if authenticated) */}
                {isAuthenticated && user && (
                    <div className="p-5 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <div className="font-semibold text-sm">{user.name}</div>
                                <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Nav Links */}
                <div className="p-4 space-y-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            onClick={closeSidebar}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-sm"
                        >
                            {link.icon}
                            {link.label}
                        </Link>
                    ))}

                    {/* Logout in sidebar */}
                    {isAuthenticated && (
                        <button
                            onClick={() => {
                                logout();
                                closeSidebar();
                            }}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-sm text-red-400 w-full text-left mt-4"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}

function AppContent() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/optimizer" element={<Optimizer />} />
                    <Route
                        path="/login"
                        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
                    />
                    <Route
                        path="/register"
                        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />}
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/history/:id"
                        element={
                            <ProtectedRoute>
                                <HistoryDetails />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/risk-zones" element={<RiskZones />} />
                </Routes>
            </main>

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
    );
}

function App() {
    return (
        <Router>
            <ScrollToTop />
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
}

export default App;

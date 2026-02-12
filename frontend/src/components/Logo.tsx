import React from 'react';

interface LogoProps {
    className?: string;
    showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", showText = true }) => {
    return (
        <div className="flex items-center gap-3 select-none">
            <div className={`relative ${className} flex items-center justify-center`}>
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-lg"
                >
                    <defs>
                        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" /> {/* blue-500 */}
                            <stop offset="100%" stopColor="#9333ea" /> {/* purple-600 */}
                        </linearGradient>
                    </defs>

                    {/* Background Shape (Hexagon/Circuit Node) */}
                    <path
                        d="M50 5 L93 30 V80 L50 105 L7 80 V30 Z"
                        fill="url(#logoGradient)"
                        opacity="0.2"
                        transform="scale(0.8) translate(12, -5)"
                    />

                    {/* Main Pin Shape */}
                    <path
                        d="M50 15 C33.43 15 20 28.43 20 45 C20 65 50 95 50 95 C50 95 80 65 80 45 C80 28.43 66.57 15 50 15 Z"
                        fill="url(#logoGradient)"
                    />

                    {/* Inner Circuit/Brain Lines */}
                    <path
                        d="M50 30 V45 M50 45 L60 55 M50 45 L40 55"
                        stroke="white"
                        strokeWidth="6"
                        strokeLinecap="round"
                    />
                    <circle cx="50" cy="45" r="4" fill="white" />
                </svg>
            </div>

            {showText && (
                <div className="flex flex-col">
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-none">
                        AI Logistics
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">
                        Route Optimizer
                    </span>
                </div>
            )}
        </div>
    );
};

export default Logo;

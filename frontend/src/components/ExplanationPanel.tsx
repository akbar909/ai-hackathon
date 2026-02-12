import { Brain, Lightbulb } from 'lucide-react';
import React from 'react';
import type { RouteExplanation } from '../types';

interface ExplanationPanelProps {
    explanation: RouteExplanation | null;
}

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ explanation }) => {
    if (!explanation) {
        return (
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold">AI Insights</h2>
                </div>
                <div className="text-center py-8 text-gray-400">
                    <Brain className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p>AI explanation will appear here after route optimization</p>
                    <p className="text-sm mt-2">
                        The AI will explain why this route was chosen and what trade-offs were made
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">AI Insights</h2>
            </div>

            {/* Summary */}
            <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-start gap-3">
                    <Lightbulb className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Summary</h3>
                        <p className="text-gray-200">{explanation.summary}</p>
                    </div>
                </div>
            </div>

            {/* Reasoning */}
            <div className="mb-6">
                <h3 className="font-semibold text-md mb-3 text-purple-300">🎯 Why This Route?</h3>
                <p className="text-gray-300 leading-relaxed">{explanation.reasoning}</p>
            </div>

            {/* Trade-offs */}
            <div className="mb-6">
                <h3 className="font-semibold text-md mb-3 text-blue-300">⚖️ Trade-offs</h3>
                <p className="text-gray-300 leading-relaxed">{explanation.trade_offs}</p>
            </div>

            {/* Recommendations */}
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <h3 className="font-semibold text-md mb-3 text-success">💡 Recommendations</h3>
                <p className="text-gray-300 leading-relaxed">{explanation.recommendations}</p>
            </div>

            {/* AI Badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Brain className="w-4 h-4" />
                <span>Powered by AI (Gemini)</span>
            </div>
        </div>
    );
};

export default ExplanationPanel;

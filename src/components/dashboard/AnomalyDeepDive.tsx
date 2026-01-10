// src/components/dashboard/AnomalyDeepDive.tsx
'use client';

import { motion } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info, Zap, Cloud, FileText, Grid3x3 } from 'lucide-react';
import type { AuditEventWithDetails } from '@/types/database';

interface AnomalyDeepDiveProps {
    audit: AuditEventWithDetails;
    onClose: () => void;
}

export default function AnomalyDeepDive({ audit, onClose }: AnomalyDeepDiveProps) {
    // Parse the raw_json to get context data
    const rawData = audit.iot_logs?.raw_json as any;
    const contextData = rawData?.context_data;
    const billData = rawData?.bill_data;

    // Calculate variance
    const billMaxLoad = billData?.maxLoadKwh || 0;
    const actualLoad = audit.energy_kwh || 0;
    const variance = ((actualLoad - billMaxLoad) / billMaxLoad) * 100;
    const isOverLimit = actualLoad > billMaxLoad;

    // Determine if weather justifies high usage
    const temp = contextData?.weather?.temp_c || 0;
    const isHotWeather = temp > 30; // Hot weather might justify AC usage
    const isColdWeather = temp < 15; // Cold weather might justify heating

    // Determine if grid carbon is high
    const gridIntensity = contextData?.grid?.grid_carbon_intensity || 0;
    const isHighCarbon = gridIntensity > 500;

    const comparisonData = [
        {
            title: 'Bill Data',
            icon: FileText,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/30',
            items: [
                { label: 'Billing Period', value: billData?.billingPeriod || 'N/A', isAnomaly: false },
                { label: 'Max Allowed Load', value: `${billMaxLoad} kWh`, isAnomaly: isOverLimit },
                { label: 'Pricing Tier', value: billData?.pricing_tier || 'Commercial', isAnomaly: false },
            ],
        },
        {
            title: 'IoT Sensor Data',
            icon: Zap,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/30',
            items: [
                { label: 'Actual Load', value: `${actualLoad} kWh`, isAnomaly: isOverLimit },
                { label: 'Variance', value: `${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`, isAnomaly: Math.abs(variance) > 20 },
                { label: 'Timestamp', value: audit.timestamp ? new Date(audit.timestamp).toLocaleString() : 'N/A', isAnomaly: false },
            ],
        },
        {
            title: 'Weather Context',
            icon: Cloud,
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'border-cyan-500/30',
            items: [
                { label: 'Temperature', value: `${temp?.toFixed(2)}°C`, isAnomaly: !isHotWeather && !isColdWeather && isOverLimit },
                { label: 'Condition', value: contextData?.weather?.condition || 'Unknown', isAnomaly: false },
                { label: 'Humidity', value: `${contextData?.weather?.humidity || 0}%`, isAnomaly: false },
            ],
        },
        {
            title: 'Grid Carbon Data',
            icon: Grid3x3,
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/30',
            items: [
                { label: 'Carbon Intensity', value: `${gridIntensity} gCO2/kWh`, isAnomaly: isHighCarbon },
                { label: 'Status', value: isHighCarbon ? 'High' : 'Normal', isAnomaly: isHighCarbon },
                { label: 'Source', value: contextData?.source?.grid === 'api' ? 'API' : 'Mock', isAnomaly: false },
            ],
        },
    ];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-slate-800 rounded-2xl max-w-5xl w-full border border-slate-700/50 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 rounded-lg p-2">
                            <Info className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Anomaly Deep Dive</h2>
                            <p className="text-sm text-white/80">{audit.supplier_name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* AI Analysis Summary */}
                    <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-5 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-400 mb-2">AI-Detected Anomaly</h3>
                                <p className="text-white/90 text-sm leading-relaxed mb-3">
                                    {audit.agent_reasoning}
                                </p>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-white/70">Confidence: <span className="text-red-400 font-semibold">{audit.confidence_score}%</span></span>
                                    <span className="text-white/70">Status: <span className="text-red-400 font-semibold">{audit.status}</span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Comparison Grid */}
                    <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                        <Grid3x3 className="w-5 h-5 text-slate-400" />
                        Data Source Comparison
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {comparisonData.map((section, index) => {
                            const Icon = section.icon;
                            return (
                                <motion.div
                                    key={section.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`${section.bgColor} border ${section.borderColor} rounded-xl p-4`}
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <Icon className={`w-5 h-5 ${section.color}`} />
                                        <h4 className={`font-semibold ${section.color}`}>{section.title}</h4>
                                    </div>

                                    <div className="space-y-3">
                                        {section.items.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-center justify-between p-2 rounded-lg transition-all ${item.isAnomaly
                                                        ? 'bg-red-500/20 border border-red-500/40'
                                                        : 'bg-slate-800/50'
                                                    }`}
                                            >
                                                <span className="text-sm text-slate-400">{item.label}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-semibold ${item.isAnomaly ? 'text-red-400' : 'text-white'}`}>
                                                        {item.value}
                                                    </span>
                                                    {item.isAnomaly && (
                                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Anomaly Explanation */}
                    <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-400" />
                            What Makes This Anomalous?
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                            {isOverLimit && (
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                    <span>
                                        <span className="font-semibold text-red-400">Load Exceeded:</span> Actual consumption ({actualLoad} kWh)
                                        is {variance.toFixed(1)}% {variance > 0 ? 'above' : 'below'} the bill maximum ({billMaxLoad} kWh)
                                    </span>
                                </li>
                            )}
                            {!isHotWeather && !isColdWeather && isOverLimit && (
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                    <span>
                                        <span className="font-semibold text-red-400">Weather Mismatch:</span> Temperature is moderate ({temp.toFixed(1)}°C),
                                        yet high energy usage suggests unnecessary consumption
                                    </span>
                                </li>
                            )}
                            {isHighCarbon && (
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <span>
                                        <span className="font-semibold text-yellow-400">High Carbon Period:</span> Grid carbon intensity is elevated ({gridIntensity} gCO2/kWh),
                                        making this consumption environmentally costly
                                    </span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-900/50 p-4 border-t border-slate-700/50">
                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                    >
                        Close Analysis
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

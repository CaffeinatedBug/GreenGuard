// src/components/dashboard/CarbonReportModal.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Leaf, TrendingUp, DollarSign, Zap, Award } from 'lucide-react';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';

interface CarbonReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalKwhSaved: number;
}

// Constants - Based on official grid data sources
const GRID_INTENSITY = 0.71; // kgCO2/kWh - India CEA 2024 Average (Source: ElectricityMaps)
const CREDIT_CONVERSION = 1; // 1 Tonne CO2 = 1 Carbon Credit (VCS Standard)
const CREDIT_VALUE = 10; // $10/credit - Q1 2026 EU ETS Average

export default function CarbonReportModal({
    isOpen,
    onClose,
    totalKwhSaved,
}: CarbonReportModalProps) {
    // Calculations
    const totalCo2Kg = totalKwhSaved * GRID_INTENSITY;
    const totalCo2Tonnes = totalCo2Kg / 1000;
    const carbonCredits = totalCo2Tonnes * CREDIT_CONVERSION;
    const estimatedValue = carbonCredits * CREDIT_VALUE;

    const handleDownloadCertificate = () => {
        // Placeholder for PDF download functionality
        console.log('Download certificate clicked');
        alert('Certificate download functionality coming soon!');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-slate-800/95 backdrop-blur-xl rounded-2xl max-w-2xl w-full border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 overflow-hidden"
                    >
                        {/* Dotted Glow Background */}
                        <DottedGlowBackground
                            className="absolute inset-0 pointer-events-none opacity-20"
                            gap={20}
                            radius={1.5}
                            color="rgba(16, 185, 129, 0.4)"
                            glowColor="rgba(16, 185, 129, 0.7)"
                            speedMin={0.1}
                            speedMax={0.5}
                            backgroundOpacity={0}
                        />

                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-emerald-600 to-green-600 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 rounded-lg p-3">
                                    <Leaf className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Sustainability Impact Report</h2>
                                    <p className="text-sm text-white/80 mt-1">Your positive environmental contribution</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Main Content */}
                        <div className="relative p-8">
                            {/* Main Stat - Total CO2 Saved */}
                            <div className="text-center mb-8">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="inline-block"
                                >
                                    <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/40 rounded-2xl p-6 mb-3">
                                        <p className="text-sm text-emerald-400 font-semibold mb-2">Total CO₂ Emissions Saved</p>
                                        <div className="flex items-baseline justify-center gap-2">
                                            <span className="text-6xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                                                {totalCo2Tonnes.toFixed(2)}
                                            </span>
                                            <span className="text-2xl text-emerald-400 font-semibold">Tonnes</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        Equivalent to planting ~{Math.round(totalCo2Tonnes * 45)} trees 🌳
                                    </p>
                                </motion.div>
                            </div>

                            {/* Breakdown Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-5 h-5 text-blue-400" />
                                        <p className="text-sm text-slate-400">Energy Saved</p>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{totalKwhSaved.toFixed(2)}</p>
                                    <p className="text-sm text-blue-400">kWh</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 }}
                                    className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-purple-400" />
                                        <p className="text-sm text-slate-400">Grid Intensity</p>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{GRID_INTENSITY}</p>
                                    <p className="text-sm text-purple-400">kgCO₂/kWh</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl p-4"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award className="w-5 h-5 text-emerald-400" />
                                        <p className="text-sm text-slate-400">Carbon Credits</p>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{carbonCredits.toFixed(2)}</p>
                                    <p className="text-sm text-emerald-400">Credits</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.45 }}
                                    className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="w-5 h-5 text-yellow-400" />
                                        <p className="text-sm text-slate-400">Est. Revenue</p>
                                    </div>
                                    <p className="text-2xl font-bold text-white">${estimatedValue.toFixed(2)}</p>
                                    <p className="text-sm text-yellow-400">@ ${CREDIT_VALUE}/credit</p>
                                </motion.div>
                            </div>

                            {/* Info Box */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700/50"
                            >
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    <span className="font-semibold text-emerald-400">Calculation Methodology:</span> Carbon
                                    savings are calculated using India's average grid intensity of {GRID_INTENSITY} kgCO₂/kWh.
                                    Each tonne of CO₂ saved equals {CREDIT_CONVERSION} carbon credit. Market values are
                                    estimates and may vary.
                                </p>
                            </motion.div>

                            {/* Footer - Download Button */}
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleDownloadCertificate}
                                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/30"
                            >
                                <Download className="w-5 h-5" />
                                Download PDF Certificate
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

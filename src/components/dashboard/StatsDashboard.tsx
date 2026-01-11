// src/components/dashboard/StatsDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Clock, Leaf } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CarbonReportModal from './CarbonReportModal';

interface StatsData {
    total: number;
    verified: number;
    anomalies: number;
    pending: number;
    kwhSaved: number;
    co2Tonnes: number;
}

interface StatsDashboardProps {
    simulatedKwhSaved?: number;
}

export default function StatsDashboard({ simulatedKwhSaved = 0 }: StatsDashboardProps) {
    const [stats, setStats] = useState<StatsData>({
        total: 0,
        verified: 0,
        anomalies: 0,
        pending: 0,
        kwhSaved: 0,
        co2Tonnes: 0,
    });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchStats();

        // Refresh stats every 5 seconds
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            // Get all audit counts
            const { data: allAudits, error: allError } = await supabase
                .from('audit_events')
                .select('id, human_action, status');

            if (allError) throw allError;

            const total = allAudits?.length || 0;
            const verified = allAudits?.filter((a) => a.human_action === 'APPROVED').length || 0;
            const anomalies = allAudits?.filter((a) => a.status === 'ANOMALY').length || 0;
            const pending = allAudits?.filter(
                (a) => !a.human_action && ['PENDING', 'WARNING', 'ANOMALY'].includes(a.status)
            ).length || 0;

            // Calculate kWh saved (150 kWh per anomaly + simulated)
            const dbSavings = anomalies * 150;
            const totalKwh = dbSavings + simulatedKwhSaved;
            const co2Tonnes = (totalKwh * 0.71) / 1000;

            setStats({ total, verified, anomalies, pending, kwhSaved: totalKwh, co2Tonnes });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setLoading(false);
        }
    };

    const cards = [
        {
            title: 'Total Audits',
            value: stats.total,
            icon: CheckCircle,
            gradient: 'from-blue-500/20 to-cyan-500/20',
            borderColor: 'border-blue-500/30',
            iconColor: 'text-blue-400',
            textColor: 'text-blue-300',
        },
        {
            title: 'Verified',
            value: stats.verified,
            icon: CheckCircle,
            gradient: 'from-green-500/20 to-emerald-500/20',
            borderColor: 'border-green-500/30',
            iconColor: 'text-green-400',
            textColor: 'text-green-300',
        },
        {
            title: 'Anomalies',
            value: stats.anomalies,
            icon: XCircle,
            gradient: 'from-red-500/20 to-rose-500/20',
            borderColor: 'border-red-500/30',
            iconColor: 'text-red-400',
            textColor: 'text-red-300',
        },
        {
            title: 'Pending Review',
            value: stats.pending,
            icon: Clock,
            gradient: 'from-yellow-500/20 to-amber-500/20',
            borderColor: 'border-yellow-500/30',
            iconColor: 'text-yellow-400',
            textColor: 'text-yellow-300',
        },
        {
            title: 'Carbon Impact',
            value: `${stats.co2Tonnes.toFixed(2)} t`,
            subtext: `${stats.co2Tonnes.toFixed(2)} Credits`,
            icon: Leaf,
            gradient: 'from-green-500/20 to-emerald-500/20',
            borderColor: 'border-green-500/30',
            iconColor: 'text-emerald-400',
            textColor: 'text-emerald-300',
            clickable: true,
        },
    ];

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{
                                scale: 1.02,
                                rotateX: 5,
                                rotateY: -5,
                                z: 50
                            }}
                            onClick={card.clickable ? () => setIsModalOpen(true) : undefined}
                            className={`relative overflow-hidden rounded-xl border ${card.borderColor} bg-gradient-to-br ${card.gradient} p-5 ${card.clickable ? 'cursor-pointer' : ''}`}
                            style={{
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                background: `linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))`,
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                transformStyle: 'preserve-3d',
                                perspective: '1000px',
                            }}
                        >
                            {/* Glass reflection effect */}
                            <div
                                className="absolute inset-0 opacity-20 pointer-events-none"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, transparent 100%)',
                                }}
                            />

                            {/* Shimmer effect */}
                            {loading && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                            )}

                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <p className="text-sm text-slate-400 font-medium">{card.title}</p>
                                    <motion.p
                                        key={typeof card.value === 'string' ? card.value : card.value}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={`text-3xl font-bold ${card.textColor} mt-2`}
                                        style={{ transform: 'translateZ(20px)' }}
                                    >
                                        {loading ? '—' : card.value}
                                    </motion.p>
                                    {card.subtext && (
                                        <p className="text-xs text-slate-500 mt-1">{card.subtext}</p>
                                    )}
                                </div>
                                <div
                                    className={`p-3 rounded-lg ${card.iconColor}`}
                                    style={{
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        backdropFilter: 'blur(8px)',
                                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                                        transform: 'translateZ(30px)',
                                    }}
                                >
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>

                            {/* Animated pulse border */}
                            {card.title === 'Pending Review' && stats.pending > 0 && (
                                <motion.div
                                    animate={{
                                        opacity: [0.5, 1, 0.5],
                                    }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 border-2 border-yellow-500/30 rounded-xl pointer-events-none"
                                />
                            )}

                            {/* Clickable indicator */}
                            {card.clickable && (
                                <motion.div
                                    animate={{
                                        opacity: [0.3, 0.6, 0.3],
                                    }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    className="absolute inset-0 border-2 border-emerald-500/30 rounded-xl pointer-events-none"
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Carbon Report Modal */}
            <CarbonReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                totalKwhSaved={stats.kwhSaved}
            />
        </>
    );
}

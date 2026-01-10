// src/components/dashboard/StatsDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StatsData {
    total: number;
    verified: number;
    anomalies: number;
    pending: number;
}

export default function StatsDashboard() {
    const [stats, setStats] = useState<StatsData>({
        total: 0,
        verified: 0,
        anomalies: 0,
        pending: 0,
    });
    const [loading, setLoading] = useState(true);

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

            setStats({ total, verified, anomalies, pending });
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
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative overflow-hidden rounded-xl border ${card.borderColor} bg-gradient-to-br ${card.gradient} backdrop-blur-sm p-5`}
                    >
                        {/* Shimmer effect */}
                        {loading && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                        )}

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400 font-medium">{card.title}</p>
                                <motion.p
                                    key={card.value}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`text-3xl font-bold ${card.textColor} mt-2`}
                                >
                                    {loading ? '—' : card.value}
                                </motion.p>
                            </div>
                            <div className={`p-3 rounded-lg bg-slate-900/50 ${card.iconColor}`}>
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
                    </motion.div>
                );
            })}
        </div>
    );
}

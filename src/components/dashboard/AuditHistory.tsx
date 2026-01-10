// src/components/dashboard/AuditHistory.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import type { AuditEventWithDetails } from '@/types/database';
import { supabase } from '@/lib/supabase';

export default function AuditHistory() {
    const [audits, setAudits] = useState<AuditEventWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchAuditHistory();

        // Refresh every 10 seconds
        const interval = setInterval(fetchAuditHistory, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchAuditHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('audit_events')
                .select(`
          *,
          iot_logs (
            timestamp,
            energy_kwh,
            supplier_id,
            suppliers (
              name
            )
          )
        `)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            const transformedData = data?.map((audit: any) => ({
                ...audit,
                supplier_name: audit.iot_logs?.suppliers?.name || 'Unknown',
                timestamp: audit.iot_logs?.timestamp,
                energy_kwh: audit.iot_logs?.energy_kwh,
            })) || [];

            setAudits(transformedData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching audit history:', error);
            setLoading(false);
        }
    };

    const getStatusConfig = (status: string, humanAction: string | null | undefined) => {
        if (humanAction === 'APPROVED') {
            return {
                icon: CheckCircle,
                label: 'Verified',
                bg: 'bg-green-500/10',
                border: 'border-green-500/30',
                text: 'text-green-400',
            };
        }
        if (humanAction === 'FLAGGED') {
            return {
                icon: XCircle,
                label: 'Flagged',
                bg: 'bg-red-500/10',
                border: 'border-red-500/30',
                text: 'text-red-400',
            };
        }

        switch (status) {
            case 'ANOMALY':
                return {
                    icon: XCircle,
                    label: 'Anomaly',
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/30',
                    text: 'text-red-400',
                };
            case 'WARNING':
                return {
                    icon: AlertTriangle,
                    label: 'Warning',
                    bg: 'bg-yellow-500/10',
                    border: 'border-yellow-500/30',
                    text: 'text-yellow-400',
                };
            default:
                return {
                    icon: CheckCircle,
                    label: 'Normal',
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/30',
                    text: 'text-blue-400',
                };
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Audit History</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-slate-700/30 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Audit History</h3>
                <span className="text-sm text-slate-400">{audits.length} recent audits</span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <AnimatePresence mode="popLayout">
                    {audits.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 text-slate-400"
                        >
                            <p>No audit history yet</p>
                            <p className="text-sm mt-2">Run your first audit to see it here</p>
                        </motion.div>
                    ) : (
                        audits.map((audit, index) => {
                            const config = getStatusConfig(audit.status, audit.human_action);
                            const Icon = config.icon;
                            const isExpanded = expandedId === audit.id;

                            return (
                                <motion.div
                                    key={audit.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.03 }}
                                    className={`border ${config.border} ${config.bg} rounded-lg p-4 cursor-pointer hover:bg-slate-700/30 transition-colors`}
                                    onClick={() => setExpandedId(isExpanded ? null : audit.id)}
                                >
                                    {/* Header Row */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <Icon className={`w-5 h-5 ${config.text}`} />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-semibold ${config.text}`}>
                                                        {config.label}
                                                    </span>
                                                    <span className="text-xs text-slate-500">•</span>
                                                    <span className="text-sm text-slate-300">
                                                        {audit.supplier_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                                    <span>
                                                        {audit.timestamp
                                                            ? format(new Date(audit.timestamp), 'MMM dd, HH:mm')
                                                            : 'N/A'}
                                                    </span>
                                                    <span>{audit.energy_kwh?.toFixed(1)} kWh</span>
                                                    <span>{audit.confidence_score}% confidence</span>
                                                </div>
                                            </div>
                                        </div>

                                        <motion.div
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronDown className="w-5 h-5 text-slate-400" />
                                        </motion.div>
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-3 pt-3 border-t border-slate-700/50">
                                                    <p className="text-xs text-slate-400 mb-2 font-semibold">
                                                        Agent Reasoning:
                                                    </p>
                                                    <p className="text-sm text-slate-300 leading-relaxed">
                                                        {audit.agent_reasoning}
                                                    </p>

                                                    {audit.human_action && (
                                                        <div className="mt-3 text-xs text-slate-500">
                                                            Human Action:{' '}
                                                            <span className={config.text}>{audit.human_action}</span>
                                                            {audit.human_action_timestamp && (
                                                                <span className="ml-2">
                                                                    on {format(new Date(audit.human_action_timestamp), 'MMM dd, HH:mm')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

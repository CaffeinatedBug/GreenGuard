// src/components/dashboard/NotificationPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, XCircle, AlertTriangle, Clock, TrendingUp, Info } from 'lucide-react';
import { format } from 'date-fns';
import type { AuditEventWithDetails } from '@/types/database';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';

interface NotificationPanelProps {
    pendingAudits: AuditEventWithDetails[];
    onVerify: (auditId: string) => void;
    onFlag: (auditId: string) => void;
}

export default function NotificationPanel({
    pendingAudits,
    onVerify,
    onFlag,
}: NotificationPanelProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedAudit, setSelectedAudit] = useState<AuditEventWithDetails | null>(null);

    // Auto-close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const panel = document.getElementById('notification-panel');
            const button = document.getElementById('notification-button');
            if (isOpen && panel && button &&
                !panel.contains(event.target as Node) &&
                !button.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'ANOMALY':
                return {
                    icon: XCircle,
                    color: 'red',
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/30',
                    glow: 'shadow-red-500/20',
                };
            case 'WARNING':
                return {
                    icon: AlertTriangle,
                    color: 'yellow',
                    bg: 'bg-yellow-500/10',
                    border: 'border-yellow-500/30',
                    glow: 'shadow-yellow-500/20',
                };
            default:
                return {
                    icon: CheckCircle,
                    color: 'blue',
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/30',
                    glow: 'shadow-blue-500/20',
                };
        }
    };

    const handleApprove = (audit: AuditEventWithDetails) => {
        onVerify(audit.id);
        setIsOpen(false);
        setSelectedAudit(null);
    };

    const handleReject = (audit: AuditEventWithDetails) => {
        onFlag(audit.id);
        setIsOpen(false);
        setSelectedAudit(null);
    };

    return (
        <div className="relative">
            {/* Notification Bell Button */}
            <button
                id="notification-button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 hover:bg-slate-700/50 rounded-lg transition-all duration-200 group"
                aria-label="Notifications"
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Bell className={`w-6 h-6 transition-colors ${isOpen ? 'text-emerald-400' : 'text-slate-300 group-hover:text-white'}`} />

                    {/* Badge with pulse animation */}
                    {pendingAudits.length > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 flex items-center justify-center"
                        >
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 0.8, 0.5],
                                }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-red-500 rounded-full blur-sm"
                            />
                            <div className="relative bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-lg">
                                {pendingAudits.length > 9 ? '9+' : pendingAudits.length}
                            </div>
                        </motion.span>
                    )}
                </motion.div>
            </button>

            {/* Notification Panel Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        id="notification-panel"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-96 z-50"
                    >
                        {/* Glassmorphism Container */}
                        <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
                            {/* Animated background */}
                            <DottedGlowBackground
                                className="pointer-events-none opacity-30"
                                gap={15}
                                radius={1.5}
                                color="rgba(16, 185, 129, 0.3)"
                                glowColor="rgba(16, 185, 129, 0.6)"
                                speedMin={0.2}
                                speedMax={0.8}
                                backgroundOpacity={0}
                            />

                            {/* Glow effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-cyan-600/10 blur-xl" />

                            {/* Header */}
                            <div className="relative border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                            Pending Approvals
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Human-in-the-Loop Verification
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${pendingAudits.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                                        <span className="text-sm font-medium text-slate-300">
                                            {pendingAudits.length}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="relative max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
                                {pendingAudits.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center py-12 px-6"
                                    >
                                        <div className="relative">
                                            <motion.div
                                                animate={{
                                                    rotate: [0, 10, -10, 0],
                                                }}
                                                transition={{ repeat: Infinity, duration: 3 }}
                                            >
                                                <CheckCircle className="w-16 h-16 text-emerald-500/30" />
                                            </motion.div>
                                        </div>
                                        <p className="text-white font-semibold mt-4">All Clear!</p>
                                        <p className="text-sm text-slate-400 mt-2 text-center">
                                            No pending audits require your attention
                                        </p>
                                    </motion.div>
                                ) : (
                                    <div className="p-3 space-y-3">
                                        <AnimatePresence mode="popLayout">
                                            {pendingAudits.map((audit, index) => {
                                                const statusConfig = getStatusConfig(audit.status);
                                                const Icon = statusConfig.icon;

                                                return (
                                                    <motion.div
                                                        key={audit.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className={`relative border ${statusConfig.border} ${statusConfig.bg} rounded-xl p-4 backdrop-blur-sm hover:bg-slate-700/30 transition-all cursor-pointer group`}
                                                        onClick={() => setSelectedAudit(selectedAudit?.id === audit.id ? null : audit)}
                                                    >
                                                        {/* Status indicator line */}
                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${statusConfig.color}-500 rounded-l-xl`} />

                                                        {/* Header */}
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Icon className={`w-5 h-5 text-${statusConfig.color}-400`} />
                                                                <div>
                                                                    <span className={`text-sm font-bold text-${statusConfig.color}-300`}>
                                                                        {audit.status}
                                                                    </span>
                                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                                        {audit.supplier_name || 'Unknown Supplier'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                                <Clock className="w-3 h-3" />
                                                                {audit.timestamp ? format(new Date(audit.timestamp), 'HH:mm') : 'N/A'}
                                                            </div>
                                                        </div>

                                                        {/* Metrics */}
                                                        <div className="flex items-center justify-between mb-3 text-xs">
                                                            <div className="flex items-center gap-1">
                                                                <TrendingUp className="w-3 h-3 text-emerald-400" />
                                                                <span className="text-slate-400">Energy:</span>
                                                                <span className="font-semibold text-emerald-300">
                                                                    {audit.energy_kwh?.toFixed(1) || 'N/A'} kWh
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-slate-400">Confidence:</span>
                                                                <span className="font-semibold text-blue-300">
                                                                    {audit.confidence_score}%
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Reasoning - Expandable */}
                                                        <AnimatePresence>
                                                            {selectedAudit?.id === audit.id && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="bg-slate-900/50 rounded-lg p-3 mb-3 border border-slate-700/30">
                                                                        <p className="text-xs text-slate-300 leading-relaxed">
                                                                            {audit.agent_reasoning}
                                                                        </p>
                                                                    </div>

                                                                    {/* Action Buttons */}
                                                                    <div className="flex flex-col gap-2">
                                                                        <div className="flex gap-2">
                                                                            <motion.button
                                                                                whileHover={{ scale: 1.02 }}
                                                                                whileTap={{ scale: 0.98 }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleApprove(audit);
                                                                                }}
                                                                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                                                                            >
                                                                                <CheckCircle className="w-4 h-4" />
                                                                                Approve
                                                                            </motion.button>
                                                                            <motion.button
                                                                                whileHover={{ scale: 1.02 }}
                                                                                whileTap={{ scale: 0.98 }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleReject(audit);
                                                                                }}
                                                                                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                                                                            >
                                                                                <XCircle className="w-4 h-4" />
                                                                                Flag
                                                                            </motion.button>
                                                                        </div>

                                                                        {/* More Information Button */}
                                                                        <motion.button
                                                                            whileHover={{ scale: 1.02 }}
                                                                            whileTap={{ scale: 0.98 }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                router.push(`/audit/${audit.id}`);
                                                                            }}
                                                                            className="w-full bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 border border-purple-400/30"
                                                                        >
                                                                            <Info className="w-4 h-4" />
                                                                            More Information
                                                                        </motion.button>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>

                                                        {/* Quick actions hint */}
                                                        {selectedAudit?.id !== audit.id && (
                                                            <p className="text-xs text-slate-500 text-center mt-2 group-hover:text-slate-400 transition-colors">
                                                                Click to expand
                                                            </p>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


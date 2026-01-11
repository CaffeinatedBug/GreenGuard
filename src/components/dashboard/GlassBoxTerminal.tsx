// src/components/dashboard/GlassBoxTerminal.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Zap, Database, FileText, Brain, Activity, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';

interface GlassBoxTerminalProps {
    logs: string[];
}

interface ParsedLog {
    timestamp: string;
    agent: string;
    message: string;
    level: 'info' | 'success' | 'warning' | 'error';
    icon: any;
    color: string;
}

export default function GlassBoxTerminal({ logs }: GlassBoxTerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [streamingIndex, setStreamingIndex] = useState(0);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (terminalRef.current && isExpanded) {
            terminalRef.current.scrollTo({
                top: terminalRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [logs, isExpanded]);

    // Streaming effect for new logs
    useEffect(() => {
        if (streamingIndex < logs.length) {
            const timer = setTimeout(() => {
                setStreamingIndex(streamingIndex + 1);
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [streamingIndex, logs.length]);

    // Reset streaming when new logs arrive
    useEffect(() => {
        setStreamingIndex(logs.length);
    }, [logs.length]);

    // Get badge styles for each agent type
    const getAgentBadgeStyles = (color: string) => {
        const styles = {
            blue: {
                badge: 'bg-blue-500/10 border-blue-500/20',
                icon: 'text-blue-400',
                text: 'text-blue-400'
            },
            purple: {
                badge: 'bg-purple-500/10 border-purple-500/20',
                icon: 'text-purple-400',
                text: 'text-purple-400'
            },
            cyan: {
                badge: 'bg-cyan-500/10 border-cyan-500/20',
                icon: 'text-cyan-400',
                text: 'text-cyan-400'
            },
            orange: {
                badge: 'bg-orange-500/10 border-orange-500/20',
                icon: 'text-orange-400',
                text: 'text-orange-400'
            },
            yellow: {
                badge: 'bg-yellow-500/10 border-yellow-500/20',
                icon: 'text-yellow-400',
                text: 'text-yellow-400'
            },
            slate: {
                badge: 'bg-slate-500/10 border-slate-500/20',
                icon: 'text-slate-400',
                text: 'text-slate-400'
            }
        };
        return styles[color as keyof typeof styles] || styles.slate;
    };

    // Parse log entry
    const parseLog = (log: string, index: number): ParsedLog => {
        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Extract agent from log
        let agent = 'System';
        let icon = Terminal;
        let color = 'slate';
        let level: 'info' | 'success' | 'warning' | 'error' = 'info';

        if (log.includes('[IoT Sensor]') || log.includes('IngestionAgent')) {
            agent = 'IoT Sensor';
            icon = Zap;
            color = 'blue';
        } else if (log.includes('[Database]')) {
            agent = 'Database';
            icon = Database;
            color = 'purple';
        } else if (log.includes('[BillReaderAgent]')) {
            agent = 'Bill Reader';
            icon = FileText;
            color = 'cyan';
        } else if (log.includes('[ContextAgent]') || log.includes('[Context')) {
            agent = 'Context';
            icon = Activity;
            color = 'orange';
        } else if (log.includes('[AuditorAgent]') || log.includes('[GeminiAI]')) {
            agent = 'AI Auditor';
            icon = Brain;
            color = 'yellow';
        }

        // Determine log level
        if (log.includes('✅') || log.includes('SUCCESS') || log.includes('VERIFIED')) {
            level = 'success';
        } else if (log.includes('⚠️') || log.includes('WARNING')) {
            level = 'warning';
        } else if (log.includes('❌') || log.includes('ERROR') || log.includes('ANOMALY')) {
            level = 'error';
        }

        return { timestamp, agent, message: log, level, icon, color };
    };

    const parsedLogs = logs.slice(0, streamingIndex).map((log, index) => parseLog(log, index));
    const hasActivity = logs.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`relative ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}
        >
            {/* Glassmorphism Container */}
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 animate-pulse" />

                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20 blur-xl opacity-50" />

                {/* Header */}
                <div className="relative border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {/* Status indicator */}
                                <div className="relative">
                                    <motion.div
                                        animate={{
                                            scale: hasActivity ? [1, 1.2, 1] : 1,
                                            opacity: hasActivity ? [0.5, 1, 0.5] : 0.3,
                                        }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute inset-0 bg-emerald-500 rounded-full blur-md"
                                    />
                                    <div className={`relative w-3 h-3 rounded-full ${hasActivity ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                                        <Terminal className="w-5 h-5 text-emerald-400" />
                                        Real-time Agent Terminal
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Real-time AI reasoning & decision transparency
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* macOS-style controls */}
                                <div className="flex gap-2 mr-3">
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        className="w-3 h-3 rounded-full bg-red-500 cursor-pointer"
                                    />
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        className="w-3 h-3 rounded-full bg-yellow-500 cursor-pointer"
                                        onClick={() => setIsExpanded(!isExpanded)}
                                    />
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        className="w-3 h-3 rounded-full bg-green-500 cursor-pointer"
                                        onClick={() => setIsFullscreen(!isFullscreen)}
                                    />
                                </div>

                                {/* Expand/Collapse */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    ) : (
                                        <ChevronUp className="w-4 h-4 text-slate-400" />
                                    )}
                                </motion.button>

                                {/* Fullscreen toggle */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                                >
                                    {isFullscreen ? (
                                        <Minimize2 className="w-4 h-4 text-slate-400" />
                                    ) : (
                                        <Maximize2 className="w-4 h-4 text-slate-400" />
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terminal Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="relative"
                        >
                            <div
                                ref={terminalRef}
                                className={`relative bg-slate-950/80 backdrop-blur-sm p-6 overflow-y-auto font-mono text-sm ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-96'
                                    } scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent hover:scrollbar-thumb-emerald-500/40`}
                            >
                                {parsedLogs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <motion.div
                                            animate={{
                                                opacity: [0.3, 0.6, 0.3],
                                                scale: [0.98, 1, 0.98]
                                            }}
                                            transition={{ repeat: Infinity, duration: 3 }}
                                            className="text-center"
                                        >
                                            <Terminal className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                            <p className="text-slate-500 text-sm">
                                                Waiting for agent activity...
                                            </p>
                                            <p className="text-slate-600 text-xs mt-1">
                                                Logs will stream here in real-time
                                            </p>
                                        </motion.div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <AnimatePresence mode="popLayout">
                                            {parsedLogs.map((log, index) => {
                                                const Icon = log.icon;
                                                return (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, x: -20, height: 0 }}
                                                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{
                                                            duration: 0.3,
                                                            delay: index === parsedLogs.length - 1 ? 0.1 : 0
                                                        }}
                                                        className="group"
                                                    >
                                                        <div className="flex gap-3 items-start hover:bg-slate-800/30 rounded-lg p-2 -mx-2 transition-colors">
                                                            {/* Timestamp */}
                                                            <span className="text-slate-600 text-xs font-mono shrink-0 mt-0.5">
                                                                {log.timestamp}
                                                            </span>

                                                            {/* Agent Badge */}
                                                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border shrink-0 ${getAgentBadgeStyles(log.color).badge}`}>
                                                                <Icon className={`w-3 h-3 ${getAgentBadgeStyles(log.color).icon}`} />
                                                                <span className={`text-xs font-medium ${getAgentBadgeStyles(log.color).text}`}>
                                                                    {log.agent}
                                                                </span>
                                                            </div>

                                                            {/* Message */}
                                                            <motion.span
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                transition={{ duration: 0.5 }}
                                                                className={`flex-1 ${log.level === 'success'
                                                                    ? 'text-green-400'
                                                                    : log.level === 'warning'
                                                                        ? 'text-yellow-400'
                                                                        : log.level === 'error'
                                                                            ? 'text-red-400'
                                                                            : 'text-slate-300'
                                                                    }`}
                                                            >
                                                                {log.message}
                                                            </motion.span>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>

                                        {/* Typing indicator for streaming */}
                                        {streamingIndex < logs.length && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                                className="flex gap-1 ml-3"
                                            >
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animation-delay-100" />
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animation-delay-200" />
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer - Agent Legend */}
                            <div className="relative border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm px-6 py-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Zap className="w-3 h-3 text-blue-400" />
                                            <span>IoT</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <FileText className="w-3 h-3 text-cyan-400" />
                                            <span>Bill</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Activity className="w-3 h-3 text-orange-400" />
                                            <span>Context</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Brain className="w-3 h-3 text-yellow-400" />
                                            <span>AI</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Database className="w-3 h-3 text-purple-400" />
                                            <span>DB</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="text-slate-500">{parsedLogs.length} logs</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Fullscreen backdrop */}
            {isFullscreen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsFullscreen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                />
            )}
        </motion.div>
    );
}

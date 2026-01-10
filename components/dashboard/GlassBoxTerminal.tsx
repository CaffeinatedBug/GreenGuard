"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconTerminal2, IconPlayerPlay, IconPlayerPause } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface LogEntry {
    id: string;
    timestamp: Date;
    level: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
    agent: string;
    message: string;
    reasoning?: string;
}

interface GlassBoxTerminalProps {
    className?: string;
    maxLogs?: number;
}

export default function GlassBoxTerminal({
    className,
    maxLogs = 50
}: GlassBoxTerminalProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isStreaming, setIsStreaming] = useState(true);
    const [autoScroll, setAutoScroll] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Simulate real-time log streaming
    useEffect(() => {
        if (!isStreaming) return;

        const sampleLogs: Omit<LogEntry, 'id' | 'timestamp'>[] = [
            {
                level: "INFO",
                agent: "AuditorAgent",
                message: "Analyzing IoT sensor data from TechFab Industries...",
                reasoning: "Performing anomaly detection on energy consumption patterns"
            },
            {
                level: "SUCCESS",
                agent: "AuditorAgent",
                message: "Energy consumption verified: 15.5 kWh within normal range",
                reasoning: "Data matches expected operational baseline for manufacturing facility"
            },
            {
                level: "WARNING",
                agent: "AuditorAgent",
                message: "High energy spike detected during non-peak hours",
                reasoning: "Peak load exceeded expected threshold by 15% - flagging for human review"
            },
            {
                level: "INFO",
                agent: "BillReaderAgent",
                message: "Processing electricity bill for December 2025...",
                reasoning: "Extracting consumption data from PDF document"
            },
            {
                level: "SUCCESS",
                agent: "BillReaderAgent",
                message: "Bill data extracted: 15,420.5 kWh total consumption",
                reasoning: "OCR extraction complete with 98% confidence"
            },
            {
                level: "INFO",
                agent: "OnboardingAgent",
                message: "New supplier onboarded: EcoTextiles Ltd",
                reasoning: "Awaiting baseline data collection for calibration"
            },
            {
                level: "ERROR",
                agent: "AuditorAgent",
                message: "Sensor communication failure: ESP32-003 offline",
                reasoning: "No data received for 2 hours - potential hardware issue"
            },
        ];

        const interval = setInterval(() => {
            const randomLog = sampleLogs[Math.floor(Math.random() * sampleLogs.length)];
            const newLog: LogEntry = {
                ...randomLog,
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date(),
            };

            setLogs(prev => {
                const updated = [...prev, newLog];
                return updated.slice(-maxLogs);
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [isStreaming, maxLogs]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    const getLevelColor = (level: LogEntry['level']) => {
        switch (level) {
            case "INFO":
                return "text-blue-400";
            case "SUCCESS":
                return "text-green-400";
            case "WARNING":
                return "text-yellow-400";
            case "ERROR":
                return "text-red-400";
            default:
                return "text-gray-400";
        }
    };

    const getLevelBg = (level: LogEntry['level']) => {
        switch (level) {
            case "INFO":
                return "bg-blue-500/10 border-blue-500/20";
            case "SUCCESS":
                return "bg-green-500/10 border-green-500/20";
            case "WARNING":
                return "bg-yellow-500/10 border-yellow-500/20";
            case "ERROR":
                return "bg-red-500/10 border-red-500/20";
            default:
                return "bg-gray-500/10 border-gray-500/20";
        }
    };

    return (
        <div className={cn(
            "relative w-full h-[600px] rounded-2xl overflow-hidden border border-neutral-800",
            "bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950",
            className
        )}>
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 backdrop-blur-sm" />

            {/* Header */}
            <div className="relative z-10 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
                            <IconTerminal2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Glass Box Terminal</h3>
                            <p className="text-xs text-neutral-400">Real-time Agent Activity Monitor</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Status Indicator */}
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                isStreaming ? "bg-green-400 animate-pulse" : "bg-gray-400"
                            )} />
                            <span className="text-xs text-neutral-400">
                                {isStreaming ? "Streaming" : "Paused"}
                            </span>
                        </div>

                        {/* Controls */}
                        <button
                            onClick={() => setIsStreaming(!isStreaming)}
                            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
                        >
                            {isStreaming ? (
                                <IconPlayerPause className="w-4 h-4 text-neutral-300" />
                            ) : (
                                <IconPlayerPlay className="w-4 h-4 text-neutral-300" />
                            )}
                        </button>

                        <button
                            onClick={() => setLogs([])}
                            className="px-3 py-1.5 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                        >
                            Clear Logs
                        </button>
                    </div>
                </div>
            </div>

            {/* Log Display */}
            <div
                ref={scrollRef}
                className="relative z-10 h-[calc(100%-73px)] overflow-y-auto p-4 space-y-3 scroll-smooth"
            >
                <AnimatePresence initial={false}>
                    {logs.map((log, index) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                                "p-4 rounded-lg border backdrop-blur-sm",
                                getLevelBg(log.level)
                            )}
                        >
                            {/* Log Header */}
                            <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "text-xs font-mono font-semibold px-2 py-1 rounded",
                                        getLevelColor(log.level),
                                        "bg-black/30"
                                    )}>
                                        {log.level}
                                    </span>
                                    <span className="text-sm font-semibold text-white">
                                        {log.agent}
                                    </span>
                                </div>
                                <span className="text-xs text-neutral-500 font-mono">
                                    {log.timestamp.toLocaleTimeString()}
                                </span>
                            </div>

                            {/* Log Message */}
                            <p className="text-sm text-neutral-200 mb-2 leading-relaxed">
                                {log.message}
                            </p>

                            {/* Agent Reasoning */}
                            {log.reasoning && (
                                <div className="mt-3 pt-3 border-t border-neutral-700/50">
                                    <p className="text-xs text-neutral-400 italic">
                                        <span className="font-semibold text-emerald-400">Reasoning:</span> {log.reasoning}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {logs.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <IconTerminal2 className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                            <p className="text-neutral-500">No logs yet. Start streaming to see agent activity.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Gradient borders */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 opacity-50 blur-xl" />
            </div>
        </div>
    );
}

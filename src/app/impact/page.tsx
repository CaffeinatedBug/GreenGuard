'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Leaf,
    DollarSign,
    TreePine,
    TrendingDown,
    Activity,
    Zap,
    Globe,
    Award
} from 'lucide-react';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';

const TickerItem = ({ text }: { text: string }) => (
    <div className="flex items-center gap-2 mx-8 min-w-max">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-emerald-400 font-mono text-sm">{text}</span>
    </div>
);

export default function ImpactPage() {
    // Stats Data
    const stats = [
        {
            title: 'Financial Value',
            value: '$12,450',
            subtext: 'Carbon Credits Revenue',
            icon: DollarSign,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20'
        },
        {
            title: 'Trees Equivalent',
            value: '620',
            subtext: 'Mature Trees Planted',
            icon: TreePine,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            border: 'border-green-500/20'
        },
        {
            title: 'Scope 3 Reduction',
            value: '14.2%',
            subtext: 'Supply Chain Efficiency',
            icon: TrendingDown,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/20'
        },
        {
            title: 'Active Audits',
            value: '1,240',
            subtext: 'Real-time Monitoring',
            icon: Activity,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 overflow-hidden relative font-sans">
            {/* Background Effects - Enhanced Glow */}
            <DottedGlowBackground
                className="fixed inset-0 pointer-events-none opacity-60"
                gap={25}
                radius={2.5}
                color="rgba(16, 185, 129, 0.5)"
                glowColor="rgba(16, 185, 129, 1)"
                speedMin={0.1}
                speedMax={0.4}
                backgroundOpacity={0}
            />

            {/* Floating Orbs Animation */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-emerald-500/20 blur-3xl"
                        style={{
                            width: `${150 + i * 50}px`,
                            height: `${150 + i * 50}px`,
                            left: `${10 + i * 15}%`,
                            top: `${20 + (i % 3) * 25}%`,
                        }}
                        animate={{
                            x: [0, 100, -50, 0],
                            y: [0, -80, 60, 0],
                            scale: [1, 1.2, 0.9, 1],
                            opacity: [0.3, 0.5, 0.2, 0.3],
                        }}
                        transition={{
                            duration: 15 + i * 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            {/* Radial Glow Center */}
            <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

            {/* Navigation */}
            <nav className="relative z-10 p-6 flex justify-between items-center">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                >
                    <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors border border-white/5">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Back to Dashboard</span>
                </Link>

                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Globe className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-400 tracking-wider">LIVE GLOBAL IMPACT</span>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 container mx-auto px-4 pt-12 pb-32">
                <div className="max-w-6xl mx-auto text-center space-y-20">

                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-6"
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 font-medium text-sm mb-4"
                        >
                            <Award className="w-4 h-4" />
                            <span>Sustainability Mission Control</span>
                        </motion.div>

                        <h1 className="text-8xl font-black tracking-tight mb-2 relative inline-block">
                            <span
                                className="bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                                style={{ textShadow: '0 0 40px rgba(16,185,129,0.4), 0 2px 4px rgba(0,0,0,0.8)' }}
                            >
                                142.8
                            </span>
                            <motion.span
                                className="text-4xl text-emerald-400 absolute -top-4 -right-24 font-bold flex items-center gap-1 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{ textShadow: '0 0 20px rgba(16,185,129,0.6), 0 2px 4px rgba(0,0,0,0.9)' }}
                            >
                                <Leaf className="w-6 h-6" />
                                Tonnes
                            </motion.span>
                        </h1>
                        <p
                            className="text-2xl text-slate-300 font-light tracking-wide"
                            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                        >
                            Total Carbon Offset Generated
                        </p>
                    </motion.div>

                    {/* Grid Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, i) => (
                            <CardContainer key={i} className="inter-var" containerClassName="py-0">
                                <CardBody className="bg-slate-900/40 relative group/card border-black/[0.1] w-auto h-auto rounded-xl p-6 border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-slate-900/60 transition-colors duration-300">
                                    <CardItem translateZ="50" className="w-full flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        {i === 2 && (
                                            <div className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">
                                                +2.4%
                                            </div>
                                        )}
                                    </CardItem>

                                    <CardItem translateZ="60" className="w-full">
                                        <h3 className={`text-4xl font-bold ${stat.color} mb-1 tracking-tight`}>
                                            {stat.value}
                                        </h3>
                                    </CardItem>

                                    <CardItem translateZ="40" className="w-full">
                                        <p className="text-sm text-slate-400 font-medium">
                                            {stat.title}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {stat.subtext}
                                        </p>
                                    </CardItem>
                                </CardBody>
                            </CardContainer>
                        ))}
                    </div>

                </div>
            </main>

            {/* Live Ticker Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-t border-emerald-500/20 h-12 flex items-center overflow-hidden z-20">
                <div className="flex items-center px-4 h-full bg-emerald-900/20 border-r border-emerald-500/20 z-10">
                    <Zap className="w-4 h-4 text-emerald-400 mr-2" />
                    <span className="text-xs font-bold text-emerald-300 tracking-wider">LIVE FEED</span>
                </div>

                <motion.div
                    className="flex whitespace-nowrap"
                    animate={{ x: [0, -2000] }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                >
                    <TickerItem text="Gujarat Factory: 12kWh Saved (HVAC Optimization)" />
                    <TickerItem text="Mumbai Hub: Anomaly Verified (Billing Discordance)" />
                    <TickerItem text="Bangalore Unit: 8.5% Efficiency Boost Detected" />
                    <TickerItem text="Delhi Warehouse: Night Load Reduced by 45kWh" />
                    <TickerItem text="Solar Integration: +140kWh Generated Today" />
                    <TickerItem text="Grid Intensity Drop: 0.68 kgCO2/kWh (Real-time)" />
                    {/* Duplicate for seamless loop */}
                    <TickerItem text="Gujarat Factory: 12kWh Saved (HVAC Optimization)" />
                    <TickerItem text="Mumbai Hub: Anomaly Verified (Billing Discordance)" />
                    <TickerItem text="Bangalore Unit: 8.5% Efficiency Boost Detected" />
                    <TickerItem text="Delhi Warehouse: Night Load Reduced by 45kWh" />
                </motion.div>
            </div>
        </div>
    );
}

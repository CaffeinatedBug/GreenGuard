// src/app/audit/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, CheckCircle, Info, Zap, Cloud, FileText, Grid3x3, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';
import type { AuditEventWithDetails, IotLog } from '@/types/database';

interface AuditWithFullData extends AuditEventWithDetails {
    iot_logs?: IotLog;
}

export default function AuditAnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const [audit, setAudit] = useState<AuditWithFullData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAudit = async () => {
            if (!params.id) return;

            try {
                const { data, error: fetchError } = await supabase
                    .from('audit_events')
                    .select(`
            *,
            iot_logs!log_reference_id (
              *,
              suppliers!supplier_id (name)
            )
          `)
                    .eq('id', params.id)
                    .single();

                if (fetchError) throw fetchError;

                // Transform data
                const auditData: AuditWithFullData = {
                    ...data,
                    supplier_name: data.iot_logs?.suppliers?.name,
                    timestamp: data.iot_logs?.timestamp,
                    energy_kwh: data.iot_logs?.energy_kwh,
                    iot_logs: data.iot_logs,
                };

                setAudit(auditData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load audit');
            } finally {
                setLoading(false);
            }
        };

        fetchAudit();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Loading Audit Analysis...</p>
                </div>
            </div>
        );
    }

    if (error || !audit) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-white text-xl mb-2">Audit Not Found</p>
                    <p className="text-slate-400 mb-6">{error || 'The requested audit could not be found.'}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Parse raw_json for context data
    const rawData = audit.iot_logs?.raw_json as any;
    const contextData = rawData?.context_data;
    const billData = rawData?.bill_data;

    // Calculate analytics
    const billMaxLoad = billData?.maxLoadKwh || 0;
    const actualLoad = audit.energy_kwh || 0;
    const variance = billMaxLoad > 0 ? ((actualLoad - billMaxLoad) / billMaxLoad) * 100 : 0;
    const isOverLimit = actualLoad > billMaxLoad;

    const temp = contextData?.weather?.temp_c || 0;
    const isHotWeather = temp > 30;
    const isColdWeather = temp < 15;
    const gridIntensity = contextData?.grid?.grid_carbon_intensity || 0;
    const isHighCarbon = gridIntensity > 500;

    const dataCards = [
        {
            title: 'Invoice / Bill Data',
            icon: FileText,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/30',
            iconColor: 'text-blue-400',
            data: {
                'Billing Period': billData?.billingPeriod || 'N/A',
                'Max Allowed Load': `${billMaxLoad} kWh`,
                'Pricing Tier': billData?.pricing_tier || 'Commercial',
                'File Attached': billData?.file ? 'Yes' : 'No',
            },
            anomalies: isOverLimit ? ['Max Allowed Load'] : [],
            rawJson: billData,
        },
        {
            title: 'IoT Sensor Data',
            icon: Zap,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/30',
            iconColor: 'text-purple-400',
            data: {
                'Actual Energy Load': `${actualLoad} kWh`,
                'Variance from Bill': `${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`,
                'Voltage': `${audit.iot_logs?.voltage?.toFixed(1) || 'N/A'} V`,
                'Current': `${audit.iot_logs?.current_amps?.toFixed(2) || 'N/A'} A`,
                'Power': `${audit.iot_logs?.power_watts?.toFixed(0) || 'N/A'} W`,
                'Timestamp': audit.timestamp ? new Date(audit.timestamp).toLocaleString() : 'N/A',
            },
            anomalies: isOverLimit ? ['Actual Energy Load', 'Variance from Bill'] : [],
            rawJson: {
                device_id: rawData?.device_id,
                energy_kwh: actualLoad,
                voltage: audit.iot_logs?.voltage,
                current_amps: audit.iot_logs?.current_amps,
                power_watts: audit.iot_logs?.power_watts,
                latitude: rawData?.latitude,
                longitude: rawData?.longitude,
                timestamp: audit.timestamp,
            },
        },
        {
            title: 'OpenWeather API',
            icon: Cloud,
            color: 'from-cyan-500 to-teal-500',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'border-cyan-500/30',
            iconColor: 'text-cyan-400',
            data: {
                'Temperature': `${temp?.toFixed(2)}°C`,
                'Condition': contextData?.weather?.condition || 'Unknown',
                'Humidity': `${contextData?.weather?.humidity || 0}%`,
                'Data Source': contextData?.source?.weather === 'api' ? 'Live API' : 'Mock Data',
            },
            anomalies: !isHotWeather && !isColdWeather && isOverLimit ? ['Temperature'] : [],
            rawJson: contextData?.weather,
        },
        {
            title: 'ElectricityMaps API',
            icon: Grid3x3,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/30',
            iconColor: 'text-green-400',
            data: {
                'Carbon Intensity': `${gridIntensity} gCO2/kWh`,
                'Grid Status': isHighCarbon ? 'High Carbon' : 'Normal',
                'Data Source': contextData?.source?.grid === 'api' ? 'Live API' : 'Mock Data',
                'Timestamp': contextData?.timestamp ? new Date(contextData.timestamp).toLocaleString() : 'N/A',
            },
            anomalies: isHighCarbon ? ['Carbon Intensity', 'Grid Status'] : [],
            rawJson: contextData?.grid,
        },
    ];

    return (
        <div className="min-h-screen bg-slate-900 relative overflow-hidden">
            {/* Animated Background */}
            <DottedGlowBackground
                className="fixed inset-0 pointer-events-none opacity-40"
                gap={20}
                radius={1.5}
                color="rgba(16, 185, 129, 0.3)"
                glowColor="rgba(16, 185, 129, 0.6)"
                speedMin={0.1}
                speedMax={0.5}
                backgroundOpacity={0}
            />

            {/* Header */}
            <header className="relative z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/')}
                                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Dashboard
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${audit.status === 'ANOMALY' ? 'bg-red-500/20 text-red-400' :
                                    audit.status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-green-500/20 text-green-400'
                                }`}>
                                {audit.status}
                            </div>
                            <span className="text-slate-400">|</span>
                            <span className="text-slate-300">{audit.supplier_name}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                {/* AI Analysis Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className={`backdrop-blur-xl rounded-2xl border p-6 ${audit.status === 'ANOMALY'
                            ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30'
                            : audit.status === 'WARNING'
                                ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
                                : 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30'
                        }`}>
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${audit.status === 'ANOMALY' ? 'bg-red-500/20' :
                                    audit.status === 'WARNING' ? 'bg-yellow-500/20' :
                                        'bg-green-500/20'
                                }`}>
                                {audit.status === 'ANOMALY' ? (
                                    <AlertTriangle className="w-8 h-8 text-red-400" />
                                ) : audit.status === 'WARNING' ? (
                                    <AlertTriangle className="w-8 h-8 text-yellow-400" />
                                ) : (
                                    <CheckCircle className="w-8 h-8 text-green-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-white mb-2">
                                    AI Audit Analysis
                                </h1>
                                <p className="text-white/80 text-lg leading-relaxed mb-4">
                                    {audit.agent_reasoning}
                                </p>
                                <div className="flex items-center gap-6 text-sm">
                                    <span className="text-slate-400">
                                        Confidence: <span className="text-white font-semibold">{audit.confidence_score}%</span>
                                    </span>
                                    <span className="text-slate-400">
                                        Audit ID: <span className="text-white font-mono">{audit.id.slice(0, 8)}...</span>
                                    </span>
                                    <span className="text-slate-400">
                                        Created: <span className="text-white">{new Date(audit.created_at).toLocaleString()}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Data Comparison Cards */}
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <Info className="w-5 h-5 text-slate-400" />
                    Data Source Comparison
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {dataCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <CardContainer key={card.title} containerClassName="py-0">
                                <CardBody className={`relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] ${card.bgColor} ${card.borderColor} border rounded-2xl p-6 w-full`}>
                                    <CardItem
                                        translateZ="50"
                                        className="flex items-center gap-3 mb-4"
                                    >
                                        <div className={`p-2 rounded-lg bg-gradient-to-r ${card.color}`}>
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                                    </CardItem>

                                    <CardItem translateZ="60" className="w-full">
                                        <div className="space-y-3">
                                            {Object.entries(card.data).map(([key, value]) => {
                                                const isAnomaly = card.anomalies.includes(key);
                                                return (
                                                    <div
                                                        key={key}
                                                        className={`flex items-center justify-between p-3 rounded-lg transition-all ${isAnomaly
                                                                ? 'bg-red-500/20 border border-red-500/40'
                                                                : 'bg-slate-800/50'
                                                            }`}
                                                    >
                                                        <span className="text-sm text-slate-400">{key}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-semibold ${isAnomaly ? 'text-red-400' : 'text-white'}`}>
                                                                {value}
                                                            </span>
                                                            {isAnomaly && (
                                                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardItem>

                                    {/* Raw JSON Toggle */}
                                    <CardItem translateZ="30" className="w-full mt-4">
                                        <details className="group">
                                            <summary className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                                                <ExternalLink className="w-4 h-4" />
                                                View Raw JSON
                                            </summary>
                                            <pre className="mt-2 p-3 bg-slate-900/80 rounded-lg text-xs text-slate-400 overflow-x-auto">
                                                {JSON.stringify(card.rawJson, null, 2)}
                                            </pre>
                                        </details>
                                    </CardItem>
                                </CardBody>
                            </CardContainer>
                        );
                    })}
                </div>

                {/* Anomaly Explanation */}
                {(isOverLimit || isHighCarbon || (!isHotWeather && !isColdWeather && isOverLimit)) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="backdrop-blur-xl bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6"
                    >
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            Why This Was Flagged
                        </h3>
                        <ul className="space-y-3">
                            {isOverLimit && (
                                <li className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                    <CheckCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold text-red-400">Load Exceeded</span>
                                        <p className="text-slate-300 text-sm mt-1">
                                            Actual consumption ({actualLoad} kWh) is {variance.toFixed(1)}% {variance > 0 ? 'above' : 'below'} the bill maximum ({billMaxLoad} kWh)
                                        </p>
                                    </div>
                                </li>
                            )}
                            {!isHotWeather && !isColdWeather && isOverLimit && (
                                <li className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                    <CheckCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold text-yellow-400">Weather Mismatch</span>
                                        <p className="text-slate-300 text-sm mt-1">
                                            Temperature is moderate ({temp.toFixed(1)}°C), yet high energy usage suggests potentially unnecessary consumption
                                        </p>
                                    </div>
                                </li>
                            )}
                            {isHighCarbon && (
                                <li className="flex items-start gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                    <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold text-orange-400">High Carbon Period</span>
                                        <p className="text-slate-300 text-sm mt-1">
                                            Grid carbon intensity is elevated ({gridIntensity} gCO2/kWh), making this consumption environmentally costly
                                        </p>
                                    </div>
                                </li>
                            )}
                        </ul>
                    </motion.div>
                )}
            </main>
        </div>
    );
}

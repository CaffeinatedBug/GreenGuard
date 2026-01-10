// src/components/dashboard/SimulateAuditModal.tsx
'use client';

import { useState } from 'react';
import { X, Zap, Upload, Check, AlertCircle, Loader2, Cloud, Leaf, FileText, Database, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { runAudit, type AuditResult } from '@/lib/agents/auditor-agent';
import { getContextData, type ContextData } from '@/lib/agents/context-agent';
import { insertIotLog, createAuditEvent } from '@/lib/db-helpers';
import { supabase } from '@/lib/supabase';
import type { Supplier } from '@/types/database';

interface SimulateAuditModalProps {
    supplier: Supplier;
    onClose: () => void;
    onAuditComplete: (result: AuditResult, iotData: IoTSimulatedData) => void;
    onLog: (message: string) => void;
}

export interface IoTSimulatedData {
    timestamp: string;
    device_id: string;
    energy_kwh: number;
    voltage: number;
    current_amps: number;
    power_watts: number;
    latitude: number;
    longitude: number;
}

interface BillInputData {
    billingPeriod: string;
    maxLoadKwh: number;
    file: File | null;
}

type ModalStep = 'simulate' | 'bill-input' | 'processing' | 'result';

export default function SimulateAuditModal({
    supplier,
    onClose,
    onAuditComplete,
    onLog,
}: SimulateAuditModalProps) {
    // State management
    const [step, setStep] = useState<ModalStep>('simulate');
    const [iotData, setIotData] = useState<IoTSimulatedData | null>(null);
    const [billData, setBillData] = useState<BillInputData>({
        billingPeriod: 'January 2026',
        maxLoadKwh: supplier.bill_max_load_kwh || 350,
        file: null,
    });
    const [contextData, setContextData] = useState<ContextData | null>(null);
    const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [processingStep, setProcessingStep] = useState<string>('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(0); // January = 0
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Get coordinates from supplier location (mock for demo)
    const getSupplierCoordinates = (location: string): { lat: number; lon: number } => {
        // Map common Indian cities to coordinates
        const locationMap: Record<string, { lat: number; lon: number }> = {
            'ahmedabad': { lat: 23.0225, lon: 72.5714 },
            'mumbai': { lat: 19.0760, lon: 72.8777 },
            'delhi': { lat: 28.6139, lon: 77.2090 },
            'bangalore': { lat: 12.9716, lon: 77.5946 },
            'chennai': { lat: 13.0827, lon: 80.2707 },
            'gujarat': { lat: 22.2587, lon: 71.1924 },
            'maharashtra': { lat: 19.7515, lon: 75.7139 },
        };

        const lowerLocation = location.toLowerCase();
        for (const [key, coords] of Object.entries(locationMap)) {
            if (lowerLocation.includes(key)) {
                return coords;
            }
        }

        // Default to Delhi
        return { lat: 28.6139, lon: 77.2090 };
    };

    // Step 1: Simulate IoT Reading
    const handleSimulateIoT = async () => {
        onLog(`🔬 [IoT Sensor] Initializing sensor reading for ${supplier.name}...`);

        // Generate realistic IoT data
        const maxLoad = supplier.bill_max_load_kwh || 350;
        const variance = Math.random();

        // Create varied scenarios: 40% normal, 30% warning, 30% anomaly
        let energy_kwh: number;
        if (variance < 0.4) {
            energy_kwh = maxLoad * (0.6 + Math.random() * 0.25); // 60-85% of limit (normal)
        } else if (variance < 0.7) {
            energy_kwh = maxLoad * (0.85 + Math.random() * 0.15); // 85-100% of limit (warning)
        } else {
            energy_kwh = maxLoad * (1.05 + Math.random() * 0.3); // 105-135% of limit (anomaly)
        }

        const voltage = 220 + Math.random() * 10;
        const current_amps = (energy_kwh * 1000) / voltage;
        const power_watts = energy_kwh * 1000;
        const coords = getSupplierCoordinates(supplier.location);

        const simulatedData: IoTSimulatedData = {
            timestamp: new Date().toISOString(),
            device_id: `ESP32-${supplier.id.slice(0, 8).toUpperCase()}`,
            energy_kwh: Number(energy_kwh.toFixed(2)),
            voltage: Number(voltage.toFixed(1)),
            current_amps: Number(current_amps.toFixed(2)),
            power_watts: Number(power_watts.toFixed(2)),
            latitude: coords.lat,
            longitude: coords.lon,
        };

        // Simulate sensor delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIotData(simulatedData);
        onLog(`📡 [IoT Sensor] Reading captured: ${simulatedData.energy_kwh} kWh`);
        onLog(`📝 [System] IoT JSON created in background`);

        // Move to bill input step
        setStep('bill-input');
    };

    // Step 2: Handle Bill Input & Start Audit
    const handleStartAudit = async () => {
        if (!iotData) {
            setError('No IoT data available');
            return;
        }

        setStep('processing');
        setError(null);

        try {
            // Processing Step 1: Context Data
            setProcessingStep('Fetching weather & grid data...');
            onLog(`🌤️ [ContextAgent] Fetching weather data for ${supplier.location}...`);

            const context = await getContextData(iotData.latitude, iotData.longitude);
            setContextData(context);

            onLog(`✅ [ContextAgent] Weather: ${context.weather.temp_c}°C ${context.weather.condition}`);
            onLog(`⚡ [ContextAgent] Grid Carbon Intensity: ${context.grid.grid_carbon_intensity} gCO2/kWh`);

            // Processing Step 2: Bill Comparison
            setProcessingStep('Comparing IoT data with bill limits...');
            onLog(`📄 [BillReaderAgent] Bill Period: ${billData.billingPeriod}`);
            onLog(`📊 [BillReaderAgent] Max Allowed Load: ${billData.maxLoadKwh} kWh`);

            const loadPercent = ((iotData.energy_kwh / billData.maxLoadKwh) * 100).toFixed(1);
            if (iotData.energy_kwh > billData.maxLoadKwh) {
                onLog(`⚠️ [BillReaderAgent] WARNING: IoT reading (${iotData.energy_kwh} kWh) exceeds bill limit by ${(Number(loadPercent) - 100).toFixed(1)}%`);
            } else {
                onLog(`✅ [BillReaderAgent] IoT reading within limits: ${loadPercent}% of max load`);
            }

            // Processing Step 3: AI Audit
            setProcessingStep('Running AI audit analysis...');
            onLog(`🤖 [AuditorAgent] Synthesizing all data sources...`);
            onLog(`🧠 [GeminiAI] Analyzing consumption patterns...`);

            const result = await runAudit(
                {
                    power: iotData.energy_kwh,
                    latitude: iotData.latitude,
                    longitude: iotData.longitude,
                    timestamp: iotData.timestamp,
                    voltage: iotData.voltage,
                    current_amps: iotData.current_amps,
                },
                {
                    max_load: billData.maxLoadKwh,
                    billing_period: billData.billingPeriod,
                    pricing_tier: 'commercial',
                }
            );

            setAuditResult(result);

            // Log the verdict
            const verdictEmoji = result.verdict === 'VERIFIED' ? '✅' : result.verdict === 'WARNING' ? '⚠️' : '🚨';
            onLog(`${verdictEmoji} [AuditorAgent] Verdict: ${result.verdict} (${result.confidence}% confidence)`);
            onLog(`💬 [AuditorAgent] ${result.reasoning}`);

            // Processing Step 4: Save to Database
            setProcessingStep('Saving audit results to database...');
            onLog(`💾 [Database] Saving IoT log to Supabase...`);

            // Insert IoT log to database
            const { data: savedIotLog, error: iotLogError } = await insertIotLog({
                supplier_id: supplier.id,
                timestamp: iotData.timestamp,
                energy_kwh: iotData.energy_kwh,
                voltage: iotData.voltage,
                current_amps: iotData.current_amps,
                power_watts: iotData.power_watts,
                raw_json: {
                    device_id: iotData.device_id,
                    latitude: iotData.latitude,
                    longitude: iotData.longitude,
                    context_data: context,
                    bill_data: billData,
                },
            });

            if (iotLogError || !savedIotLog) {
                onLog(`⚠️ [Database] Failed to save IoT log: ${iotLogError?.message || 'Unknown error'}`);
            } else {
                onLog(`✅ [Database] IoT log saved (ID: ${savedIotLog.id.slice(0, 8)}...)`);

                // Create audit event only if we have a log ID
                onLog(`💾 [Database] Creating audit event...`);

                const { data: savedAudit, error: auditError } = await createAuditEvent({
                    log_reference_id: savedIotLog.id,
                    status: result.verdict,
                    agent_reasoning: result.reasoning,
                    confidence_score: result.confidence,
                });

                if (auditError || !savedAudit) {
                    onLog(`⚠️ [Database] Failed to create audit event: ${auditError?.message || 'Unknown error'}`);
                } else {
                    onLog(`✅ [Database] Audit event created (ID: ${savedAudit.id.slice(0, 8)}...)`);

                    // Update audit with agent logs
                    await supabase
                        .from('audit_events')
                        .update({ agent_logs: result.logs } as any)
                        .eq('id', savedAudit.id);
                }
            }

            // Update supplier max load if changed
            if (billData.maxLoadKwh !== supplier.bill_max_load_kwh) {
                onLog(`📝 [Database] Updating supplier max load to ${billData.maxLoadKwh} kWh...`);
                await supabase
                    .from('suppliers')
                    .update({ bill_max_load_kwh: billData.maxLoadKwh })
                    .eq('id', supplier.id);
            }

            setStep('result');
            onAuditComplete(result, iotData);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Audit failed';
            setError(errorMessage);
            onLog(`❌ [System] Audit failed: ${errorMessage}`);
            setStep('bill-input');
        }
    };

    // Handle file upload
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBillData({ ...billData, file });
            onLog(`📎 [BillReaderAgent] Bill file attached: ${file.name}`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl max-w-lg w-full border border-slate-700 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 rounded-lg p-2">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">IoT Audit Simulation</h2>
                            <p className="text-sm text-emerald-100">{supplier.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Step 1: Simulate IoT */}
                    {step === 'simulate' && (
                        <div className="text-center">
                            <div className="bg-slate-700/50 rounded-xl p-8 mb-6">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Zap className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Ready to Simulate IoT Reading
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    This will capture a mock sensor reading from the ESP32 device
                                    and create a JSON data file in the background.
                                </p>
                            </div>

                            <div className="bg-slate-900/50 rounded-lg p-4 mb-6 text-left">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Sensor Details</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-slate-400">Device:</span>
                                        <span className="text-white ml-2">ESP32-{supplier.id.slice(0, 8).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Location:</span>
                                        <span className="text-white ml-2">{supplier.location}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSimulateIoT}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Zap className="w-5 h-5" />
                                Capture IoT Reading
                            </button>
                        </div>
                    )}

                    {/* Step 2: Bill Input */}
                    {step === 'bill-input' && iotData && (
                        <div>
                            {/* IoT Data Summary */}
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                    <span className="text-emerald-400 font-medium">IoT Reading Captured</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-slate-400">Energy:</span>
                                        <span className="text-white font-semibold ml-2">{iotData.energy_kwh} kWh</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Power:</span>
                                        <span className="text-white font-semibold ml-2">{iotData.power_watts} W</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Voltage:</span>
                                        <span className="text-white ml-2">{iotData.voltage} V</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Current:</span>
                                        <span className="text-white ml-2">{iotData.current_amps} A</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bill Input Form */}
                            <div className="space-y-4">
                                <h3 className="text-white font-medium flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    Enter Bill Details
                                </h3>

                                {/* File Upload (Optional) */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">
                                        Upload Bill PDF (Optional)
                                    </label>
                                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-3 hover:border-emerald-500 transition-colors">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="bill-upload"
                                        />
                                        <label
                                            htmlFor="bill-upload"
                                            className="cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            <Upload className="w-5 h-5 text-slate-400" />
                                            <span className="text-sm text-slate-400">
                                                {billData.file ? billData.file.name : 'Click to upload'}
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Billing Period - Calendar Picker */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">
                                        Billing Period *
                                    </label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowCalendar(!showCalendar)}
                                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white hover:bg-slate-600 transition-colors flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <span>{billData.billingPeriod}</span>
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                        </button>

                                        {/* Calendar Popup */}
                                        {showCalendar && (
                                            <div className="absolute bottom-full mb-2 left-0 right-0 bg-slate-700 border border-slate-600 rounded-lg shadow-2xl z-50 p-4">
                                                {/* Year Selector */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedYear(selectedYear - 1)}
                                                        className="p-1 hover:bg-slate-600 rounded transition-colors"
                                                    >
                                                        <ChevronLeft className="w-5 h-5 text-slate-400" />
                                                    </button>
                                                    <span className="text-white font-semibold text-lg">{selectedYear}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedYear(selectedYear + 1)}
                                                        className="p-1 hover:bg-slate-600 rounded transition-colors"
                                                    >
                                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                                    </button>
                                                </div>

                                                {/* Month Grid */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => {
                                                        const fullMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][index];
                                                        const isSelected = selectedMonth === index && selectedYear === parseInt(billData.billingPeriod.split(' ')[1]);
                                                        return (
                                                            <button
                                                                key={month}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedMonth(index);
                                                                    setBillData({
                                                                        ...billData,
                                                                        billingPeriod: `${fullMonth} ${selectedYear}`
                                                                    });
                                                                    setShowCalendar(false);
                                                                }}
                                                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${isSelected
                                                                    ? 'bg-emerald-600 text-white'
                                                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-600'
                                                                    }`}
                                                            >
                                                                {month}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Max Load */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">
                                        Maximum Allowed Load (kWh) *
                                    </label>
                                    <input
                                        type="number"
                                        value={billData.maxLoadKwh}
                                        onChange={(e) => setBillData({ ...billData, maxLoadKwh: Number(e.target.value) })}
                                        placeholder="e.g., 350"
                                        min="0"
                                        step="0.01"
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>

                                {/* Error Display */}
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                        <p className="text-sm text-red-400">{error}</p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    onClick={handleStartAudit}
                                    disabled={!billData.billingPeriod || !billData.maxLoadKwh}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Leaf className="w-5 h-5" />
                                    Run Carbon Audit
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Processing */}
                    {step === 'processing' && (
                        <div className="text-center py-8">
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Zap className="w-8 h-8 text-emerald-500" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Processing Audit
                            </h3>
                            <p className="text-emerald-400 text-sm animate-pulse">
                                {processingStep}
                            </p>
                            <div className="mt-6 space-y-2 text-left bg-slate-900/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Cloud className="w-4 h-4 text-blue-400" />
                                    <span className="text-slate-400">Weather & Grid API</span>
                                    {contextData ? (
                                        <Check className="w-4 h-4 text-green-500 ml-auto" />
                                    ) : (
                                        <Loader2 className="w-4 h-4 text-slate-500 ml-auto animate-spin" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="w-4 h-4 text-yellow-400" />
                                    <span className="text-slate-400">Bill Comparison</span>
                                    <Loader2 className="w-4 h-4 text-slate-500 ml-auto animate-spin" />
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Zap className="w-4 h-4 text-purple-400" />
                                    <span className="text-slate-400">Gemini AI Analysis</span>
                                    <Loader2 className="w-4 h-4 text-slate-500 ml-auto animate-spin" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Result */}
                    {step === 'result' && auditResult && (
                        <div>
                            {/* Verdict Banner */}
                            <div
                                className={`rounded-xl p-6 mb-6 text-center ${auditResult.verdict === 'VERIFIED'
                                    ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30'
                                    : auditResult.verdict === 'WARNING'
                                        ? 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30'
                                        : 'bg-gradient-to-r from-red-600/20 to-pink-600/20 border border-red-500/30'
                                    }`}
                            >
                                <div className="text-4xl mb-2">
                                    {auditResult.verdict === 'VERIFIED' ? '✅' : auditResult.verdict === 'WARNING' ? '⚠️' : '🚨'}
                                </div>
                                <h3
                                    className={`text-2xl font-bold ${auditResult.verdict === 'VERIFIED'
                                        ? 'text-green-400'
                                        : auditResult.verdict === 'WARNING'
                                            ? 'text-yellow-400'
                                            : 'text-red-400'
                                        }`}
                                >
                                    {auditResult.verdict}
                                </h3>
                                <p className="text-white/80 text-lg mt-1">
                                    {auditResult.confidence}% Confidence
                                </p>
                            </div>

                            {/* Reasoning */}
                            <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">AI Analysis</p>
                                <p className="text-white text-sm leading-relaxed">{auditResult.reasoning}</p>
                            </div>

                            {/* Data Summary */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-slate-700/50 rounded-lg p-3">
                                    <p className="text-xs text-slate-400">IoT Reading</p>
                                    <p className="text-white font-semibold">{iotData?.energy_kwh} kWh</p>
                                </div>
                                <div className="bg-slate-700/50 rounded-lg p-3">
                                    <p className="text-xs text-slate-400">Bill Max Load</p>
                                    <p className="text-white font-semibold">{billData.maxLoadKwh} kWh</p>
                                </div>
                                <div className="bg-slate-700/50 rounded-lg p-3">
                                    <p className="text-xs text-slate-400">Weather</p>
                                    <p className="text-white font-semibold">
                                        {contextData?.weather.temp_c}°C {contextData?.weather.condition}
                                    </p>
                                </div>
                                <div className="bg-slate-700/50 rounded-lg p-3">
                                    <p className="text-xs text-slate-400">Carbon Intensity</p>
                                    <p className="text-white font-semibold">
                                        {contextData?.grid.grid_carbon_intensity} g/kWh
                                    </p>
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

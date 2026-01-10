'use client';

import { useState } from 'react';
import { getContextData, type ContextData } from '@/lib/agents/context-agent';

export default function TestAPIPage() {
    const [contextData, setContextData] = useState<ContextData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lat, setLat] = useState('28.6139'); // New Delhi
    const [lon, setLon] = useState('77.2090');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getContextData(parseFloat(lat), parseFloat(lon));
            setContextData(data);
            console.log('Context Data Retrieved:', data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
            console.error('Error fetching context data:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-2">
                    🧪 Context Agent API Test
                </h1>
                <p className="text-gray-300 mb-8">
                    Test the integration of OpenWeatherMap and ElectricityMaps APIs
                </p>

                {/* Input Section */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
                    <h2 className="text-xl font-semibold text-white mb-4">📍 Location Coordinates</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Latitude</label>
                            <input
                                type="text"
                                value={lat}
                                onChange={(e) => setLat(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="28.6139"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Longitude</label>
                            <input
                                type="text"
                                value={lon}
                                onChange={(e) => setLon(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="77.2090"
                            />
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '🔄 Fetching Data...' : '🚀 Fetch Context Data'}
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 mb-6">
                        <h3 className="text-xl font-semibold text-red-200 mb-2">❌ Error</h3>
                        <p className="text-red-100">{error}</p>
                    </div>
                )}

                {/* Results Display */}
                {contextData && (
                    <div className="space-y-6">
                        {/* Data Source Info */}
                        <div className="bg-blue-500/20 border border-blue-500/50 rounded-2xl p-6">
                            <h3 className="text-xl font-semibold text-blue-200 mb-2">📊 Data Sources</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-blue-100/70">Weather Source</p>
                                    <p className="text-lg font-semibold text-blue-100">
                                        {contextData.source.weather === 'api' ? '✅ OpenWeatherMap API' : '⚠️ Mock Data'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-blue-100/70">Grid Source</p>
                                    <p className="text-lg font-semibold text-blue-100">
                                        {contextData.source.grid === 'api' ? '✅ ElectricityMaps API' : '⚠️ Mock Data'}
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-blue-100/50 mt-2">
                                Timestamp: {new Date(contextData.timestamp).toLocaleString()}
                            </p>
                        </div>

                        {/* Weather Data */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                            <h3 className="text-xl font-semibold text-white mb-4">🌤️ Weather Data</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-orange-500/30 to-red-500/30 rounded-lg p-4">
                                    <p className="text-sm text-gray-300">Temperature</p>
                                    <p className="text-3xl font-bold text-white">{contextData.weather.temp_c}°C</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-lg p-4">
                                    <p className="text-sm text-gray-300">Condition</p>
                                    <p className="text-3xl font-bold text-white">{contextData.weather.condition}</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-lg p-4">
                                    <p className="text-sm text-gray-300">Humidity</p>
                                    <p className="text-3xl font-bold text-white">{contextData.weather.humidity}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Grid Data */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                            <h3 className="text-xl font-semibold text-white mb-4">⚡ Grid Carbon Intensity</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`rounded-lg p-4 ${contextData.grid.is_high_intensity
                                        ? 'bg-gradient-to-br from-red-500/30 to-orange-500/30'
                                        : 'bg-gradient-to-br from-green-500/30 to-emerald-500/30'
                                    }`}>
                                    <p className="text-sm text-gray-300">Carbon Intensity</p>
                                    <p className="text-4xl font-bold text-white">
                                        {contextData.grid.grid_carbon_intensity}
                                    </p>
                                    <p className="text-xs text-gray-300 mt-1">gCO2/kWh</p>
                                </div>
                                <div className={`rounded-lg p-4 ${contextData.grid.is_high_intensity
                                        ? 'bg-gradient-to-br from-orange-500/30 to-red-500/30'
                                        : 'bg-gradient-to-br from-emerald-500/30 to-green-500/30'
                                    }`}>
                                    <p className="text-sm text-gray-300">Status</p>
                                    <p className="text-2xl font-bold text-white">
                                        {contextData.grid.is_high_intensity ? '🔴 High' : '🟢 Low'}
                                    </p>
                                    <p className="text-xs text-gray-300 mt-1">
                                        {contextData.grid.is_high_intensity ? '> 500 gCO2/kWh' : '≤ 500 gCO2/kWh'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Raw JSON Data */}
                        <details className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                            <summary className="text-white font-semibold cursor-pointer">
                                📋 View Raw JSON Data
                            </summary>
                            <pre className="mt-4 text-xs text-gray-300 overflow-x-auto">
                                {JSON.stringify(contextData, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}

                {/* Instructions */}
                {!contextData && !loading && (
                    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-2">📝 Instructions</h3>
                        <ul className="text-gray-300 space-y-2 text-sm">
                            <li>• Enter latitude and longitude coordinates (default: New Delhi)</li>
                            <li>• Click "Fetch Context Data" to test the APIs</li>
                            <li>• Check the console (F12) for detailed logs</li>
                            <li>• If APIs are configured, you'll see ✅ API data</li>
                            <li>• If APIs aren't configured, you'll see ⚠️ Mock data (expected for development)</li>
                        </ul>
                        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-yellow-200 text-sm">
                                💡 <strong>Tip:</strong> Open your browser's Developer Console (F12) to see detailed API logs
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

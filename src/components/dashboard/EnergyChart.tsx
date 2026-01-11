// src/components/dashboard/EnergyChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Zap } from 'lucide-react';
import type { ChartDataPoint } from '@/types/database';

interface EnergyChartProps {
  data: ChartDataPoint[];
  onSimulate?: () => void;
  simulating?: boolean;
  supplierName?: string;
}

export default function EnergyChart({ data, onSimulate, simulating, supplierName }: EnergyChartProps) {
  // Format data for recharts
  const formattedData = data.map((point) => ({
    ...point,
    time: format(new Date(point.timestamp), 'HH:mm'),
    energy: Number(point.energy_kwh),
  }));

  return (
    <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Real-Time Energy Consumption</h2>
          <p className="text-sm text-slate-400 mt-1">
            {data.length > 0 ? `Last ${data.length} readings` : 'No data available'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onSimulate && supplierName && (
            <button
              onClick={onSimulate}
              disabled={simulating}
              className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${simulating
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
            >
              <Zap className={`w-4 h-4 ${simulating ? 'animate-pulse' : ''}`} />
              {simulating ? 'Running Check...' : 'Trigger Compliance Check'}
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-slate-400">Live</span>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-slate-900/50 rounded-lg">
          <div className="text-center">
            <p className="text-slate-400 text-sm">No energy data available</p>
            <p className="text-slate-500 text-xs mt-2">
              Select a supplier and run the mock data generator
            </p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Line
              type="monotone"
              dataKey="energy"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

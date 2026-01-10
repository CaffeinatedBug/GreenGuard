// src/components/dashboard/AgentTerminal.tsx
'use client';

import { useEffect, useRef } from 'react';
import { format } from 'date-fns';

interface AgentTerminalProps {
  logs: string[];
}

export default function AgentTerminal({ logs }: AgentTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Parse log entry to extract agent name and colorize
  const getLogStyle = (log: string) => {
    if (log.includes('IngestionAgent')) return 'text-blue-400';
    if (log.includes('BillReaderAgent')) return 'text-cyan-400';
    if (log.includes('AuditorAgent')) return 'text-yellow-400';
    if (log.includes('Anomaly') || log.includes('WARNING') || log.includes('ERROR')) return 'text-red-400';
    if (log.includes('VERIFIED') || log.includes('SUCCESS')) return 'text-green-400';
    return 'text-slate-300';
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-emerald-500">◆</span>
            Glass Box Agent Terminal
          </h2>
          <p className="text-sm text-slate-400 mt-1">Live AI reasoning and decision logs</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        </div>
      </div>

      <div
        ref={terminalRef}
        className="bg-slate-950 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-600 text-sm">
              Waiting for agent activity...
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="flex gap-3">
                <span className="text-slate-600 select-none">
                  [{format(new Date(), 'HH:mm:ss')}]
                </span>
                <span className={getLogStyle(log)}>{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full" />
          <span>Ingestion</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-cyan-400 rounded-full" />
          <span>Bill Reader</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-yellow-400 rounded-full" />
          <span>Auditor</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-400 rounded-full" />
          <span>Anomaly</span>
        </div>
      </div>
    </div>
  );
}

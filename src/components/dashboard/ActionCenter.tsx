import { useRouter } from 'next/navigation';
import { CheckCircle, AlertTriangle, Flag, Info } from 'lucide-react';
import { format } from 'date-fns';
import type { AuditEventWithDetails } from '@/types/database';

interface ActionCenterProps {
  pendingAudits: AuditEventWithDetails[];
  onVerify: (auditId: string) => void;
  onFlag: (auditId: string) => void;
}

export default function ActionCenter({
  pendingAudits,
  onVerify,
  onFlag,
}: ActionCenterProps) {
  const router = useRouter();
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'ANOMALY':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WARNING':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'ANOMALY':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  return (
    <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Action Center</h2>
          <p className="text-sm text-slate-400 mt-1">
            {pendingAudits.length} pending approval{pendingAudits.length !== 1 ? 's' : ''}
          </p>
        </div>
        {pendingAudits.length > 0 && (
          <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {pendingAudits.length}
          </div>
        )}
      </div>

      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        {pendingAudits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-900/50 rounded-lg">
            <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
            <p className="text-white font-semibold">All Clear!</p>
            <p className="text-sm text-slate-400 mt-2 text-center">
              No pending audits require your attention
            </p>
          </div>
        ) : (
          pendingAudits.map((audit) => (
            <div
              key={audit.id}
              className={`border rounded-lg p-4 ${getStatusColor(audit.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(audit.status)}
                  <div>
                    <span className="text-sm font-semibold text-white">
                      {audit.status}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {audit.supplier_name || 'Unknown Supplier'}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">
                  {audit.timestamp ? format(new Date(audit.timestamp), 'HH:mm') : 'N/A'}
                </span>
              </div>

              <div className="bg-slate-900/50 rounded p-3 mb-3">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {audit.agent_reasoning}
                </p>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Energy:</span>
                  <span className="text-sm font-semibold text-emerald-400">
                    {audit.energy_kwh?.toFixed(2) || 'N/A'} kWh
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Confidence:</span>
                  <span className="text-sm font-semibold text-blue-400">
                    {audit.confidence_score}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => onVerify(audit.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verify
                  </button>
                  <button
                    onClick={() => onFlag(audit.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    Flag
                  </button>
                </div>

                {/* More Information Button */}
                <button
                  onClick={() => router.push(`/audit/${audit.id}`)}
                  className="w-full bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 border border-purple-400/30"
                >
                  <Info className="w-4 h-4" />
                  More Information
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

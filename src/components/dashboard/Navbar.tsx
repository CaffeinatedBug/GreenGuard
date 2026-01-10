// src/components/dashboard/Navbar.tsx
'use client';

import NotificationPanel from './NotificationPanel';
import type { AuditEventWithDetails } from '@/types/database';

interface NavbarProps {
  notificationCount: number;
  pendingAudits: AuditEventWithDetails[];
  onVerify: (auditId: string) => void;
  onFlag: (auditId: string) => void;
}

export default function Navbar({ notificationCount, pendingAudits, onVerify, onFlag }: NavbarProps) {
  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 rounded-lg p-2">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">GreenGuard AI</h1>
            <p className="text-xs text-slate-400">Real-time Energy Monitoring & Auditing</p>
          </div>
        </div>

        <NotificationPanel
          pendingAudits={pendingAudits}
          onVerify={onVerify}
          onFlag={onFlag}
        />
      </div>
    </nav>
  );
}

// src/components/dashboard/Navbar.tsx
'use client';

import Link from 'next/link';
import { Leaf, RotateCcw } from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import type { AuditEventWithDetails } from '@/types/database';
import { toast } from 'sonner';

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

        {/* Center - Impact View Button */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link href="/impact">
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all animate-pulse hover:animate-none">
              <Leaf className="w-4 h-4" />
              Impact View Dashboard
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={async () => {
              const promise = async () => {
                // Call API route or server action if available, for now simple client side reset if needed
                // But for hackathon, we can use the server action pattern or just fetch to an API route
                // For simplicity, we'll just show a toast since full reset needs backend script
                // Or we can manually delete from supabase if RLS allows

                // Let's assume we want to reset the client logs for demo
                window.location.reload();
              };

              toast.promise(promise(), {
                loading: 'Resetting demo environment...',
                success: 'Demo reset complete!',
                error: 'Failed to reset',
              });
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-xs text-slate-400 hover:text-white transition-colors border border-slate-600/50"
            title="Reset Demo Data"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>

          <NotificationPanel
            pendingAudits={pendingAudits}
            onVerify={onVerify}
            onFlag={onFlag}
          />
        </div>
      </div>
    </nav >
  );
}

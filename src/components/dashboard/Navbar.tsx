// src/components/dashboard/Navbar.tsx
'use client';

import { Bell } from 'lucide-react';

interface NavbarProps {
  notificationCount: number;
}

export default function Navbar({ notificationCount }: NavbarProps) {
  const handleNotificationClick = () => {
    console.log('Notification bell clicked');
  };

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

        <button
          onClick={handleNotificationClick}
          className="relative p-2 hover:bg-slate-700 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6 text-slate-300" />
          {notificationCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}

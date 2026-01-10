// src/components/dashboard/SupplierSidebar.tsx
'use client';

import { MapPin, Activity } from 'lucide-react';
import type { Supplier } from '@/types/database';

interface SupplierSidebarProps {
  suppliers: Supplier[];
  selectedSupplierId: string | null;
  onSelectSupplier: (supplierId: string) => void;
}

export default function SupplierSidebar({
  suppliers,
  selectedSupplierId,
  onSelectSupplier,
}: SupplierSidebarProps) {
  // Simple status indicator (can be enhanced with real data)
  const getStatusColor = (supplierId: string) => {
    // For demo: alternate between green, yellow, red
    const index = suppliers.findIndex(s => s.id === supplierId);
    const colors = ['bg-green-500', 'bg-yellow-500', 'bg-red-500'];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-slate-800 border-r border-slate-700 w-80 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          Suppliers
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {suppliers.length} Active Facilities
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {suppliers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">No suppliers found</p>
            <p className="text-slate-500 text-xs mt-2">
              Run the database migration to add suppliers
            </p>
          </div>
        ) : (
          suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${selectedSupplierId === supplier.id
                  ? 'bg-slate-700 border-emerald-500'
                  : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50'
                }`}
              onClick={() => onSelectSupplier(supplier.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white text-sm">
                  {supplier.name}
                </h3>
                <div
                  className={`w-2 h-2 rounded-full ${getStatusColor(supplier.id)} animate-pulse`}
                  title="Status indicator"
                />
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                <MapPin className="w-3 h-3" />
                <span>{supplier.location}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-slate-900/50 rounded px-2 py-1">
                  <p className="text-xs text-slate-500">Max Load</p>
                  <p className="text-sm font-semibold text-emerald-400">
                    {supplier.bill_max_load_kwh} kWh
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded px-2 py-1">
                  <p className="text-xs text-slate-500">Carbon</p>
                  <p className="text-sm font-semibold text-orange-400">
                    {supplier.grid_carbon_intensity} g/kWh
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import SupplierSidebar from '@/components/dashboard/SupplierSidebar';
import EnergyChart from '@/components/dashboard/EnergyChart';
import GlassBoxTerminal from '@/components/dashboard/GlassBoxTerminal';
import ActionCenter from '@/components/dashboard/ActionCenter';
import SimulateAuditModal from '@/components/dashboard/SimulateAuditModal';
import { fetchAllSuppliers, fetchRecentIotLogs, fetchPendingAudits, updateAuditWithHumanAction } from '@/lib/db-helpers';
import type { Supplier, ChartDataPoint, AuditEventWithDetails } from '@/types/database';
import type { AuditResult } from '@/lib/agents/auditor-agent';
import type { IoTSimulatedData } from '@/components/dashboard/SimulateAuditModal';

export default function Home() {
  // State management
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [iotLogs, setIotLogs] = useState<ChartDataPoint[]>([]);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [pendingAudits, setPendingAudits] = useState<AuditEventWithDetails[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSimulateModal, setShowSimulateModal] = useState(false);

  // Get selected supplier object
  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  // Fetch suppliers on mount
  useEffect(() => {
    async function loadSuppliers() {
      setAgentLogs(prev => [...prev, '🚀 System initializing...']);

      const { data, error } = await fetchAllSuppliers();

      if (error) {
        console.error('Error loading suppliers:', error);
        setAgentLogs(prev => [...prev, `❌ Error loading suppliers: ${error.message}`]);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setSuppliers(data);
        setSelectedSupplierId(data[0].id);
        setAgentLogs(prev => [...prev, `✅ Loaded ${data.length} supplier(s)`]);
      } else {
        setAgentLogs(prev => [...prev, '⚠️  No suppliers found. Run the database migration.']);
      }

      setLoading(false);
    }

    loadSuppliers();
  }, []);

  // Fetch IoT logs when supplier is selected
  useEffect(() => {
    if (!selectedSupplierId) return;

    async function loadIotLogs() {
      setAgentLogs(prev => [...prev, `📊 IngestionAgent: Fetching energy data...`]);

      const { data, error } = await fetchRecentIotLogs(selectedSupplierId!, 20);

      if (error) {
        console.error('Error loading IoT logs:', error);
        setAgentLogs(prev => [...prev, `❌ IngestionAgent: Error loading data`]);
        return;
      }

      if (data && data.length > 0) {
        const chartData: ChartDataPoint[] = data.map(log => ({
          timestamp: log.timestamp,
          energy_kwh: Number(log.energy_kwh),
        })).reverse(); // Reverse to show chronological order

        setIotLogs(chartData);
        setAgentLogs(prev => [...prev, `✅ IngestionAgent: Loaded ${data.length} readings`]);
      } else {
        setIotLogs([]);
        setAgentLogs(prev => [...prev, '⚠️  IngestionAgent: No IoT data found for this supplier']);
      }
    }

    loadIotLogs();
  }, [selectedSupplierId]);

  // Fetch pending audits periodically
  useEffect(() => {
    async function loadPendingAudits() {
      const { data, error } = await fetchPendingAudits();

      if (error) {
        console.error('Error loading pending audits:', error);
        return;
      }

      if (data) {
        setPendingAudits(data);
        setNotificationCount(data.length);

        // Log new audits
        if (data.length > 0 && agentLogs.length > 0) {
          const newAuditLog = `🔍 AuditorAgent: ${data.length} audit(s) require attention`;
          if (!agentLogs.includes(newAuditLog)) {
            setAgentLogs(prev => [...prev, newAuditLog]);
          }
        }
      }
    }

    // Initial load
    loadPendingAudits();

    // Check every 5 seconds
    const interval = setInterval(loadPendingAudits, 5000);

    return () => clearInterval(interval);
  }, [agentLogs.length]);

  // Handle verify action
  const handleVerify = async (auditId: string) => {
    setAgentLogs(prev => [...prev, `✅ Human Action: Approving audit ${auditId.slice(0, 8)}...`]);

    const { error } = await updateAuditWithHumanAction(auditId, 'APPROVED');

    if (error) {
      console.error('Error updating audit:', error);
      setAgentLogs(prev => [...prev, `❌ Failed to approve audit`]);
      return;
    }

    // Remove from pending list
    setPendingAudits(prev => prev.filter(audit => audit.id !== auditId));
    setNotificationCount(prev => Math.max(0, prev - 1));
    setAgentLogs(prev => [...prev, `✅ Audit approved and marked as VERIFIED`]);
  };

  // Handle flag action
  const handleFlag = async (auditId: string) => {
    setAgentLogs(prev => [...prev, `🚩 Human Action: Flagging audit ${auditId.slice(0, 8)}...`]);

    const { error } = await updateAuditWithHumanAction(auditId, 'FLAGGED');

    if (error) {
      console.error('Error updating audit:', error);
      setAgentLogs(prev => [...prev, `❌ Failed to flag audit`]);
      return;
    }

    // Remove from pending list
    setPendingAudits(prev => prev.filter(audit => audit.id !== auditId));
    setNotificationCount(prev => Math.max(0, prev - 1));
    setAgentLogs(prev => [...prev, `🚩 Audit flagged to supplier for review`]);
  };

  // Handle supplier selection
  const handleSelectSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    setSelectedSupplierId(supplierId);
    setAgentLogs(prev => [...prev, `🔄 Switched to ${supplier?.name || 'supplier'}`]);
  };

  // Handle simulate IoT button click - opens the new modal
  const handleSimulateClick = () => {
    if (!selectedSupplier) return;
    setShowSimulateModal(true);
  };

  // Handle audit complete from modal
  const handleAuditComplete = async (result: AuditResult, iotData: IoTSimulatedData) => {
    // Add the new IoT reading to the chart
    const newDataPoint: ChartDataPoint = {
      timestamp: iotData.timestamp,
      energy_kwh: iotData.energy_kwh,
    };

    setIotLogs(prev => [...prev, newDataPoint]);

    // Refresh pending audits if it's an anomaly or warning
    if (result.verdict !== 'VERIFIED') {
      const { data } = await fetchPendingAudits();
      if (data) {
        setPendingAudits(data);
        setNotificationCount(data.length);
      }
    }
  };

  // Add log from modal
  const handleModalLog = (message: string) => {
    setAgentLogs(prev => [...prev, message]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-white text-lg">Loading GreenGuard AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar
        notificationCount={notificationCount}
        pendingAudits={pendingAudits}
        onVerify={handleVerify}
        onFlag={handleFlag}
      />

      <div className="flex">
        {/* Left Sidebar - Suppliers */}
        <SupplierSidebar
          suppliers={suppliers}
          selectedSupplierId={selectedSupplierId}
          onSelectSupplier={handleSelectSupplier}
        />

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top - Energy Chart (spans 2 columns) */}
            <div className="lg:col-span-2">
              <EnergyChart
                data={iotLogs}
                onSimulate={handleSimulateClick}
                simulating={showSimulateModal}
                supplierName={selectedSupplier?.name}
              />
            </div>

            {/* Right - Action Center */}
            <div className="lg:col-span-1">
              <ActionCenter
                pendingAudits={pendingAudits}
                onVerify={handleVerify}
                onFlag={handleFlag}
              />
            </div>

            {/* Bottom - Agent Terminal (spans all columns) */}
            <div className="lg:col-span-3">
              <GlassBoxTerminal logs={agentLogs} />
            </div>
          </div>
        </div>
      </div>

      {/* Simulate Audit Modal */}
      {showSimulateModal && selectedSupplier && (
        <SimulateAuditModal
          supplier={selectedSupplier}
          onClose={() => setShowSimulateModal(false)}
          onAuditComplete={handleAuditComplete}
          onLog={handleModalLog}
        />
      )}
    </div>
  );
}


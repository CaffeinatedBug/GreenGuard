// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import Navbar from '@/components/dashboard/Navbar';
import SupplierSidebar from '@/components/dashboard/SupplierSidebar';
import EnergyChart from '@/components/dashboard/EnergyChart';
import GlassBoxTerminal from '@/components/dashboard/GlassBoxTerminal';
import ActionCenter from '@/components/dashboard/ActionCenter';
import StatsDashboard from '@/components/dashboard/StatsDashboard';
import AuditHistory from '@/components/dashboard/AuditHistory';
import SupplyChainMap from '@/components/dashboard/SupplyChainMap';
import SimulateAuditModal from '@/components/dashboard/SimulateAuditModal';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';
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
  const [savingsKwh, setSavingsKwh] = useState(5000); // Initial value for demo

  // Get selected supplier object
  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  // Fetch suppliers on mount
  useEffect(() => {
    async function loadSuppliers() {
      setAgentLogs(prev => [...prev, '🚀 System initializing...']);

      const { data, error } = await fetchAllSuppliers();

      if (error) {
        console.error('Error loading suppliers:', error);
        setAgentLogs(prev => [...prev, `❌ Error loading suppliers: ${error.message} `]);
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

  // Load pending audits function
  const loadPendingAudits = async () => {
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
  };

  // Fetch pending audits periodically
  useEffect(() => {
    // Initial load
    loadPendingAudits();

    // Check every 5 seconds
    const interval = setInterval(loadPendingAudits, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle verification
  const handleVerify = async (auditId: string) => {
    const loadingToast = toast.loading('Verifying audit...');
    setAgentLogs(prev => [...prev, `✅ Human Action: Approving audit ${auditId.slice(0, 8)}...`]);

    // Auto-dismiss after 2 seconds as fallback
    const autoCloseTimer = setTimeout(() => {
      toast.dismiss(loadingToast);
    }, 2000);

    const { data, error } = await updateAuditWithHumanAction(auditId, 'APPROVED');

    // Clear the auto-close timer
    clearTimeout(autoCloseTimer);
    // Immediately dismiss the loading toast
    toast.dismiss(loadingToast);

    if (error) {
      console.error('Error verifying audit:', error);
      toast.error('Failed to verify audit');
      setAgentLogs(prev => [...prev, `❌ Failed to approve audit`]);
      return;
    }

    toast.success('✅ Audit Verified Successfully', {
      description: 'This supplier data has been approved',
    });
    setAgentLogs(prev => [...prev, `✅ Audit approved and marked as VERIFIED`]);
  };

  // Handle flag action
  const handleFlag = async (auditId: string) => {
    const loadingToast = toast.loading('Flagging supplier...');
    setAgentLogs(prev => [...prev, `🚩 Human Action: Flagging audit ${auditId.slice(0, 8)}...`]);

    // Auto-dismiss after 2 seconds as fallback
    const autoCloseTimer = setTimeout(() => {
      toast.dismiss(loadingToast);
    }, 2000);

    const { error } = await updateAuditWithHumanAction(auditId, 'FLAGGED');

    // Clear the auto-close timer
    clearTimeout(autoCloseTimer);
    // Immediately dismiss the loading toast
    toast.dismiss(loadingToast);

    if (error) {
      console.error('Error updating audit:', error);
      toast.error('Failed to flag audit');
      setAgentLogs(prev => [...prev, `❌ Failed to flag audit`]);
      return;
    }

    toast.error('🚩 Supplier Flagged for Review', {
      description: 'This audit has been marked for investigation',
    });
    setAgentLogs(prev => [...prev, `🚩 Audit flagged for supplier review`]);

    // Refresh pending audits
    loadPendingAudits();
  };

  // Handle supplier selection
  const handleSelectSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    setSelectedSupplierId(supplierId);
    setAgentLogs(prev => [...prev, `🔄 Switched to ${supplier?.name || 'supplier'} `]);
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

    // If anomaly detected, increment carbon savings
    if (result.verdict === 'ANOMALY') {
      const randomSavings = Math.floor(Math.random() * 201) + 100; // 100-300 kWh
      setSavingsKwh(prev => prev + randomSavings);
      setAgentLogs(prev => [...prev, `🌱 Carbon Impact: +${randomSavings} kWh saved by catching anomaly!`]);
    }

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
    <div className="relative min-h-screen bg-slate-900 overflow-hidden">
      {/* Global Dotted Glow Background */}
      <DottedGlowBackground
        className="fixed inset-0 pointer-events-none opacity-30"
        gap={25}
        radius={2}
        color="rgba(16, 185, 129, 0.4)"
        glowColor="rgba(16, 185, 129, 0.7)"
        speedMin={0.05}
        speedMax={0.3}
        backgroundOpacity={0}
      />

      <Navbar
        notificationCount={notificationCount}
        pendingAudits={pendingAudits}
        onVerify={handleVerify}
        onFlag={handleFlag}
      />

      <div className="relative flex">
        {/* Left Sidebar - Suppliers */}
        <SupplierSidebar
          suppliers={suppliers}
          selectedSupplierId={selectedSupplierId}
          onSelectSupplier={handleSelectSupplier}
        />

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Stats Dashboard - KPI Cards */}
          <StatsDashboard simulatedKwhSaved={savingsKwh} />

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

            {/* Live Supply Chain Map (spans all columns) */}
            <div className="lg:col-span-3">
              <SupplyChainMap suppliers={suppliers} />
            </div>

            {/* Audit History (spans all columns) */}
            <div className="lg:col-span-3">
              <AuditHistory />
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors closeButton />

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


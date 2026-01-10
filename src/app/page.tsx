// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import SupplierSidebar from '@/components/dashboard/SupplierSidebar';
import EnergyChart from '@/components/dashboard/EnergyChart';
import AgentTerminal from '@/components/dashboard/AgentTerminal';
import ActionCenter from '@/components/dashboard/ActionCenter';
import { fetchAllSuppliers, fetchRecentIotLogs, fetchPendingAudits, updateAuditWithHumanAction } from '@/lib/db-helpers';
import type { Supplier, ChartDataPoint, AuditEventWithDetails } from '@/types/database';

export default function Home() {
  // State management
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [iotLogs, setIotLogs] = useState<ChartDataPoint[]>([]);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [pendingAudits, setPendingAudits] = useState<AuditEventWithDetails[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

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

  // Handle bill updated callback
  const handleBillUpdated = async () => {
    setAgentLogs(prev => [...prev, `📄 Bill uploaded successfully, refreshing data...`]);
    
    // Refresh suppliers to show updated bill info
    const { data, error } = await fetchAllSuppliers();
    if (data) {
      setSuppliers(data);
      setAgentLogs(prev => [...prev, `✅ Supplier data refreshed`]);
    }
  };

  // Simulate IoT sensor reading
  const handleSimulateIoT = async () => {
    if (!selectedSupplierId || simulating) return;
    
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;
    
    setSimulating(true);
    setAgentLogs(prev => [...prev, `🔬 Simulating IoT reading for ${supplier.name}...`]);
    
    try {
      // Generate mock IoT data
      const maxLoad = supplier.bill_max_load_kwh;
      const shouldAnomaly = Math.random() > 0.5; // 50% chance of anomaly
      
      let energy_kwh;
      if (shouldAnomaly) {
        energy_kwh = maxLoad * (1.05 + Math.random() * 0.25); // 5-30% over limit
      } else {
        energy_kwh = maxLoad * (0.7 + Math.random() * 0.2); // 70-90% of limit
      }
      
      const voltage = 220 + Math.random() * 10;
      const current_amps = (energy_kwh * 1000) / voltage;
      const power_watts = energy_kwh * 1000;
      
      const payload = {
        supplierId: selectedSupplierId,
        timestamp: new Date().toISOString(),
        energy_kwh: Number(energy_kwh.toFixed(2)),
        voltage: Number(voltage.toFixed(1)),
        current_amps: Number(current_amps.toFixed(1)),
        power_watts: Number(power_watts.toFixed(2)),
      };
      
      setAgentLogs(prev => [...prev, `📡 Sending: ${payload.energy_kwh} kWh (Max: ${maxLoad} kWh)`]);
      
      // Send to API
      const response = await fetch('/api/ingest-iot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to ingest IoT data');
      }
      
      const result = await response.json();
      setAgentLogs(prev => [...prev, `✅ IoT data ingested successfully`]);
      setAgentLogs(prev => [...prev, `🤖 AI agent analyzing... (Log ID: ${result.logId.slice(0, 8)}...)`]);
      
      // Wait for agent to process (Gemini API can take 3-5 seconds)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Refresh data
      const { data: newLogs } = await fetchRecentIotLogs(selectedSupplierId, 20);
      if (newLogs && newLogs.length > 0) {
        const chartData: ChartDataPoint[] = newLogs.map(log => ({
          timestamp: log.timestamp,
          energy_kwh: Number(log.energy_kwh),
        })).reverse();
        setIotLogs(chartData);
      }
      
      setAgentLogs(prev => [...prev, shouldAnomaly 
        ? `⚠️  Anomaly detected! Check Action Center for new audit` 
        : `✅ Reading normal, no audit required`
      ]);
      
    } catch (error) {
      console.error('Error simulating IoT:', error);
      setAgentLogs(prev => [...prev, `❌ Failed to simulate IoT reading`]);
    } finally {
      setSimulating(false);
    }
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
      <Navbar notificationCount={notificationCount} />
      
      <div className="flex">
        {/* Left Sidebar - Suppliers */}
        <SupplierSidebar
          suppliers={suppliers}
          selectedSupplierId={selectedSupplierId}
          onSelectSupplier={handleSelectSupplier}
          onBillUpdated={handleBillUpdated}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top - Energy Chart (spans 2 columns) */}
            <div className="lg:col-span-2">
              <EnergyChart 
                data={iotLogs} 
                onSimulate={handleSimulateIoT}
                simulating={simulating}
                supplierName={suppliers.find(s => s.id === selectedSupplierId)?.name}
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
              <AgentTerminal logs={agentLogs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

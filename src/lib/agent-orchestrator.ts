// src/lib/agent-orchestrator.ts
// Main agent orchestration system - coordinates all verification agents

import { fetchSupplierById, fetchRecentIotLogs, createAuditEvent } from './db-helpers';
import { supabase } from './supabase';
import { analyzeEnergyAnomaly } from './gemini-client';
import { getWeatherContext, getGridCarbonIntensity, analyzeContextualAnomaly } from './context-agent';
import type { IotLog, Supplier, AuditStatus } from '@/types/database';

interface AgentLog {
  timestamp: string;
  agent: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
}

interface ProcessResult {
  success: boolean;
  auditId?: string;
  status?: AuditStatus;
  logs: AgentLog[];
  error?: string;
}

export class AgentOrchestrator {
  private logs: AgentLog[] = [];

  /**
   * Add a log entry
   */
  private log(agent: string, message: string, level: 'info' | 'warning' | 'error' | 'success' = 'info') {
    this.logs.push({
      timestamp: new Date().toISOString(),
      agent,
      message,
      level,
    });
  }

  /**
   * Main orchestration method - processes an IoT log through all agents
   */
  async processIotLog(logId: string): Promise<ProcessResult> {
    // Reset logs for this run
    this.logs = [];

    this.log('System', `🚀 Agent pipeline initiated for log ${logId.slice(0, 8)}...`, 'info');

    try {
      // STEP 1 - DATA COLLECTION
      this.log('IngestionAgent', 'Fetching IoT log data...', 'info');

      const { data: iotLogs, error: logError } = await supabase
        .from('iot_logs')
        .select('*')
        .eq('id', logId)
        .single();

      if (logError || !iotLogs) {
        this.log('IngestionAgent', 'Failed to fetch IoT log', 'error');
        return { success: false, logs: this.logs, error: 'IoT log not found' };
      }

      const iotLog = iotLogs as IotLog;
      this.log(
        'IngestionAgent',
        `✅ Received reading: ${iotLog.energy_kwh} kWh at ${new Date(iotLog.timestamp).toLocaleString()}`,
        'success'
      );

      // Fetch supplier data
      const { data: supplier, error: supplierError } = await fetchSupplierById(iotLog.supplier_id);

      if (supplierError || !supplier) {
        this.log('IngestionAgent', 'Failed to fetch supplier data', 'error');
        return { success: false, logs: this.logs, error: 'Supplier not found' };
      }

      this.log(
        'BillReaderAgent',
        `📋 Supplier: ${supplier.name} | Max Load: ${supplier.bill_max_load_kwh} kWh (from electricity bill)`,
        'info'
      );

      // Fetch historical data
      const { data: historicalLogs, error: histError } = await fetchRecentIotLogs(iotLog.supplier_id, 10);

      let historicalAverage = 0;
      if (!histError && historicalLogs && historicalLogs.length > 0) {
        const sum = historicalLogs.reduce((acc, log) => acc + Number(log.energy_kwh), 0);
        historicalAverage = sum / historicalLogs.length;

        this.log(
          'ContextAgent',
          `📊 Historical average (last 10 readings): ${historicalAverage.toFixed(2)} kWh`,
          'info'
        );
      } else {
        // No historical data, use current as baseline
        historicalAverage = Number(iotLog.energy_kwh);
        this.log('ContextAgent', 'No historical data available, using current reading as baseline', 'warning');
      }

      // STEP 2 - ENVIRONMENTAL CONTEXT
      const timestamp = new Date(iotLog.timestamp);
      const weather = getWeatherContext(supplier.location, timestamp);
      const gridIntensity = getGridCarbonIntensity(supplier.location, timestamp);

      this.log(
        'ContextAgent',
        `🌡️  Weather: ${weather.temperature}°C, ${weather.condition} | Humidity: ${weather.humidity}%`,
        'info'
      );

      this.log(
        'ContextAgent',
        `🌍 Grid carbon intensity: ${gridIntensity} g CO₂/kWh`,
        'info'
      );

      // STEP 3 - RULE-BASED PRE-CHECK
      this.log('RulesEngine', 'Running rule-based pre-check...', 'info');

      const currentReading = Number(iotLog.energy_kwh);
      const billMaxLoad = Number(supplier.bill_max_load_kwh);
      const variance = ((currentReading - billMaxLoad) / billMaxLoad) * 100;

      let preliminaryStatus: AuditStatus;
      if (variance > 20) {
        preliminaryStatus = 'ANOMALY';
        this.log(
          'RulesEngine',
          `⚠️  Preliminary assessment: ANOMALY (${variance.toFixed(1)}% over limit)`,
          'warning'
        );
      } else if (variance > 10) {
        preliminaryStatus = 'WARNING';
        this.log(
          'RulesEngine',
          `⚠️  Preliminary assessment: WARNING (${variance.toFixed(1)}% variance)`,
          'warning'
        );
      } else {
        preliminaryStatus = 'VERIFIED';
        this.log(
          'RulesEngine',
          `✅ Preliminary assessment: VERIFIED (${variance.toFixed(1)}% variance - within acceptable range)`,
          'success'
        );
      }

      // STEP 4 - CONTEXTUAL ANALYSIS
      const contextAnalysis = analyzeContextualAnomaly(
        currentReading,
        weather,
        gridIntensity,
        billMaxLoad
      );

      if (contextAnalysis.isSuspicious) {
        this.log('ContextAgent', `🔍 Contextual flag: ${contextAnalysis.reason}`, 'warning');
      } else {
        this.log('ContextAgent', `✅ ${contextAnalysis.reason}`, 'success');
      }

      // STEP 5 - AI ANALYSIS
      this.log('AuditorAgent', '🤖 Invoking Gemini AI for analysis...', 'info');

      // Type for statuses we work with (narrower than AuditStatus to exclude 'REJECTED')
      type WorkingStatus = 'VERIFIED' | 'WARNING' | 'ANOMALY';
      let finalStatus: WorkingStatus = preliminaryStatus as WorkingStatus;
      let aiReasoning = 'Rule-based assessment only';
      let confidence = 75;

      try {
        const aiResult = await analyzeEnergyAnomaly({
          currentReading,
          billMaxLoad,
          gridCarbonIntensity: gridIntensity,
          historicalAverage,
          supplierName: supplier.name,
          timestamp: iotLog.timestamp,
        });

        this.log(
          'AuditorAgent',
          `🤖 AI Analysis: ${aiResult.status} (Confidence: ${aiResult.confidence}%)`,
          aiResult.status === 'ANOMALY' ? 'error' : aiResult.status === 'WARNING' ? 'warning' : 'success'
        );

        this.log('AuditorAgent', `💭 Reasoning: ${aiResult.reasoning}`, 'info');

        // Use AI status if it's more severe than preliminary
        const severityOrder: Record<string, number> = {
          'VERIFIED': 0,
          'NORMAL': 0,
          'PENDING': 1,
          'WARNING': 2,
          'ANOMALY': 3,
          'REJECTED': 4,
        };

        if (severityOrder[aiResult.status] > severityOrder[preliminaryStatus]) {
          // Map AI status to WorkingStatus (NORMAL -> VERIFIED, filter out PENDING)
          let mappedStatus: WorkingStatus;
          if (aiResult.status === 'NORMAL') {
            mappedStatus = 'VERIFIED';
          } else if (aiResult.status === 'PENDING') {
            mappedStatus = preliminaryStatus as WorkingStatus; // Fall back to preliminary
          } else {
            mappedStatus = aiResult.status as WorkingStatus;
          }
          finalStatus = mappedStatus;
          this.log('AuditorAgent', `📊 Using AI assessment: ${finalStatus}`, 'info');
        } else {
          finalStatus = preliminaryStatus as WorkingStatus;
          this.log('AuditorAgent', `📊 Using rule-based assessment: ${finalStatus}`, 'info');
        }

        aiReasoning = aiResult.reasoning;
        confidence = aiResult.confidence;

      } catch (aiError) {
        console.error('[AgentOrchestrator] AI analysis error:', aiError);
        this.log('AuditorAgent', '⚠️  AI analysis unavailable, using rule-based assessment', 'warning');
        finalStatus = preliminaryStatus as WorkingStatus;
        aiReasoning = `Rule-based analysis: Reading is ${variance.toFixed(1)}% ${variance > 0 ? 'over' : 'under'} the maximum allowed load. ${contextAnalysis.reason}`;
      }

      // STEP 6 - CREATE AUDIT EVENT
      this.log('System', 'Creating audit event...', 'info');

      const auditData = {
        log_reference_id: logId,
        status: finalStatus,
        agent_reasoning: aiReasoning,
        confidence_score: confidence,
      };

      const { data: audit, error: auditError } = await createAuditEvent(auditData);

      if (auditError || !audit) {
        this.log('System', 'Failed to create audit event', 'error');
        return { success: false, logs: this.logs, error: 'Failed to create audit' };
      }

      this.log('System', `✅ Audit event created: ${audit.id.slice(0, 8)}`, 'success');

      // STEP 7 - STORE AGENT LOGS
      // Update audit event with logs
      const { error: updateError } = await supabase
        .from('audit_events')
        .update({ agent_logs: this.logs } as any)
        .eq('id', audit.id);

      if (updateError) {
        console.warn('Failed to update audit with logs:', updateError);
      }

      // STEP 8 - FINAL STATUS
      if (finalStatus === 'ANOMALY' || finalStatus === 'WARNING') {
        this.log('System', `🔔 Notification: Audit requires human review (${finalStatus})`, 'warning');
      } else {
        this.log('System', `✅ Audit complete: ${finalStatus} - No action required`, 'success');
      }

      return {
        success: true,
        auditId: audit.id,
        status: finalStatus,
        logs: this.logs,
      };

    } catch (error) {
      console.error('Agent orchestration error:', error);
      this.log('System', `❌ Pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');

      return {
        success: false,
        logs: this.logs,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const agentOrchestrator = new AgentOrchestrator();

/**
 * Trigger agent analysis for a log (used by API routes)
 */
export async function triggerAgentAnalysis(logId: string): Promise<void> {
  try {
    await agentOrchestrator.processIotLog(logId);
  } catch (error) {
    console.error('Error in triggerAgentAnalysis:', error);
  }
}

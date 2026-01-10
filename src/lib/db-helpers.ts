// src/lib/db-helpers.ts
// Database query helper functions for Supabase operations

import { supabase } from './supabase';
import type { Supplier, IotLog, AuditEvent, AuditEventWithDetails } from '@/types/database';

/**
 * Fetch all suppliers from the database
 * @returns Object with data (array of suppliers) or error
 */
export async function fetchAllSuppliers(): Promise<{ data: Supplier[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching suppliers:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error fetching suppliers');
    console.error('Exception fetching suppliers:', error);
    return { data: null, error };
  }
}

/**
 * Fetch recent IoT logs for a specific supplier
 * @param supplierId - UUID of the supplier
 * @param limit - Number of logs to fetch (default: 20)
 * @returns Object with data (array of IoT logs) or error
 */
export async function fetchRecentIotLogs(
  supplierId: string,
  limit: number = 20
): Promise<{ data: IotLog[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('iot_logs')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching IoT logs:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error fetching IoT logs');
    console.error('Exception fetching IoT logs:', error);
    return { data: null, error };
  }
}

/**
 * Fetch pending audit events (PENDING or WARNING status, no human action)
 * @returns Object with data (array of audit events with details) or error
 */
export async function fetchPendingAudits(): Promise<{ 
  data: AuditEventWithDetails[] | null; 
  error: Error | null 
}> {
  try {
    const { data, error } = await supabase
      .from('audit_events')
      .select(`
        *,
        iot_logs (
          timestamp,
          energy_kwh,
          supplier_id,
          suppliers (
            name
          )
        )
      `)
      .in('status', ['PENDING', 'WARNING', 'ANOMALY'])
      .is('human_action', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending audits:', error);
      return { data: null, error: new Error(error.message) };
    }

    // Transform the nested data structure
    const transformedData = data?.map((audit: any) => ({
      ...audit,
      supplier_name: audit.iot_logs?.suppliers?.name,
      timestamp: audit.iot_logs?.timestamp,
      energy_kwh: audit.iot_logs?.energy_kwh,
    })) || [];

    return { data: transformedData, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error fetching pending audits');
    console.error('Exception fetching pending audits:', error);
    return { data: null, error };
  }
}

/**
 * Create a new audit event
 * @param auditData - Partial audit event data (id will be auto-generated)
 * @returns Object with data (created audit event) or error
 */
export async function createAuditEvent(auditData: {
  log_reference_id: string;
  status: string;
  agent_reasoning: string;
  confidence_score: number;
}): Promise<{ data: AuditEvent | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('audit_events')
      .insert([auditData])
      .select()
      .single();

    if (error) {
      console.error('Error creating audit event:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error creating audit event');
    console.error('Exception creating audit event:', error);
    return { data: null, error };
  }
}

/**
 * Update an audit event with human action
 * @param auditId - UUID of the audit event
 * @param action - 'APPROVED' or 'FLAGGED'
 * @returns Object with data (updated audit event) or error
 */
export async function updateAuditWithHumanAction(
  auditId: string,
  action: 'APPROVED' | 'FLAGGED'
): Promise<{ data: AuditEvent | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('audit_events')
      .update({
        human_action: action,
        human_action_timestamp: new Date().toISOString(),
      })
      .eq('id', auditId)
      .select()
      .single();

    if (error) {
      console.error('Error updating audit with human action:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error updating audit');
    console.error('Exception updating audit:', error);
    return { data: null, error };
  }
}

/**
 * Insert a new IoT log entry
 * @param logData - IoT log data
 * @returns Object with data (created log) or error
 */
export async function insertIotLog(logData: Omit<IotLog, 'id' | 'created_at'>): Promise<{ 
  data: IotLog | null; 
  error: Error | null 
}> {
  try {
    const { data, error } = await supabase
      .from('iot_logs')
      .insert([logData])
      .select()
      .single();

    if (error) {
      console.error('Error inserting IoT log:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error inserting IoT log');
    console.error('Exception inserting IoT log:', error);
    return { data: null, error };
  }
}

/**
 * Fetch a single supplier by ID
 * @param supplierId - UUID of the supplier
 * @returns Object with data (supplier) or error
 */
export async function fetchSupplierById(supplierId: string): Promise<{ 
  data: Supplier | null; 
  error: Error | null 
}> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();

    if (error) {
      console.error('Error fetching supplier:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error fetching supplier');
    console.error('Exception fetching supplier:', error);
    return { data: null, error };
  }
}

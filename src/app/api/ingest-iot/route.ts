// src/app/api/ingest-iot/route.ts
// API endpoint to receive and process IoT sensor data

import { NextRequest, NextResponse } from 'next/server';
import { insertIotLog, fetchSupplierById } from '@/lib/db-helpers';

// Import will be available after we create the orchestrator
let triggerAgentAnalysis: ((logId: string) => Promise<void>) | null = null;

// Lazy load to avoid circular dependencies
async function getTriggerFunction() {
  if (!triggerAgentAnalysis) {
    const module = await import('@/lib/agent-orchestrator');
    triggerAgentAnalysis = module.triggerAgentAnalysis;
  }
  return triggerAgentAnalysis;
}

interface IngestIotRequest {
  supplierId: string;
  timestamp: string;
  energy_kwh: number;
  voltage: number;
  current_amps: number;
  power_watts: number;
  [key: string]: any; // Allow additional fields for raw_json
}

interface IngestIotResponse {
  success: boolean;
  logId?: string;
  message: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<IngestIotResponse>> {
  try {
    // Parse request body
    const body: IngestIotRequest = await request.json();

    // VALIDATION - Check required fields
    const requiredFields = ['supplierId', 'timestamp', 'energy_kwh', 'voltage', 'current_amps', 'power_watts'];
    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          { success: false, message: 'Validation failed', error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate numeric fields are positive
    const numericFields: (keyof IngestIotRequest)[] = ['energy_kwh', 'voltage', 'current_amps', 'power_watts'];
    for (const field of numericFields) {
      const value = body[field] as number;
      if (typeof value !== 'number' || value < 0) {
        return NextResponse.json(
          { success: false, message: 'Validation failed', error: `${field} must be a positive number` },
          { status: 400 }
        );
      }
    }

    // Validate timestamp
    const timestamp = new Date(body.timestamp);
    if (isNaN(timestamp.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', error: 'Invalid timestamp format' },
        { status: 400 }
      );
    }

    // Validate supplier exists
    const { data: supplier, error: supplierError } = await fetchSupplierById(body.supplierId);
    if (supplierError || !supplier) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', error: 'Supplier not found' },
        { status: 400 }
      );
    }

    // DATABASE INSERTION - Insert into iot_logs table
    const logData = {
      supplier_id: body.supplierId,
      timestamp: body.timestamp,
      energy_kwh: body.energy_kwh,
      voltage: body.voltage,
      current_amps: body.current_amps,
      power_watts: body.power_watts,
      raw_json: body, // Store complete request body
    };

    const { data: insertedLog, error: insertError } = await insertIotLog(logData);

    if (insertError || !insertedLog) {
      console.error('Error inserting IoT log:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to save data', error: 'Database insertion failed' },
        { status: 500 }
      );
    }

    // TRIGGER AGENT PIPELINE - Run asynchronously (don't await)
    const trigger = await getTriggerFunction();
    if (trigger) {
      // Fire and forget - let agent analysis run in background
      trigger(insertedLog.id).catch((error) => {
        console.error('Agent analysis failed:', error);
      });
    }

    // Return success response immediately
    return NextResponse.json(
      {
        success: true,
        logId: insertedLog.id,
        message: 'IoT data received and queued for analysis',
      },
      { status: 201 }
    );

  } catch (error) {
    // ERROR HANDLING - Log but don't expose details
    console.error('Ingest API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: 'An unexpected error occurred while processing your request',
      },
      { status: 500 }
    );
  }
}

// Optional: GET method to check API health
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    message: 'IoT Ingestion API is running',
    timestamp: new Date().toISOString(),
  });
}

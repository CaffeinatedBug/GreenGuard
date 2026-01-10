/**
 * IoT Data Ingestion API Endpoint
 * 
 * This endpoint receives data from IoT sensors and triggers the audit process.
 * It orchestrates the entire workflow: fetch context, validate rules, run AI audit.
 * 
 * POST /api/ingest
 * Body: { supplier_id: string, iot_data: IoTData }
 * Response: AuditResult JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAudit, type AuditResult, type IoTData, type SupplierRules } from '@/lib/agents/auditor-agent';

// ============================================================================
// Mock Data Structures (Replace with Supabase in production)
// ============================================================================

/**
 * Mock supplier rules database
 * In production, this would be fetched from Supabase
 */
const MOCK_SUPPLIER_RULES: Record<string, SupplierRules> = {
    'supplier_1': {
        max_load: 200, // kW
        pricing_tier: 'commercial',
        peak_hours: ['09:00-17:00'],
        billing_cycle: 'monthly',
    },
    'supplier_2': {
        max_load: 500, // kW
        pricing_tier: 'industrial',
        peak_hours: ['08:00-20:00'],
        billing_cycle: 'monthly',
    },
    'default': {
        max_load: 100, // kW
        pricing_tier: 'residential',
        peak_hours: ['18:00-22:00'],
        billing_cycle: 'monthly',
    },
};

// ============================================================================
// Request/Response Types
// ============================================================================

interface IngestRequest {
    supplier_id: string;
    iot_data: IoTData;
}

interface IngestResponse {
    success: boolean;
    audit_result?: AuditResult;
    error?: string;
    message?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch supplier rules from mock database
 * In production, this would query Supabase
 */
function getSupplierRules(supplierId: string): SupplierRules {
    console.log(`📦 [MockDB] Fetching rules for supplier: ${supplierId}`);

    const rules = MOCK_SUPPLIER_RULES[supplierId] || MOCK_SUPPLIER_RULES['default'];

    console.log(`✅ [MockDB] Retrieved rules:`, rules);

    return rules;
}

/**
 * Mock function to save audit result to database
 * In production, this would insert into Supabase audit_events table
 */
function saveAuditToDatabase(
    supplierId: string,
    iotData: IoTData,
    auditResult: AuditResult
): void {
    console.log('💾 [MockDB] Would save to audit_events table:');
    console.log({
        supplier_id: supplierId,
        timestamp: new Date().toISOString(),
        verdict: auditResult.verdict,
        confidence: auditResult.confidence,
        reasoning: auditResult.reasoning,
        iot_data: iotData,
        context_data: auditResult.metadata?.context_data,
        logs: auditResult.logs,
    });

    console.log('✅ [MockDB] Audit result logged (would be saved to Supabase in production)');

    // TODO: In production, implement Supabase insert:
    // const { error } = await supabase
    //   .from('audit_events')
    //   .insert({
    //     supplier_id: supplierId,
    //     verdict: auditResult.verdict,
    //     confidence: auditResult.confidence,
    //     reasoning: auditResult.reasoning,
    //     iot_data: iotData,
    //     context_data: auditResult.metadata?.context_data,
    //     logs: auditResult.logs,
    //     created_at: new Date().toISOString(),
    //   });
}

/**
 * Validate incoming IoT data
 */
function validateIoTData(data: any): { valid: boolean; error?: string } {
    if (!data.power || typeof data.power !== 'number') {
        return { valid: false, error: 'Missing or invalid "power" field (must be a number)' };
    }

    if (!data.latitude || typeof data.latitude !== 'number') {
        return { valid: false, error: 'Missing or invalid "latitude" field (must be a number)' };
    }

    if (!data.longitude || typeof data.longitude !== 'number') {
        return { valid: false, error: 'Missing or invalid "longitude" field (must be a number)' };
    }

    if (data.latitude < -90 || data.latitude > 90) {
        return { valid: false, error: 'Latitude must be between -90 and 90' };
    }

    if (data.longitude < -180 || data.longitude > 180) {
        return { valid: false, error: 'Longitude must be between -180 and 180' };
    }

    return { valid: true };
}

// ============================================================================
// API Route Handler
// ============================================================================

/**
 * POST /api/ingest
 * 
 * Main endpoint for IoT data ingestion and audit processing
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    console.log('\n🚀 ========================================');
    console.log('🚀 NEW IoT DATA INGESTION REQUEST');
    console.log('🚀 ========================================\n');

    try {
        // ========================================================================
        // STEP 1: Parse and Validate Request Body
        // ========================================================================
        let body: IngestRequest;

        try {
            body = await request.json();
        } catch (parseError) {
            console.error('❌ Failed to parse request body:', parseError);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid JSON in request body',
                } as IngestResponse,
                { status: 400 }
            );
        }

        console.log('📥 Received request:', {
            supplier_id: body.supplier_id,
            iot_data: body.iot_data,
        });

        // Validate required fields
        if (!body.supplier_id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required field: supplier_id',
                } as IngestResponse,
                { status: 400 }
            );
        }

        if (!body.iot_data) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required field: iot_data',
                } as IngestResponse,
                { status: 400 }
            );
        }

        // Validate IoT data structure
        const validation = validateIoTData(body.iot_data);
        if (!validation.valid) {
            return NextResponse.json(
                {
                    success: false,
                    error: validation.error,
                } as IngestResponse,
                { status: 400 }
            );
        }

        console.log('✅ Request validation passed');

        // ========================================================================
        // STEP 2: Fetch Supplier Rules
        // ========================================================================
        const supplierRules = getSupplierRules(body.supplier_id);

        // ========================================================================
        // STEP 3: Execute Audit Swarm (Context + Rules + AI)
        // ========================================================================
        console.log('\n🤖 Starting audit swarm execution...\n');

        const auditResult = await runAudit(body.iot_data, supplierRules);

        console.log('\n✅ Audit completed successfully:');
        console.log(`   Verdict: ${auditResult.verdict}`);
        console.log(`   Confidence: ${auditResult.confidence}%`);
        console.log(`   Reasoning: ${auditResult.reasoning}`);
        console.log(`   Logs: ${auditResult.logs.length} entries`);

        // ========================================================================
        // STEP 4: Save to Database (Mock for now)
        // ========================================================================
        saveAuditToDatabase(body.supplier_id, body.iot_data, auditResult);

        // ========================================================================
        // STEP 5: Return Response
        // ========================================================================
        const processingTime = Date.now() - startTime;

        console.log(`\n⏱️  Total processing time: ${processingTime}ms`);
        console.log('🚀 ========================================\n');

        return NextResponse.json(
            {
                success: true,
                audit_result: auditResult,
                message: `Audit completed in ${processingTime}ms`,
            } as IngestResponse,
            { status: 200 }
        );

    } catch (error) {
        // ========================================================================
        // Error Handling
        // ========================================================================
        console.error('\n❌ ========================================');
        console.error('❌ AUDIT PROCESSING FAILED');
        console.error('❌ ========================================');
        console.error('Error details:', error);
        console.error('❌ ========================================\n');

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            {
                success: false,
                error: `Audit processing failed: ${errorMessage}`,
            } as IngestResponse,
            { status: 500 }
        );
    }
}

// ============================================================================
// Additional Route Handlers
// ============================================================================

/**
 * GET /api/ingest
 * 
 * Health check endpoint
 */
export async function GET() {
    return NextResponse.json(
        {
            status: 'healthy',
            endpoint: '/api/ingest',
            methods: ['POST'],
            description: 'IoT data ingestion endpoint for carbon audit processing',
            version: '1.0.0',
            example_request: {
                supplier_id: 'supplier_1',
                iot_data: {
                    power: 150,
                    latitude: 28.6139,
                    longitude: 77.2090,
                    temperature: 32,
                    humidity: 65,
                },
            },
        },
        { status: 200 }
    );
}

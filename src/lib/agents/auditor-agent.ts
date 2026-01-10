/**
 * Auditor Agent - AI-Powered Carbon Audit System
 * 
 * This agent combines IoT sensor data, external context (weather/grid),
 * and supplier billing rules to perform intelligent audits using Gemini AI.
 * 
 * CONFIGURATION:
 * ==============
 * Add to .env.local:
 * NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
 * 
 * Get your API key at: https://aistudio.google.com/app/apikey
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getContextData, type ContextData } from '@/lib/agents/context-agent';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Audit verdict classifications
 */
export type AuditVerdict = 'VERIFIED' | 'ANOMALY' | 'WARNING';

/**
 * Individual log entry for audit trail
 */
export interface AuditLog {
    agent: string;
    message: string;
    status: 'info' | 'success' | 'warning' | 'error';
    timestamp: string;
}

/**
 * Complete audit result with verdict, confidence, reasoning, and logs
 */
export interface AuditResult {
    verdict: AuditVerdict;
    confidence: number; // 0-100
    reasoning: string;
    logs: AuditLog[];
    metadata?: {
        iot_data?: any;
        context_data?: ContextData;
        supplier_rules?: any;
        llm_raw_response?: string;
    };
}

/**
 * IoT sensor data structure
 */
export interface IoTData {
    power: number; // Current power consumption in kW
    latitude: number;
    longitude: number;
    timestamp?: string;
    temperature?: number;
    humidity?: number;
    [key: string]: any; // Allow additional sensor data
}

/**
 * Supplier billing rules structure
 */
export interface SupplierRules {
    max_load: number; // Maximum allowed load in kW
    pricing_tier?: string;
    peak_hours?: string[];
    [key: string]: any; // Allow additional rules
}

/**
 * Gemini AI response structure
 */
interface GeminiAuditResponse {
    verdict: AuditVerdict;
    confidence: number;
    reasoning: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a log entry with timestamp
 */
function createLog(
    agent: string,
    message: string,
    status: AuditLog['status'] = 'info'
): AuditLog {
    return {
        agent,
        message,
        status,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Construct the prompt for Gemini AI
 */
function constructAuditPrompt(
    iotData: IoTData,
    contextData: ContextData,
    supplierRules: SupplierRules
): string {
    return `You are an expert Carbon Auditor analyzing energy consumption patterns.

**Your Task:**
Analyze if the current energy spike is justified by environmental conditions or if it indicates wasteful/fraudulent usage.

**IoT Sensor Data:**
- Current Power Consumption: ${iotData.power} kW
- Location: ${iotData.latitude}, ${iotData.longitude}
- Timestamp: ${iotData.timestamp || new Date().toISOString()}
${iotData.temperature ? `- Sensor Temperature: ${iotData.temperature}°C` : ''}
${iotData.humidity ? `- Sensor Humidity: ${iotData.humidity}%` : ''}

**Environmental Context (${contextData.source.weather === 'api' ? 'Real-time' : 'Estimated'}):**
- Weather: ${contextData.weather.condition}
- Temperature: ${contextData.weather.temp_c}°C
- Humidity: ${contextData.weather.humidity}%
- Grid Carbon Intensity: ${contextData.grid.grid_carbon_intensity} gCO2/kWh (${contextData.grid.is_high_intensity ? 'HIGH' : 'LOW'})

**Supplier Rules:**
- Maximum Allowed Load: ${supplierRules.max_load} kW
- Current Load vs Max: ${((iotData.power / supplierRules.max_load) * 100).toFixed(1)}%
${supplierRules.pricing_tier ? `- Pricing Tier: ${supplierRules.pricing_tier}` : ''}

**Analysis Guidelines:**
1. High power consumption may be justified if:
   - Temperature is very high (>30°C) or very low (<10°C) → AC/heating usage
   - Humidity is high (>80%) → dehumidifier usage
   - It's within peak business hours → normal operations

2. Consumption is suspicious if:
   - Power exceeds max_load significantly without environmental justification
   - Environmental conditions are mild but power is unusually high
   - Patterns don't match typical usage for the conditions

3. Consider the carbon intensity of the grid:
   - High carbon intensity periods warrant extra scrutiny
   - Unnecessary consumption during high carbon times is more problematic

**Output Requirements:**
You MUST respond with ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "verdict": "VERIFIED" | "ANOMALY" | "WARNING",
  "confidence": <number between 0-100>,
  "reasoning": "<concise 1-2 sentence explanation>"
}

**Verdict Definitions:**
- VERIFIED: Consumption is justified by environmental conditions and within normal parameters
- WARNING: Consumption is elevated but has some justification; monitor closely
- ANOMALY: Consumption appears unjustified or fraudulent; requires immediate investigation

Analyze now and respond with JSON only:`;
}

/**
 * Parse Gemini AI response and extract JSON
 */
function parseGeminiResponse(responseText: string): GeminiAuditResponse {
    try {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : responseText;

        // Clean up any potential formatting issues
        const cleanedJson = jsonString.trim();

        const parsed = JSON.parse(cleanedJson);

        // Validate the structure
        if (!parsed.verdict || !parsed.confidence || !parsed.reasoning) {
            throw new Error('Missing required fields in Gemini response');
        }

        // Normalize verdict to uppercase
        parsed.verdict = parsed.verdict.toUpperCase();

        // Ensure confidence is within range
        parsed.confidence = Math.max(0, Math.min(100, parsed.confidence));

        return parsed as GeminiAuditResponse;
    } catch (error) {
        throw new Error(`Failed to parse Gemini response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// ============================================================================
// Main Audit Function
// ============================================================================

/**
 * Run a complete audit on IoT data using AI analysis
 * 
 * This function:
 * 1. Fetches external context data (weather, grid carbon intensity)
 * 2. Compares IoT readings against supplier rules
 * 3. Uses Gemini AI to analyze the data and provide an intelligent verdict
 * 4. Returns a comprehensive audit result with logs
 * 
 * @param iotData - Current IoT sensor readings
 * @param supplierRules - Billing and usage rules from the energy supplier
 * @returns Promise resolving to complete audit result
 * 
 * @example
 * ```typescript
 * const result = await runAudit(
 *   { power: 150, latitude: 28.6139, longitude: 77.2090 },
 *   { max_load: 200, pricing_tier: 'commercial' }
 * );
 * console.log(result.verdict); // 'VERIFIED', 'WARNING', or 'ANOMALY'
 * ```
 */
export async function runAudit(
    iotData: IoTData,
    supplierRules: SupplierRules
): Promise<AuditResult> {
    const logs: AuditLog[] = [];

    // Initialize audit
    logs.push(createLog('AuditorAgent', 'Starting carbon audit analysis', 'info'));

    try {
        // ========================================================================
        // STEP 1: Fetch External Context Data
        // ========================================================================
        logs.push(createLog(
            'ContextAgent',
            `Fetching weather and grid data for coordinates: ${iotData.latitude}, ${iotData.longitude}`,
            'info'
        ));

        const contextData = await getContextData(iotData.latitude, iotData.longitude);

        logs.push(createLog(
            'ContextAgent',
            `Retrieved context data - Weather: ${contextData.weather.temp_c}°C ${contextData.weather.condition}, Grid: ${contextData.grid.grid_carbon_intensity} gCO2/kWh`,
            'success'
        ));

        // ========================================================================
        // STEP 2: Validate Against Supplier Rules
        // ========================================================================
        logs.push(createLog(
            'RulesEngine',
            `Checking power consumption (${iotData.power} kW) against max load (${supplierRules.max_load} kW)`,
            'info'
        ));

        const loadPercentage = (iotData.power / supplierRules.max_load) * 100;

        if (iotData.power > supplierRules.max_load) {
            logs.push(createLog(
                'RulesEngine',
                `⚠️ WARNING: Power consumption exceeds maximum load by ${(loadPercentage - 100).toFixed(1)}%`,
                'warning'
            ));
        } else if (loadPercentage > 90) {
            logs.push(createLog(
                'RulesEngine',
                `Approaching maximum load: ${loadPercentage.toFixed(1)}% capacity`,
                'warning'
            ));
        } else {
            logs.push(createLog(
                'RulesEngine',
                `Load within acceptable range: ${loadPercentage.toFixed(1)}% of maximum`,
                'success'
            ));
        }

        // ========================================================================
        // STEP 3: AI Analysis with Gemini
        // ========================================================================
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            logs.push(createLog(
                'GeminiAI',
                'API key not found. Using rule-based fallback analysis.',
                'warning'
            ));

            // Fallback logic when Gemini is not available
            return performFallbackAudit(iotData, contextData, supplierRules, logs);
        }

        logs.push(createLog('GeminiAI', 'Initializing AI analysis with Gemini', 'info'));

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = constructAuditPrompt(iotData, contextData, supplierRules);

        logs.push(createLog('GeminiAI', 'Sending audit request to Gemini AI', 'info'));

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        logs.push(createLog('GeminiAI', 'Received response from Gemini AI', 'success'));

        // Parse the AI response
        const aiAnalysis = parseGeminiResponse(responseText);

        logs.push(createLog(
            'GeminiAI',
            `AI Verdict: ${aiAnalysis.verdict} (${aiAnalysis.confidence}% confidence)`,
            aiAnalysis.verdict === 'ANOMALY' ? 'error' : aiAnalysis.verdict === 'WARNING' ? 'warning' : 'success'
        ));

        logs.push(createLog('AuditorAgent', 'Audit completed successfully', 'success'));

        return {
            verdict: aiAnalysis.verdict,
            confidence: aiAnalysis.confidence,
            reasoning: aiAnalysis.reasoning,
            logs,
            metadata: {
                iot_data: iotData,
                context_data: contextData,
                supplier_rules: supplierRules,
                llm_raw_response: responseText,
            },
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        logs.push(createLog(
            'AuditorAgent',
            `Audit failed: ${errorMessage}`,
            'error'
        ));

        // Return a safe fallback result on error
        return {
            verdict: 'WARNING',
            confidence: 0,
            reasoning: `Audit failed due to system error: ${errorMessage}. Manual review required.`,
            logs,
        };
    }
}

// ============================================================================
// Fallback Logic (When Gemini is Unavailable)
// ============================================================================

/**
 * Perform rule-based audit when AI is unavailable
 */
function performFallbackAudit(
    iotData: IoTData,
    contextData: ContextData,
    supplierRules: SupplierRules,
    logs: AuditLog[]
): AuditResult {
    logs.push(createLog('RulesEngine', 'Performing rule-based fallback analysis', 'info'));

    const loadPercentage = (iotData.power / supplierRules.max_load) * 100;
    const temp = contextData.weather.temp_c;

    let verdict: AuditVerdict;
    let confidence: number;
    let reasoning: string;

    // Rule-based decision logic
    if (iotData.power > supplierRules.max_load * 1.2) {
        // Exceeds limit by >20%
        verdict = 'ANOMALY';
        confidence = 85;
        reasoning = `Power consumption (${iotData.power} kW) exceeds maximum load by ${(loadPercentage - 100).toFixed(1)}% without clear justification.`;
    } else if (iotData.power > supplierRules.max_load) {
        // Exceeds limit but <20%
        if (temp > 32 || temp < 5) {
            verdict = 'WARNING';
            confidence = 60;
            reasoning = `Power slightly exceeds limit but may be justified by extreme temperature (${temp}°C).`;
        } else {
            verdict = 'ANOMALY';
            confidence = 75;
            reasoning = `Power exceeds maximum load under mild weather conditions (${temp}°C).`;
        }
    } else if (loadPercentage > 90) {
        verdict = 'WARNING';
        confidence = 70;
        reasoning = `High load utilization (${loadPercentage.toFixed(1)}%) warrants monitoring.`;
    } else {
        verdict = 'VERIFIED';
        confidence = 80;
        reasoning = `Power consumption within acceptable range (${loadPercentage.toFixed(1)}% of max load).`;
    }

    logs.push(createLog('RulesEngine', `Fallback verdict: ${verdict}`, 'success'));

    return {
        verdict,
        confidence,
        reasoning,
        logs,
        metadata: {
            iot_data: iotData,
            context_data: contextData,
            supplier_rules: supplierRules,
        },
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get a human-readable summary of an audit result
 */
export function getAuditSummary(result: AuditResult): string {
    const emoji = result.verdict === 'VERIFIED' ? '✅' : result.verdict === 'WARNING' ? '⚠️' : '🚨';
    return `${emoji} ${result.verdict} (${result.confidence}% confidence): ${result.reasoning}`;
}

/**
 * Check if an audit result requires immediate action
 */
export function requiresAction(result: AuditResult): boolean {
    return result.verdict === 'ANOMALY' || (result.verdict === 'WARNING' && result.confidence > 70);
}

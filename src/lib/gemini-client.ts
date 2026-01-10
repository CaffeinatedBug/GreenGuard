// src/lib/gemini-client.ts
// Wrapper for Google Gemini AI API for energy anomaly analysis

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AuditEvent } from '@/types/database';

// Initialize Gemini client
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// Types for AI analysis
export interface EnergyAnalysisParams {
  currentReading: number;
  billMaxLoad: number;
  gridCarbonIntensity: number;
  historicalAverage: number;
  supplierName?: string;
  timestamp?: string;
}

export interface EnergyAnalysisResult {
  status: 'NORMAL' | 'WARNING' | 'ANOMALY' | 'PENDING';
  reasoning: string;
  confidence: number;
}

/**
 * Analyze energy reading for anomalies using Gemini AI
 */
export async function analyzeEnergyAnomaly(
  params: EnergyAnalysisParams
): Promise<EnergyAnalysisResult> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-flash-latest' });

    // Construct prompt for Gemini
    const prompt = `You are an expert carbon auditing AI analyzing industrial energy consumption data.

ENERGY DATA ANALYSIS:
- Current Reading: ${params.currentReading} kWh
- Bill Maximum Load: ${params.billMaxLoad} kWh (contractual limit)
- Historical Average: ${params.historicalAverage} kWh
- Grid Carbon Intensity: ${params.gridCarbonIntensity} g CO₂/kWh
${params.supplierName ? `- Supplier: ${params.supplierName}` : ''}
${params.timestamp ? `- Timestamp: ${params.timestamp}` : ''}

TASK:
Analyze this energy reading and determine if it represents:
- NORMAL: Reading is within expected range (< 90% of max load)
- WARNING: Reading is elevated but not critical (90-100% of max load)
- ANOMALY: Reading exceeds contractual limit or shows concerning pattern (> 100% of max load)

Provide your analysis in exactly this JSON format:
{
  "status": "NORMAL" | "WARNING" | "ANOMALY",
  "reasoning": "Brief 2-3 sentence explanation of your decision",
  "confidence": 85
}

Consider:
1. How far is the current reading from the maximum allowed load?
2. How does it compare to the historical average?
3. What is the carbon impact of this reading?
4. Are there any patterns suggesting equipment malfunction or fraud?

Be concise and technical. Confidence should be 0-100.`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response
    return parseAIResponse(text);

  } catch (error) {
    console.error('Gemini API error:', error);

    // Handle rate limits
    if (error instanceof Error && error.message.includes('429')) {
      console.warn('Gemini API rate limit reached');
    }

    // Return safe default on error
    return {
      status: 'PENDING',
      reasoning: 'AI analysis unavailable. Manual review required.',
      confidence: 0,
    };
  }
}

/**
 * Parse AI response text and extract structured data
 */
function parseAIResponse(text: string): EnergyAnalysisResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize
      const status = ['NORMAL', 'WARNING', 'ANOMALY'].includes(parsed.status)
        ? parsed.status
        : 'PENDING';
      
      const reasoning = typeof parsed.reasoning === 'string'
        ? parsed.reasoning.substring(0, 500) // Limit length
        : 'Analysis completed';
      
      const confidence = typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(100, parsed.confidence))
        : 50;

      return { status, reasoning, confidence };
    }

    // Fallback: try to extract status from text
    const textUpper = text.toUpperCase();
    let status: 'NORMAL' | 'WARNING' | 'ANOMALY' | 'PENDING' = 'PENDING';
    
    if (textUpper.includes('ANOMALY')) status = 'ANOMALY';
    else if (textUpper.includes('WARNING')) status = 'WARNING';
    else if (textUpper.includes('NORMAL')) status = 'NORMAL';

    return {
      status,
      reasoning: text.substring(0, 300), // Use first 300 chars
      confidence: 70, // Default confidence
    };

  } catch (parseError) {
    console.error('Error parsing AI response:', parseError);
    
    // Return safe default
    return {
      status: 'PENDING',
      reasoning: 'Unable to parse AI analysis. Manual review required.',
      confidence: 0,
    };
  }
}

/**
 * Generate human-friendly explanation for an audit event
 */
export async function explainAnomalyToHuman(
  auditEvent: AuditEvent,
  supplierName?: string,
  energyReading?: number
): Promise<string> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `Explain this energy audit result to a non-technical business user in 1-2 simple sentences:

Status: ${auditEvent.status}
Technical Reasoning: ${auditEvent.agent_reasoning}
${supplierName ? `Supplier: ${supplierName}` : ''}
${energyReading ? `Energy: ${energyReading} kWh` : ''}

Make it friendly and actionable. Avoid jargon.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text.trim().substring(0, 200); // Limit to 200 chars

  } catch (error) {
    console.error('Error generating human explanation:', error);
    
    // Fallback to simple explanation
    if (auditEvent.status === 'ANOMALY') {
      return 'Energy usage exceeded the allowed limit. Please review and take action.';
    } else if (auditEvent.status === 'WARNING') {
      return 'Energy usage is higher than normal. Monitoring recommended.';
    } else {
      return 'Energy usage is within normal range.';
    }
  }
}

/**
 * Retry wrapper for API calls
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 1,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    console.log(`Retrying after ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

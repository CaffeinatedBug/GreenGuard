// src/lib/bill-reader-agent.ts
// Simplified bill reader for electricity bill data extraction

export interface BillData {
  maxLoadKwh: number;
  billingPeriod: string;
  supplierName: string;
  totalKwh?: number;
  costPerUnit?: number;
}

/**
 * Mock AI extraction from bill file
 * For demo purposes, returns hardcoded values based on file name
 * 
 * TODO: Integrate OpenAI Vision API or Google Document AI for production
 */
export function parseBillWithAI(file: File): BillData {
  const fileName = file.name.toLowerCase();

  // Demo logic: extract based on file name
  if (fileName.includes('ahmedabad') || fileName.includes('textiles')) {
    return {
      maxLoadKwh: 350,
      billingPeriod: 'January 2026',
      supplierName: 'Ahmedabad Textiles Ltd',
      totalKwh: 8750,
      costPerUnit: 7.5,
    };
  } else if (fileName.includes('mumbai') || fileName.includes('electronics')) {
    return {
      maxLoadKwh: 500,
      billingPeriod: 'January 2026',
      supplierName: 'Mumbai Electronics Co',
      totalKwh: 12500,
      costPerUnit: 6.8,
    };
  }

  // Default fallback
  return {
    maxLoadKwh: 400,
    billingPeriod: 'January 2026',
    supplierName: 'Unknown Supplier',
    totalKwh: 10000,
    costPerUnit: 7.0,
  };
}

/**
 * Extract bill data - main entry point
 * 
 * @param file - PDF or image file of electricity bill
 * @param useAI - Whether to use AI extraction (false = manual entry required)
 * @returns BillData object or null if manual entry needed
 */
export function extractBillData(file: File, useAI: boolean = false): BillData | null {
  if (useAI) {
    // Use mock AI extraction for demo
    return parseBillWithAI(file);
  }

  // Manual entry required
  return null;
}

/**
 * Validate bill data
 */
export function validateBillData(data: Partial<BillData>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.maxLoadKwh || data.maxLoadKwh <= 0) {
    errors.push('Maximum load must be greater than 0');
  }

  if (!data.billingPeriod || data.billingPeriod.trim().length === 0) {
    errors.push('Billing period is required');
  }

  if (!data.supplierName || data.supplierName.trim().length === 0) {
    errors.push('Supplier name is required');
  }

  if (data.totalKwh !== undefined && data.totalKwh < 0) {
    errors.push('Total kWh cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format bill data for display
 */
export function formatBillData(data: BillData): string {
  return `
Bill Period: ${data.billingPeriod}
Supplier: ${data.supplierName}
Maximum Allowed Load: ${data.maxLoadKwh} kWh
${data.totalKwh ? `Total Consumption: ${data.totalKwh} kWh` : ''}
${data.costPerUnit ? `Rate: ₹${data.costPerUnit}/kWh` : ''}
  `.trim();
}

// src/lib/mock-data-generator.ts
// Mock IoT data generator for development and testing

import type { IotLog } from '@/types/database';
import { insertIotLog } from './db-helpers';

type Pattern = 'NORMAL' | 'SPIKE' | 'GRADUAL_RISE';

export class MockIotGenerator {
  /**
   * Generate a single IoT reading with realistic sensor data
   * @param supplierId - UUID of the supplier
   * @param baseLoad - Base energy consumption in kWh (e.g., 300)
   * @param variation - Random percentage variation (+/- 0.2 = 20%)
   * @returns IoT log object
   */
  generateReading(
    supplierId: string,
    baseLoad: number,
    variation: number = 0.2
  ): Omit<IotLog, 'id' | 'created_at'> {
    // Calculate energy with random variation
    const variationFactor = 1 + (Math.random() * variation * 2 - variation);
    const energy_kwh = baseLoad * variationFactor;
    
    // Calculate power in watts (assuming reading is per hour)
    const power_watts = energy_kwh * 1000;
    
    // Standard voltage with small variation (230V +/- 5%)
    const voltage = 230 + (Math.random() * 23 - 11.5);
    
    // Calculate current using P = V * I
    const current_amps = power_watts / voltage;
    
    // Create raw JSON payload with additional sensor data
    const raw_json = {
      sensor_id: `SENSOR_${supplierId.slice(0, 8)}`,
      firmware_version: '2.4.1',
      signal_strength: Math.floor(Math.random() * 30) + 70, // 70-100%
      temperature_c: Math.floor(Math.random() * 15) + 25, // 25-40°C
      humidity_percent: Math.floor(Math.random() * 30) + 40, // 40-70%
      power_factor: 0.85 + Math.random() * 0.1, // 0.85-0.95
      frequency_hz: 50 + (Math.random() * 0.4 - 0.2), // 49.8-50.2 Hz
      readings: {
        energy_kwh,
        voltage,
        current_amps,
        power_watts,
      },
    };
    
    return {
      supplier_id: supplierId,
      timestamp: new Date().toISOString(),
      energy_kwh: Number(energy_kwh.toFixed(2)),
      voltage: Number(voltage.toFixed(2)),
      current_amps: Number(current_amps.toFixed(2)),
      power_watts: Number(power_watts.toFixed(2)),
      raw_json,
    };
  }

  /**
   * Generate a sequence of IoT readings over time
   * @param supplierId - UUID of the supplier
   * @param count - Number of readings to generate
   * @param pattern - Energy consumption pattern
   * @returns Array of IoT log objects
   */
  generateSequence(
    supplierId: string,
    count: number,
    pattern: Pattern = 'NORMAL'
  ): Omit<IotLog, 'id' | 'created_at'>[] {
    const readings: Omit<IotLog, 'id' | 'created_at'>[] = [];
    const baseLoad = 300; // Base load in kWh
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      // Calculate timestamp (5 minutes apart, going backwards)
      const timestamp = new Date(now.getTime() - (count - i - 1) * 5 * 60 * 1000);
      
      let currentLoad = baseLoad;
      
      // Apply pattern
      switch (pattern) {
        case 'SPIKE':
          // Create a spike in the middle
          if (i === Math.floor(count / 2)) {
            currentLoad = baseLoad * 1.5; // 150% spike
          }
          break;
          
        case 'GRADUAL_RISE':
          // Increase by 10% each reading
          currentLoad = baseLoad * (1 + i * 0.1);
          break;
          
        case 'NORMAL':
        default:
          // Normal variation
          break;
      }
      
      const reading = this.generateReading(supplierId, currentLoad, 0.15);
      reading.timestamp = timestamp.toISOString();
      readings.push(reading);
    }
    
    return readings;
  }

  /**
   * Generate a specific anomaly scenario for demo purposes
   * @param supplierId - UUID of the supplier
   * @param billMaxLoad - Maximum allowed load from bill (kWh)
   * @returns Array with 3 readings: normal, warning, anomaly
   */
  generateAnomalyScenario(
    supplierId: string,
    billMaxLoad: number
  ): Omit<IotLog, 'id' | 'created_at'>[] {
    const readings: Omit<IotLog, 'id' | 'created_at'>[] = [];
    const now = new Date();
    
    // Reading 1: Normal (80% of max)
    const normalLoad = billMaxLoad * 0.8;
    const normalReading = this.generateReading(supplierId, normalLoad, 0.05);
    normalReading.timestamp = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    readings.push(normalReading);
    
    // Reading 2: Warning (95% of max)
    const warningLoad = billMaxLoad * 0.95;
    const warningReading = this.generateReading(supplierId, warningLoad, 0.05);
    warningReading.timestamp = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    readings.push(warningReading);
    
    // Reading 3: Anomaly (125% of max - exceeds bill limit)
    const anomalyLoad = billMaxLoad * 1.25;
    const anomalyReading = this.generateReading(supplierId, anomalyLoad, 0.05);
    anomalyReading.timestamp = now.toISOString();
    readings.push(anomalyReading);
    
    return readings;
  }
}

/**
 * Insert mock data into the database
 * @param readings - Array of IoT readings
 * @returns Success/failure status with count
 */
export async function insertMockData(
  readings: Omit<IotLog, 'id' | 'created_at'>[]
): Promise<{ success: boolean; count: number; error?: Error }> {
  let successCount = 0;
  let lastError: Error | null = null;
  
  for (const reading of readings) {
    const { data, error } = await insertIotLog(reading);
    
    if (error) {
      console.error('Error inserting reading:', error);
      lastError = error;
    } else if (data) {
      successCount++;
    }
  }
  
  return {
    success: successCount === readings.length,
    count: successCount,
    error: lastError || undefined,
  };
}

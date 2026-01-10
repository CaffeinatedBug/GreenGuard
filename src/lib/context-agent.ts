// src/lib/context-agent.ts
// Context agent for fetching environmental data (weather, grid carbon intensity)

/**
 * Get grid carbon intensity for a location
 * Returns grams of CO2 per kWh
 * 
 * TODO: Integrate electricityMap API for real-time data
 * https://api.electricitymap.org/
 */
export function getGridCarbonIntensity(location: string, timestamp: Date): number {
  const locationLower = location.toLowerCase();

  // Mock data based on Indian grid regions
  if (locationLower.includes('ahmedabad') || locationLower.includes('gujarat')) {
    // Gujarat - coal-heavy grid
    return 820 + getTimeVariation(timestamp);
  } else if (locationLower.includes('mumbai') || locationLower.includes('maharashtra')) {
    // Maharashtra - moderate mix
    return 650 + getTimeVariation(timestamp);
  } else if (locationLower.includes('kerala') || locationLower.includes('bangalore') || locationLower.includes('karnataka')) {
    // South India - more renewable energy
    return 400 + getTimeVariation(timestamp);
  } else if (locationLower.includes('delhi') || locationLower.includes('haryana')) {
    // North India - high coal dependency
    return 900 + getTimeVariation(timestamp);
  } else if (locationLower.includes('tamil nadu') || locationLower.includes('chennai')) {
    // Tamil Nadu - wind + coal mix
    return 550 + getTimeVariation(timestamp);
  }

  // Default for unknown locations
  return 750;
}

/**
 * Add realistic time-based variation to grid intensity
 * Carbon intensity varies during peak hours
 */
function getTimeVariation(timestamp: Date): number {
  const hour = timestamp.getHours();

  // Peak hours (6-10am, 6-11pm) have higher intensity
  if ((hour >= 6 && hour <= 10) || (hour >= 18 && hour <= 23)) {
    return Math.floor(Math.random() * 50); // +0 to +50
  }

  // Off-peak hours have lower intensity
  return Math.floor(Math.random() * 30) - 15; // -15 to +15
}

/**
 * Weather context data
 */
export interface WeatherContext {
  temperature: number; // Celsius
  condition: string;
  humidity?: number;
}

/**
 * Get weather context for a location
 * 
 * TODO: Integrate OpenWeather API for real data
 * https://openweathermap.org/api
 */
export function getWeatherContext(location: string, timestamp: Date): WeatherContext {
  const hour = timestamp.getHours();
  const month = timestamp.getMonth() + 1; // 1-12

  // Base temperature varies by location
  let baseTemp = 25;
  const locationLower = location.toLowerCase();

  if (locationLower.includes('mumbai')) {
    baseTemp = 28; // Mumbai is typically warmer and humid
  } else if (locationLower.includes('ahmedabad') || locationLower.includes('delhi')) {
    baseTemp = 30; // Hot climate
  } else if (locationLower.includes('bangalore')) {
    baseTemp = 23; // Moderate climate
  }

  // Adjust for summer months (March-June in India)
  if (month >= 3 && month <= 6) {
    baseTemp += 5;
  } else if (month >= 11 || month <= 2) {
    // Winter months
    baseTemp -= 3;
  }

  // Adjust for time of day
  let temperature: number;
  let condition: string;

  if (hour >= 10 && hour <= 16) {
    // Daytime: hot
    temperature = baseTemp + Math.random() * 7;
    condition = Math.random() > 0.7 ? 'Cloudy' : 'Clear';
  } else if (hour >= 6 && hour < 10) {
    // Morning: moderate
    temperature = baseTemp - 3 + Math.random() * 4;
    condition = 'Clear';
  } else {
    // Evening/Night: cool
    temperature = baseTemp - 7 + Math.random() * 5;
    condition = 'Clear';
  }

  // Occasional rain (10% chance)
  if (Math.random() < 0.1) {
    condition = 'Rainy';
    temperature -= 2;
  }

  // Calculate humidity (higher in Mumbai, during rain)
  let humidity = 60;
  if (locationLower.includes('mumbai')) humidity = 75;
  if (condition === 'Rainy') humidity = 85;
  humidity += Math.floor(Math.random() * 10) - 5;

  return {
    temperature: Math.round(temperature * 10) / 10, // Round to 1 decimal
    condition,
    humidity,
  };
}

/**
 * Contextual anomaly analysis result
 */
export interface ContextualAnomalyResult {
  isSuspicious: boolean;
  reason: string;
  contextFlags: string[];
}

/**
 * Analyze if energy reading is suspicious given context
 */
export function analyzeContextualAnomaly(
  energyReading: number,
  weather: WeatherContext,
  gridIntensity: number,
  billMaxLoad: number
): ContextualAnomalyResult {
  const flags: string[] = [];
  let isSuspicious = false;
  let reason = 'Energy usage aligns with environmental context';

  // Flag 1: High energy in cool weather (suspicious AC usage)
  if (energyReading > billMaxLoad * 0.8 && weather.temperature < 22) {
    flags.push('HIGH_ENERGY_COOL_WEATHER');
    isSuspicious = true;
    reason = `High energy usage (${energyReading} kWh) detected during cool weather (${weather.temperature}°C). Unexpected AC load or equipment malfunction?`;
  }

  // Flag 2: Extreme energy during off-peak with high carbon
  if (gridIntensity > 800 && energyReading > billMaxLoad * 0.9) {
    flags.push('HIGH_CARBON_IMPACT');
    
    if (!isSuspicious) {
      reason = `Energy usage during high carbon intensity period (${gridIntensity}g/kWh). Consider load shifting to reduce environmental impact.`;
    }
  }

  // Flag 3: Very high energy regardless of context
  if (energyReading > billMaxLoad * 1.2) {
    flags.push('CRITICAL_OVERAGE');
    isSuspicious = true;
    reason = `Critical: Energy usage ${((energyReading / billMaxLoad - 1) * 100).toFixed(0)}% above contractual limit.`;
  }

  // Flag 4: Unusual pattern - very low temp but high energy (not for heating)
  if (weather.temperature > 35 && energyReading > billMaxLoad * 0.85) {
    flags.push('EXTREME_HEAT_HIGH_LOAD');
    // This is actually expected (AC usage) - not suspicious
    if (!isSuspicious) {
      reason = `High energy usage expected due to extreme heat (${weather.temperature}°C).`;
    }
  }

  // Flag 5: Rainy day with unexpectedly high load
  if (weather.condition === 'Rainy' && energyReading > billMaxLoad * 0.9) {
    flags.push('HIGH_LOAD_RAINY_DAY');
    // Rainy days typically see lower industrial activity
    if (!isSuspicious) {
      isSuspicious = true;
      reason = `Unexpectedly high energy usage (${energyReading} kWh) during rainy conditions. Verify operations are normal.`;
    }
  }

  return {
    isSuspicious,
    reason,
    contextFlags: flags,
  };
}

/**
 * Get comprehensive context summary for logging
 */
export function getContextSummary(
  location: string,
  timestamp: Date
): {
  weather: WeatherContext;
  gridIntensity: number;
  summary: string;
} {
  const weather = getWeatherContext(location, timestamp);
  const gridIntensity = getGridCarbonIntensity(location, timestamp);

  const summary = `Weather: ${weather.temperature}°C, ${weather.condition} | Grid: ${gridIntensity}g CO₂/kWh`;

  return {
    weather,
    gridIntensity,
    summary,
  };
}

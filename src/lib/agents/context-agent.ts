/**
 * Context Agent - External Environmental Data Fetcher
 * 
 * This agent fetches real-world environmental data to validate IoT sensor readings.
 * It provides weather data and grid carbon intensity information.
 * 
 * CONFIGURATION INSTRUCTIONS:
 * ===========================
 * 
 * Add the following environment variables to your .env.local file:
 * 
 * # OpenWeatherMap API (Required for Weather Data)
 * # Get your free API key at: https://openweathermap.org/api
 * # 1. Sign up for a free account
 * # 2. Navigate to API Keys section
 * # 3. Generate a new API key (instant activation)
 * NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
 * 
 * # ElectricityMaps API (Optional - For Production)
 * # Get your free trial at: https://api-portal.electricitymaps.com/
 * # Note: This may take time to approve, so we provide mock fallback for hackathons
 * NEXT_PUBLIC_ELECTRICITYMAPS_API_KEY=your_api_key_here
 * 
 * HACKATHON TIP: If ElectricityMaps API access is too slow to get,
 * the code will automatically use intelligent mock data based on location.
 */

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Weather data structure from OpenWeatherMap
 */
interface WeatherData {
    temp_c: number;
    condition: string;
    humidity: number;
}

/**
 * Grid carbon intensity data structure
 */
interface GridData {
    grid_carbon_intensity: number; // in gCO2/kWh
    is_high_intensity: boolean;    // true if > 500 gCO2/kWh
}

/**
 * Combined context data returned by getContextData
 */
export interface ContextData {
    weather: WeatherData;
    grid: GridData;
    timestamp: string;
    source: {
        weather: 'api' | 'mock';
        grid: 'api' | 'mock';
    };
}

/**
 * OpenWeatherMap API response structure (partial)
 */
interface OpenWeatherResponse {
    main: {
        temp: number;      // Temperature in Kelvin
        humidity: number;  // Humidity percentage
    };
    weather: Array<{
        main: string;      // Weather condition (e.g., 'Clear', 'Rain')
    }>;
}

/**
 * ElectricityMaps API response structure (partial)
 */
interface ElectricityMapsResponse {
    carbonIntensity: number; // gCO2eq/kWh
    zone: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch current weather data from OpenWeatherMap API
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Weather data or null if failed
 */
async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

    if (!apiKey) {
        console.warn('⚠️ NEXT_PUBLIC_OPENWEATHER_API_KEY not found. Using mock weather data.');
        return null;
    }

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`OpenWeather API error: ${response.status}`);
        }

        const data: OpenWeatherResponse = await response.json();

        return {
            temp_c: Math.round((data.main.temp - 273.15) * 10) / 10, // Convert Kelvin to Celsius
            condition: data.weather[0]?.main || 'Unknown',
            humidity: data.main.humidity,
        };
    } catch (error) {
        console.error('❌ Failed to fetch weather data:', error);
        return null;
    }
}

/**
 * Fetch carbon intensity data from ElectricityMaps API
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Grid data or null if failed
 */
async function fetchGridData(lat: number, lon: number): Promise<GridData | null> {
    const apiKey = process.env.NEXT_PUBLIC_ELECTRICITYMAPS_API_KEY;

    if (!apiKey) {
        console.warn('⚠️ NEXT_PUBLIC_ELECTRICITYMAPS_API_KEY not found. Using mock grid data.');
        return null;
    }

    try {
        // Use current datetime for the API call
        // Format: YYYY-MM-DD HH:MM (URL encoded)
        const now = new Date();
        const datetime = now.toISOString().slice(0, 16).replace('T', ' ');
        const encodedDatetime = encodeURIComponent(datetime);

        // ElectricityMaps API endpoint (using /past with current datetime)
        const url = `https://api.electricitymaps.com/v3/carbon-intensity/past?datetime=${encodedDatetime}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'auth-token': apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`ElectricityMaps API error: ${response.status}`);
        }

        const data: ElectricityMapsResponse = await response.json();
        const intensity = data.carbonIntensity;

        return {
            grid_carbon_intensity: Math.round(intensity),
            is_high_intensity: intensity > 500,
        };
    } catch (error) {
        console.error('❌ Failed to fetch grid data:', error);
        return null;
    }
}

/**
 * Generate intelligent mock weather data based on location
 * Uses latitude to estimate climate zone for realistic data
 */
function getMockWeatherData(lat: number, lon: number): WeatherData {
    // Use latitude to create location-based mock data
    const absLat = Math.abs(lat);

    // Tropical zone (0-23.5°)
    if (absLat < 23.5) {
        return {
            temp_c: 28 + Math.random() * 4, // 28-32°C
            condition: Math.random() > 0.5 ? 'Clear' : 'Partly Cloudy',
            humidity: 70 + Math.floor(Math.random() * 20), // 70-90%
        };
    }

    // Temperate zone (23.5-66.5°)
    if (absLat < 66.5) {
        return {
            temp_c: 15 + Math.random() * 15, // 15-30°C
            condition: ['Clear', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)],
            humidity: 50 + Math.floor(Math.random() * 30), // 50-80%
        };
    }

    // Polar zone (66.5-90°)
    return {
        temp_c: -5 + Math.random() * 15, // -5-10°C
        condition: Math.random() > 0.5 ? 'Cloudy' : 'Snow',
        humidity: 60 + Math.floor(Math.random() * 20), // 60-80%
    };
}

/**
 * Generate intelligent mock grid data based on location
 * Simulates carbon intensity patterns by region
 */
function getMockGridData(lat: number, lon: number): GridData {
    // Use longitude to create regional variation
    // Western regions tend to have lower carbon intensity (more renewables)
    const regionFactor = (lon + 180) / 360; // Normalize to 0-1

    // Base intensity varies by region (300-700 gCO2/kWh)
    const baseIntensity = 300 + regionFactor * 400;

    // Add time-of-day variation (simplified)
    const hour = new Date().getHours();
    const peakHourMultiplier = (hour >= 18 && hour <= 21) ? 1.2 : 1.0;

    const intensity = Math.round(baseIntensity * peakHourMultiplier);

    return {
        grid_carbon_intensity: intensity,
        is_high_intensity: intensity > 500,
    };
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Get context data (weather + grid) for a specific location
 * 
 * This function fetches real-time environmental data to provide context
 * for validating IoT sensor readings. It includes automatic fallback to
 * intelligent mock data if APIs are unavailable.
 * 
 * @param lat - Latitude (-90 to 90)
 * @param lon - Longitude (-180 to 180)
 * @returns Promise resolving to context data with weather and grid information
 * 
 * @example
 * ```typescript
 * const context = await getContextData(28.6139, 77.2090); // New Delhi
 * console.log(context.weather.temp_c); // Current temperature
 * console.log(context.grid.grid_carbon_intensity); // Carbon intensity
 * ```
 */
export async function getContextData(
    lat: number,
    lon: number
): Promise<ContextData> {
    // Validate coordinates
    if (lat < -90 || lat > 90) {
        throw new Error(`Invalid latitude: ${lat}. Must be between -90 and 90.`);
    }
    if (lon < -180 || lon > 180) {
        throw new Error(`Invalid longitude: ${lon}. Must be between -180 and 180.`);
    }

    console.log(`🌍 Fetching context data for coordinates: ${lat}, ${lon}`);

    // Fetch data from APIs with fallback to mock data
    const [weatherData, gridData] = await Promise.all([
        fetchWeatherData(lat, lon),
        fetchGridData(lat, lon),
    ]);

    const weather = weatherData || getMockWeatherData(lat, lon);
    const grid = gridData || getMockGridData(lat, lon);

    const result: ContextData = {
        weather,
        grid,
        timestamp: new Date().toISOString(),
        source: {
            weather: weatherData ? 'api' : 'mock',
            grid: gridData ? 'api' : 'mock',
        },
    };

    // Log data source for debugging
    console.log(`✅ Context data retrieved:`, {
        weather: result.source.weather,
        grid: result.source.grid,
        temp: `${result.weather.temp_c}°C`,
        carbon: `${result.grid.grid_carbon_intensity} gCO2/kWh`,
    });

    return result;
}

// ============================================================================
// Additional Utility Exports
// ============================================================================

/**
 * Check if context data is using real API data or mock data
 */
export function isUsingRealData(contextData: ContextData): boolean {
    return contextData.source.weather === 'api' && contextData.source.grid === 'api';
}

/**
 * Get a human-readable description of the data sources
 */
export function getDataSourceDescription(contextData: ContextData): string {
    const sources = [];

    if (contextData.source.weather === 'api') {
        sources.push('OpenWeatherMap API');
    } else {
        sources.push('Mock Weather');
    }

    if (contextData.source.grid === 'api') {
        sources.push('ElectricityMaps API');
    } else {
        sources.push('Mock Grid Data');
    }

    return sources.join(' + ');
}

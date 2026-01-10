// src/app/api/weather/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * Weather API Proxy
 * This route proxies requests to OpenWeatherMap to bypass CORS restrictions.
 * 
 * OpenWeatherMap doesn't allow direct browser calls due to CORS policy.
 * This server-side route acts as a proxy to fetch weather data.
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
        return NextResponse.json(
            { error: 'Missing latitude or longitude' },
            { status: 400 }
        );
    }

    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'OpenWeather API key not configured' },
            { status: 500 }
        );
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
            const errorText = await response.text();
            console.error(`OpenWeather API error: ${response.status} - ${errorText}`);
            return NextResponse.json(
                { error: `OpenWeather API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Transform to our format
        const weatherData = {
            temp_c: Number(((data.main.temp - 273.15).toFixed(2))), // Convert Kelvin to Celsius
            condition: data.weather[0]?.main || 'Unknown',
            humidity: data.main.humidity,
        };

        return NextResponse.json(weatherData);
    } catch (error) {
        console.error('Failed to fetch weather data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch weather data' },
            { status: 500 }
        );
    }
}

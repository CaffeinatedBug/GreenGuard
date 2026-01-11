'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Supplier } from '@/types/database';

interface SupplyChainMapProps {
    suppliers: Supplier[];
}

// Helper function to map location strings to coordinates (lat, lng)
function getCoordinates(locationString: string): { lat: number; lng: number } {
    const location = locationString.toLowerCase();

    // Hardcoded positions for demo locations
    if (location.includes('gujarat') || location.includes('ahmedabad')) {
        return { lat: 23.0225, lng: 72.5714 };
    }
    if (location.includes('mumbai') || location.includes('maharashtra')) {
        return { lat: 19.0760, lng: 72.8777 };
    }
    if (location.includes('bangalore') || location.includes('bengaluru') || location.includes('karnataka')) {
        return { lat: 12.9716, lng: 77.5946 };
    }
    if (location.includes('delhi') || location.includes('new delhi')) {
        return { lat: 28.6139, lng: 77.2090 };
    }
    if (location.includes('vietnam') || location.includes('hanoi')) {
        return { lat: 21.0285, lng: 105.8542 };
    }
    if (location.includes('singapore')) {
        return { lat: 1.3521, lng: 103.8198 };
    }
    if (location.includes('thailand') || location.includes('bangkok')) {
        return { lat: 13.7563, lng: 100.5018 };
    }

    // Default to India center with slight randomization
    return {
        lat: 20.5937 + (Math.random() - 0.5) * 10,
        lng: 78.9629 + (Math.random() - 0.5) * 10
    };
}

export default function SupplyChainMap({ suppliers }: SupplyChainMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
    const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);

    useEffect(() => {
        const initMap = async () => {
            try {
                // Modern approach using importLibrary
                const { Map, InfoWindow } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
                const { Marker } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

                if (mapRef.current) {
                    const mapInstance = new Map(mapRef.current, {
                        center: { lat: 20.5937, lng: 78.9629 }, // India center
                        zoom: 5,
                        mapId: 'greenguard-supply-chain-map',
                        styles: [
                            {
                                "elementType": "geometry",
                                "stylers": [{ "color": "#0f172a" }]
                            },
                            {
                                "elementType": "labels.text.stroke",
                                "stylers": [{ "color": "#0f172a" }]
                            },
                            {
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#64748b" }]
                            },
                            {
                                "featureType": "administrative.locality",
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#94a3b8" }]
                            },
                            {
                                "featureType": "poi",
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#475569" }]
                            },
                            {
                                "featureType": "poi.park",
                                "elementType": "geometry",
                                "stylers": [{ "color": "#1e293b" }]
                            },
                            {
                                "featureType": "poi.park",
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#475569" }]
                            },
                            {
                                "featureType": "road",
                                "elementType": "geometry",
                                "stylers": [{ "color": "#1e293b" }]
                            },
                            {
                                "featureType": "road",
                                "elementType": "geometry.stroke",
                                "stylers": [{ "color": "#334155" }]
                            },
                            {
                                "featureType": "road.highway",
                                "elementType": "geometry",
                                "stylers": [{ "color": "#1e3a5f" }]
                            },
                            {
                                "featureType": "road.highway",
                                "elementType": "geometry.stroke",
                                "stylers": [{ "color": "#1e3a5f" }]
                            },
                            {
                                "featureType": "transit",
                                "elementType": "geometry",
                                "stylers": [{ "color": "#1e293b" }]
                            },
                            {
                                "featureType": "water",
                                "elementType": "geometry",
                                "stylers": [{ "color": "#1e40af" }]
                            },
                            {
                                "featureType": "water",
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#475569" }]
                            }
                        ],
                    });

                    setMap(mapInstance);
                    setInfoWindow(new InfoWindow());
                }
            } catch (error) {
                console.error('Failed to initialize Google Maps:', error);
                // Fail silently - the loading indicator will remain
            }
        };

        // Check if API key is configured
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.warn('Google Maps API key not configured');
            return;
        }

        // Load the Google Maps script
        if (!window.google?.maps) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=beta`;
            script.async = true;
            script.defer = true;
            script.onload = () => initMap();
            script.onerror = () => console.error('Failed to load Google Maps script');
            document.head.appendChild(script);
        } else {
            initMap();
        }
    }, []);

    useEffect(() => {
        if (!map) return;

        // Clear existing markers
        markers.forEach(marker => marker.setMap(null));

        // Create new markers for suppliers
        const newMarkers = suppliers.map((supplier) => {
            const position = getCoordinates(supplier.location);
            const hasAnomaly = Math.random() > 0.7; // Mock anomaly detection

            // Create custom pulsing marker
            const marker = new google.maps.Marker({
                position,
                map,
                title: supplier.name,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: hasAnomaly ? '#ef4444' : '#10b981',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                },
                animation: google.maps.Animation.DROP,
            });

            // Add click listener for info window
            marker.addListener('click', () => {
                const contentString = `
          <div style="padding: 12px; font-family: system-ui; max-width: 250px;">
            <div style="display: flex; align-items-start; gap: 12px; margin-bottom: 8px;">
              <div style="padding: 8px; background: ${hasAnomaly ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; border-radius: 8px;">
                ${hasAnomaly ?
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' :
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
                    }
              </div>
              <div style="flex: 1;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1e293b;">${supplier.name}</h4>
                <p style="margin: 0; font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  ${supplier.location}
                </p>
              </div>
            </div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
              <div style="display: flex; justify-between; margin-bottom: 6px; font-size: 11px;">
                <span style="color: #64748b;">Status:</span>
                <span style="color: ${hasAnomaly ? '#f87171' : '#34d399'}; font-weight: 600;">
                  ${hasAnomaly ? 'Anomaly Detected ⚠️' : 'Audit Verified ✅'}
                </span>
              </div>
              <div style="display: flex; justify-between; margin-bottom: 6px; font-size: 11px;">
                <span style="color: #64748b;">Current Load:</span>
                <span style="color: #60a5fa; font-weight: 600;">
                  ${(Math.random() * 100 + 50).toFixed(1)} kW
                </span>
              </div>
              <div style="display: flex; justify-between; font-size: 11px;">
                <span style="color: #64748b;">Max Capacity:</span>
                <span style="color: #94a3b8;">${supplier.bill_max_load_kwh} kWh</span>
              </div>
            </div>
          </div>
        `;

                if (infoWindow) {
                    infoWindow.setContent(contentString);
                    infoWindow.open(map, marker);
                }
            });

            return marker;
        });

        setMarkers(newMarkers);
    }, [map, suppliers, infoWindow]);

    return (
        <div className="relative bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 overflow-hidden">
            {/* Header */}
            <div className="relative z-10 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <MapPin className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Global Operations Center</h3>
                        <p className="text-xs text-slate-400">Real-time supplier monitoring across {suppliers.length} facilities</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-slate-400">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-slate-400">Audit Required</span>
                    </div>
                </div>
            </div>

            {/* Google Map Container */}
            <div
                ref={mapRef}
                className="w-full h-[400px] rounded-lg border-2 border-blue-500/40 overflow-hidden shadow-inner shadow-blue-500/20"
                style={{ minHeight: '400px' }}
            />

            {/* Loading indicator */}
            {!map && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-xl">
                    <div className="text-center">
                        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Loading map...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Map theme: CartoDB Dark Matter (industry standard for dark mode fleet tracking)
const MAP_THEME = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

// Custom truck SVGs based on status
const createTruckIcon = (color: string) => {
  return new L.DivIcon({
    className: 'custom-truck-icon',
    html: `
      <div style="
        background: ${color}20; 
        border: 2px solid ${color}; 
        box-shadow: 0 0 12px ${color}80;
        width: 28px; height: 28px; 
        border-radius: 50%; 
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(4px);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 17h4V5H2v12h3"></path>
          <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"></path>
          <path d="M14 17h1"></path>
          <circle cx="7.5" cy="17.5" r="2.5"></circle>
          <circle cx="17.5" cy="17.5" r="2.5"></circle>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

const ICONS: Record<string, L.DivIcon> = {
  'Available': createTruckIcon('#10b981'), // Emerald
  'On Trip':   createTruckIcon('#3b82f6'), // Blue
  'In Shop':   createTruckIcon('#ef4444'), // Red
  'Suspended': createTruckIcon('#f59e0b')  // Amber
};

interface VehicleMapData {
  id: number;
  licensePlate: string;
  status: string;
  make: string;
  model: string;
  lat?: number;
  lon?: number;
  destination?: string;
  distanceKm?: number;
  cargoWeightKg?: number;
  driverName?: string;
  startDate?: string;
}

export function LiveMap() {
  const [vehicles, setVehicles] = useState<VehicleMapData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMapData = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/vehicles/map', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();

    const channel = supabase.channel('map-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Vehicle' }, () => {
        fetchMapData();
      })
      .subscribe();

    // Auto refresh every 15s to update ETA / distance visually
    const interval = setInterval(fetchMapData, 15000);

    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(interval);
    };
  }, []);

  if (loading) return <div className="h-96 bg-muted/20 animate-pulse rounded-2xl border border-border flex items-center justify-center text-muted-foreground">Initializing PostGIS Tracking...</div>;

  return (
    <div className="h-[550px] rounded-2xl overflow-hidden border border-border shadow-lg relative z-0 fade-in-up">
      {/* Overlay legend */}
      <div className="absolute top-4 right-4 z-[400] bg-card/80 backdrop-blur-md border border-border/50 p-3 rounded-xl shadow-xl flex flex-col gap-2 pointer-events-none">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Live Fleet Status</div>
        {[
          { label: 'Available', color: '#10b981' },
          { label: 'On Trip', color: '#3b82f6' },
          { label: 'In Shop', color: '#ef4444' }
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs font-medium">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}80` }} />
            {s.label} <span className="text-muted-foreground ml-auto pl-4 font-mono">{vehicles.filter(v => v.status === s.label).length}</span>
          </div>
        ))}
      </div>

      <MapContainer center={[21.1458, 79.0882]} zoom={5} style={{ height: '100%', width: '100%', background: '#09090b' }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url={MAP_THEME}
        />
        {vehicles.map(v => (
          v.lat && v.lon ? (
            <Marker key={v.id} position={[v.lat, v.lon]} icon={ICONS[v.status] || ICONS['Available']}>
              <Popup className="custom-popup">
                <div className="p-1 min-w-[200px] font-sans">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/30">
                    <div className="font-mono font-bold text-sm text-foreground">{v.licensePlate}</div>
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.status === 'Available' ? 'bg-emerald-500/20 text-emerald-500' : v.status === 'On Trip' ? 'bg-blue-500/20 text-blue-500' : 'bg-red-500/20 text-red-500'}`}>
                      {v.status}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-3">{v.make} {v.model}</div>

                  {v.status === 'On Trip' && v.destination && (
                    <div className="space-y-2 bg-muted/30 p-2.5 rounded-lg border border-border/30">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Driver</span>
                        <span className="font-semibold">{v.driverName}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Destination</span>
                        <span className="font-semibold text-right max-w-[120px] truncate" title={v.destination}>{v.destination}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Cargo</span>
                        <span className="font-mono font-semibold">{v.cargoWeightKg} kg</span>
                      </div>
                      {v.distanceKm && (
                        <div className="pt-2 mt-1 border-t border-border/20">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Route Progress</span>
                            <span className="font-mono">{v.distanceKm} km</span>
                          </div>
                          <div className="h-1 rounded-full bg-border overflow-hidden">
                            <div className="h-full bg-blue-500 w-1/2 relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}

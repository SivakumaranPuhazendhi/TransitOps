import { useState, useEffect } from 'react';
import { Truck, Zap, AlertTriangle, CheckCircle, RefreshCw, MapPin, User, Package } from 'lucide-react';

interface ActiveTrip {
  id: number;
  destination?: string;
  distanceKm?: number;
  cargoWeightKg: number;
  startDate?: string;
  driver: {
    user: { name: string; email: string };
    licenseNumber: string;
  };
}

interface Vehicle {
  id: number;
  make: string;
  model: string;
  licensePlate: string;
  status: string;
  maxCapacityKg: number;
  trips?: ActiveTrip[];
}

const STATUS_CONFIG = {
  Available: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', glow: '0 0 16px rgba(16,185,129,0.2)', icon: CheckCircle },
  'On Trip':  { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', glow: '0 0 16px rgba(59,130,246,0.25)', icon: Zap },
  'In Shop':  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', glow: '0 0 16px rgba(239,68,68,0.15)', icon: AlertTriangle },
};

function hoursElapsed(startDate?: string) {
  if (!startDate) return null;
  const h = Math.floor((Date.now() - new Date(startDate).getTime()) / 3600000);
  return h;
}

function estimatedDistanceTraveled(startDate?: string, distanceKm?: number) {
  if (!startDate || !distanceKm) return null;
  const h = hoursElapsed(startDate) || 0;
  const avgSpeedKmH = 65;
  return Math.min(distanceKm, Math.round(h * avgSpeedKmH));
}

function VehicleCard({ v, index }: { v: Vehicle; index: number }) {
  const cfg = STATUS_CONFIG[v.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.Available;
  const StatusIcon = cfg.icon;
  const capacityPct = Math.min(100, (v.maxCapacityKg / 25000) * 100);
  const activeTrip = v.trips?.[0];
  const traveledKm = activeTrip ? estimatedDistanceTraveled(activeTrip.startDate, activeTrip.distanceKm) : null;
  const remainingKm = (activeTrip?.distanceKm && traveledKm !== null) ? Math.max(0, activeTrip.distanceKm - traveledKm) : null;
  const tripProgressPct = (activeTrip?.distanceKm && traveledKm !== null) ? Math.round((traveledKm / activeTrip.distanceKm) * 100) : 0;

  return (
    <div
      className="rounded-2xl border p-5 card-hover cursor-default fade-in-up relative overflow-hidden group"
      style={{ background: 'hsl(var(--card))', borderColor: cfg.border, boxShadow: cfg.glow, animationDelay: `${index * 45}ms` }}
    >
      {/* Background glow blob */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500"
        style={{ background: cfg.color }} />

      {/* Header */}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{v.licensePlate}</div>
          <div className="font-bold text-sm mt-0.5">{v.make} {v.model}</div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${v.status === 'On Trip' ? 'status-blink' : ''}`}
            style={{ background: cfg.color }} />
          {v.status}
        </div>
      </div>

      {/* Active trip info */}
      {v.status === 'On Trip' && activeTrip && (
        <div className="mb-3 p-3 rounded-xl relative z-10"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          {/* Driver */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
              {activeTrip.driver.user.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-300">{activeTrip.driver.user.name}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{activeTrip.driver.licenseNumber}</div>
            </div>
          </div>
          {/* Destination */}
          {activeTrip.destination && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <span className="truncate">{activeTrip.destination}</span>
            </div>
          )}
          {/* Cargo */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Package className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span>{activeTrip.cargoWeightKg.toLocaleString()} kg cargo</span>
          </div>
          {/* Route progress */}
          {activeTrip.distanceKm && traveledKm !== null && (
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>~{traveledKm} km traveled</span>
                <span>{remainingKm} km remaining</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${tripProgressPct}%`, background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', boxShadow: '0 0 6px #3b82f680' }} />
              </div>
              <div className="text-[10px] text-blue-400 mt-1">{tripProgressPct}% of {activeTrip.distanceKm} km route</div>
            </div>
          )}
        </div>
      )}

      {v.status === 'In Shop' && (
        <div className="mb-3 p-2.5 rounded-xl relative z-10 text-xs"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          🔧 Under maintenance — blocked from dispatch
        </div>
      )}

      {/* Capacity bar */}
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-muted-foreground">Max Capacity</span>
          <span className="text-xs font-mono font-semibold">{v.maxCapacityKg.toLocaleString()} kg</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${capacityPct}%`, background: `linear-gradient(90deg, ${cfg.color}60, ${cfg.color})` }} />
        </div>
      </div>

      <div className="flex justify-end mt-3 relative z-10">
        <StatusIcon className="w-4 h-4 opacity-20 group-hover:opacity-50 transition-opacity" style={{ color: cfg.color }} />
      </div>
    </div>
  );
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');

  const fetchVehicles = () => {
    setIsLoading(true);
    fetch('http://localhost:3001/api/vehicles/with-trips', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(data => { setVehicles(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(err => { console.error(err); setIsLoading(false); });
  };

  useEffect(() => { fetchVehicles(); }, []);

  const statuses = ['All', 'Available', 'On Trip', 'In Shop'];
  const filtered = filter === 'All' ? vehicles : vehicles.filter(v => v.status === filter);
  const counts: Record<string, number> = {
    All: vehicles.length,
    Available: vehicles.filter(v => v.status === 'Available').length,
    'On Trip': vehicles.filter(v => v.status === 'On Trip').length,
    'In Shop': vehicles.filter(v => v.status === 'In Shop').length,
  };

  const filterColors: Record<string, string> = { Available: '#10b981', 'On Trip': '#3b82f6', 'In Shop': '#ef4444' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fleet Vehicles</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{vehicles.length} vehicles · {counts['On Trip']} active trips · {counts['In Shop']} in maintenance</p>
        </div>
        <button onClick={fetchVehicles} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Available', count: counts['Available'], color: '#10b981', icon: '✅' },
          { label: 'On Trip', count: counts['On Trip'], color: '#3b82f6', icon: '🚛' },
          { label: 'In Maintenance', count: counts['In Shop'], color: '#ef4444', icon: '🔧' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-border" style={{ background: `${s.color}10` }}>
            <div className="text-lg mb-1">{s.icon}</div>
            <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => {
          const isActive = filter === s;
          const c = filterColors[s];
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${isActive ? '' : 'text-muted-foreground border-transparent hover:border-border hover:text-foreground'}`}
              style={isActive ? { background: c ? `${c}18` : 'hsl(var(--muted))', borderColor: c ? `${c}40` : 'hsl(var(--border))', color: c || 'hsl(var(--foreground))' } : {}}>
              {s} <span className="ml-1.5 text-xs opacity-60 font-mono">{counts[s]}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 rounded-2xl bg-card border border-border shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          <Truck className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No {filter !== 'All' ? filter.toLowerCase() : ''} vehicles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map((v, i) => <VehicleCard key={v.id} v={v} index={i} />)}
        </div>
      )}
    </div>
  );
}

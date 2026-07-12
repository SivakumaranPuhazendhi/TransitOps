import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Wrench, ChevronDown, Check, AlertCircle } from 'lucide-react';

interface Vehicle { id: number; licensePlate: string; status: string; make: string; model: string; }
interface MaintenanceLog {
  id: number; vehicleId: number; description: string; cost: number; date: string;
  vehicle?: { licensePlate: string };
}

const MAINTENANCE_CATEGORIES = [
  { id: 'brake', label: 'Brake Service',       icon: '🛑', desc: 'Brake pads, rotors, fluid, calipers' },
  { id: 'engine', label: 'Engine Repair',      icon: '⚙️', desc: 'Engine rebuild, head gasket, pistons' },
  { id: 'oil', label: 'Oil Change',             icon: '🛢️', desc: 'Engine oil, filter, coolant top-up' },
  { id: 'tire', label: 'Tire Replacement',      icon: '⬤',  desc: 'New tires, rotation, wheel balance' },
  { id: 'trans', label: 'Transmission',         icon: '🔄', desc: 'Gearbox, clutch, fluid service' },
  { id: 'elec', label: 'Electrical',            icon: '⚡', desc: 'Battery, alternator, wiring' },
  { id: 'ac', label: 'AC/Heating',              icon: '❄️', desc: 'HVAC compressor, refrigerant, filter' },
  { id: 'body', label: 'Body Work',             icon: '🏗️', desc: 'Dents, paint, bumper, windshield' },
  { id: 'fuel', label: 'Fuel System',           icon: '⛽', desc: 'Injectors, fuel pump, filter' },
  { id: 'insp', label: 'Annual Inspection',     icon: '📋', desc: 'Permit renewal, fitness certificate' },
];

// Custom Vehicle Dropdown
function VehicleDropdown({ vehicles, value, onChange }: { vehicles: Vehicle[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = vehicles.find(v => String(v.id) === value);

  const STATUS_C = (s: string) => ({ Available: { c: '#10b981', bg: 'rgba(16,185,129,0.12)' }, 'On Trip': { c: '#3b82f6', bg: 'rgba(59,130,246,0.12)' }, 'In Shop': { c: '#ef4444', bg: 'rgba(239,68,68,0.12)' } }[s] || { c: '#6b7280', bg: 'transparent' });

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all"
        style={{ background: 'hsl(var(--card))', borderColor: open ? 'hsl(var(--primary)/0.5)' : 'hsl(var(--border))', boxShadow: open ? '0 0 0 3px hsl(var(--primary)/0.1)' : undefined }}>
        {selected ? (
          <div className="flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-mono font-semibold">{selected.licensePlate}</span>
            <span className="text-muted-foreground text-xs">{selected.make} {selected.model}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold ml-1"
              style={{ background: STATUS_C(selected.status).bg, color: STATUS_C(selected.status).c }}>{selected.status}</span>
          </div>
        ) : <span className="text-muted-foreground">Choose a vehicle...</span>}
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border shadow-2xl z-50 overflow-hidden fade-in-up"
          style={{ background: 'hsl(var(--card))', animationDelay: '0ms' }}>
          <div className="max-h-56 overflow-y-auto divide-y divide-border/50">
            {vehicles.map(v => {
              const sc = STATUS_C(v.status);
              return (
                <button key={v.id} type="button" onClick={() => { onChange(String(v.id)); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-all"
                  style={String(v.id) === value ? { background: 'hsl(var(--primary)/0.08)' } : {}}>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <Wrench className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-mono font-semibold text-sm">{v.licensePlate}</span>
                    <span className="text-xs text-muted-foreground">{v.make} {v.model}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold ml-auto"
                      style={{ background: sc.bg, color: sc.c }}>{v.status}</span>
                  </div>
                  {String(v.id) === value && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Category Grid Selector
function CategorySelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {MAINTENANCE_CATEGORIES.map(cat => {
        const isSelected = value === cat.id;
        return (
          <button key={cat.id} type="button" onClick={() => onChange(cat.id)}
            className="p-3 rounded-xl text-left transition-all border text-sm"
            style={isSelected ? {
              background: 'rgba(245,158,11,0.12)',
              borderColor: 'rgba(245,158,11,0.4)',
              boxShadow: '0 0 12px rgba(245,158,11,0.15)',
            } : { borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-base">{cat.icon}</span>
              <span className={`font-semibold text-xs ${isSelected ? 'text-amber-400' : 'text-foreground/80'}`}>{cat.label}</span>
              {isSelected && <Check className="w-3 h-3 text-amber-400 ml-auto flex-shrink-0" />}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">{cat.desc}</div>
          </button>
        );
      })}
    </div>
  );
}

export default function Maintenance() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const [vRes, lRes] = await Promise.all([
      fetch('http://localhost:3001/api/vehicles', { headers }).then(r => r.json()).catch(() => []),
      fetch('http://localhost:3001/api/maintenance/logs', { headers }).then(r => r.json()).catch(() => []),
    ]);
    setVehicles(Array.isArray(vRes) ? vRes : []);
    setLogs(Array.isArray(lRes) ? lRes : []);
  };

  useEffect(() => { fetchData(); }, []);

  const selectedVehicleObj = vehicles.find(v => String(v.id) === selectedVehicle);
  const selectedCategoryObj = MAINTENANCE_CATEGORIES.find(c => c.id === category);

  const handleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) { toast.error('Please select a maintenance category'); return; }
    setLoading(true);
    const desc = selectedCategoryObj ? `${selectedCategoryObj.label}${notes ? ': ' + notes : ''}` : notes;
    try {
      const res = await fetch('http://localhost:3001/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ vehicleId: Number(selectedVehicle), description: desc, cost: Number(cost) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('🔧 Maintenance logged! Vehicle moved to In Shop.');
      setSelectedVehicle(''); setCategory(''); setNotes(''); setCost('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Maintenance Logs</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Log a repair — auto-locks the vehicle out of dispatch</p>
      </div>

      {/* Form card */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
          </div>
          Log New Maintenance Event
        </div>

        <form onSubmit={handleMaintenance} className="space-y-5">
          {/* Vehicle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Vehicle</label>
            <VehicleDropdown vehicles={vehicles} value={selectedVehicle} onChange={setSelectedVehicle} />
          </div>

          {selectedVehicleObj && (
            <div className="px-4 py-3 rounded-xl text-sm border fade-in-up flex items-start gap-2"
              style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.25)', animationDelay: '0ms' }}>
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-mono font-semibold">{selectedVehicleObj.licensePlate}</span>
                <span className="text-muted-foreground"> will be locked to </span>
                <span className="text-red-400 font-semibold">In Shop</span>
                <span className="text-muted-foreground"> status and blocked from dispatch until resolved.</span>
              </div>
            </div>
          )}

          {/* Category grid */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issue Category <span className="text-red-400">*</span></label>
            <CategorySelector value={category} onChange={setCategory} />
          </div>

          {/* Additional notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Additional Notes (optional)</label>
            <textarea rows={2}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder={selectedCategoryObj ? `e.g. ${selectedCategoryObj.desc}...` : 'Describe the specific issue...'} />
          </div>

          {/* Cost */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Repair Cost</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">₹</span>
              <input required type="number" min="0" step="1"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                value={cost} onChange={e => setCost(e.target.value)} placeholder="0" />
            </div>
          </div>

          <button type="submit" disabled={loading || !selectedVehicle || !category}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', boxShadow: loading ? 'none' : '0 4px 20px rgba(245,158,11,0.3)' }}>
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                Logging...
              </div>
            ) : `🔧 Log ${selectedCategoryObj?.label || 'Maintenance'} & Lock Vehicle`}
          </button>
        </form>
      </div>

      {/* History */}
      {logs.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Maintenance History ({logs.length} records)</h3>
          <div className="space-y-2 stagger">
            {logs.slice(0, 15).map((log, i) => {
              const catMatch = MAINTENANCE_CATEGORIES.find(c => log.description.startsWith(c.label));
              return (
                <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card fade-in-up hover:border-amber-500/20 transition-colors"
                  style={{ animationDelay: `${i * 35}ms` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    {catMatch?.icon || '🔧'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold">{log.vehicle?.licensePlate || `#${log.vehicleId}`}</span>
                      {catMatch && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                          {catMatch.label}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{log.description}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-bold text-sm">₹{Number(log.cost).toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

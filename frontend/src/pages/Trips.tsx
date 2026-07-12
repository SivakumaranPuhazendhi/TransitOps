import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Navigation, Compass, AlertCircle } from 'lucide-react';

interface Vehicle { id: number; licensePlate: string; status: string; maxCapacityKg: number; make: string; model: string; }
interface Driver { id: number; user: { name: string }; licenseNumber: string; status: string; }

export default function Trips() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [destination, setDestination] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  
  // PostGIS location state
  const [originLat, setOriginLat] = useState('');
  const [originLon, setOriginLon] = useState('');
  const [nearestVehicle, setNearestVehicle] = useState<any>(null);
  
  // Copilot State
  const [copilotText, setCopilotText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copilotResponse, setCopilotResponse] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/vehicles')
      .then(r => r.json()).then(setVehicles).catch(console.error);
    fetch('http://localhost:3001/api/drivers')
      .then(r => r.json()).then(setDrivers).catch(console.error);
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        vehicleId: Number(selectedVehicle),
        driverId: Number(selectedDriver),
        cargoWeightKg: Number(cargoWeight)
      };
      
      if (destination) payload.destination = destination;
      if (distanceKm) payload.distanceKm = Number(distanceKm);
      if (originLat) payload.originLat = Number(originLat);
      if (originLon) payload.originLon = Number(originLon);

      const res = await fetch('http://localhost:3001/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.errors?.join(', ') || 'Dispatch failed');
      }

      toast.success(`Trip dispatched successfully! Risk Score: ${data.trip?.riskScore}`);
      setSelectedVehicle(''); setSelectedDriver(''); setCargoWeight('');
      setDestination(''); setDistanceKm('');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleFindNearest = async () => {
    if (!originLat || !originLon) {
      toast.error("Enter coordinates first");
      return;
    }
    toast.promise(
      fetch(`http://localhost:3001/api/vehicles/nearest?lat=${originLat}&lon=${originLon}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setNearestVehicle(data);
        if (data && data.status === 'Available') {
          setSelectedVehicle(String(data.id));
        }
      }),
      { loading: 'Querying PostGIS...', success: 'Nearest vehicle found!', error: 'Failed to find nearest' }
    );
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOriginLat(pos.coords.latitude.toFixed(4));
          setOriginLon(pos.coords.longitude.toFixed(4));
          toast.success("Location acquired");
        },
        () => toast.error("Location access denied")
      );
    }
  };

  const handleCopilot = async (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const textToProcess = directText || copilotText;
    if (!textToProcess) return;
    setIsThinking(true);
    setCopilotResponse(null);
    try {
      const res = await fetch('http://localhost:3001/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ text: textToProcess, conversationHistory: [] }),
      });
      const data = await res.json();
      setCopilotResponse(data);
    } catch (err) {
      setCopilotResponse({ type: 'error', message: 'Failed to connect to AI Copilot.' });
    } finally {
      setIsThinking(false);
    }
  };

  const handleCopilotConfirm = async (response: any) => {
    setIsThinking(true);
    try {
      const payload: any = {
        vehicleId: response.vehicle.id,
        driverId: response.driver.id,
        cargoWeightKg: response.cargoWeightKg
      };
      if (destination) payload.destination = destination;
      if (distanceKm) payload.distanceKm = Number(distanceKm);

      const res = await fetch('http://localhost:3001/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dispatch failed');
      toast.success(`Dispatched via Copilot! Risk Score: ${data.riskScore}`);
      setCopilotResponse(null);
      setCopilotText('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dispatch Trips</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Assign a driver and vehicle for a new trip.</p>
      </div>

      {/* AI Copilot Box */}
      <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-sm">✨</div>
          <h3 className="font-semibold text-primary">AI Dispatch Copilot</h3>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Powered by Gemini</span>
        </div>
        <p className="text-xs text-muted-foreground">Type a natural-language command or click an example below:</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setCopilotText('Dispatch TRK-007 with Driver 6, carrying 5000kg to Mumbai JNPT Gateway, 120km')} className="text-xs bg-primary/15 text-primary hover:bg-primary/25 px-3 py-1.5 rounded-full transition-colors border border-primary/25">
            "Dispatch TRK-007 with Driver 6..."
          </button>
          <button type="button" onClick={() => setCopilotText('Assign any available van to John Doe for a 1500kg trip')} className="text-xs bg-primary/15 text-primary hover:bg-primary/25 px-3 py-1.5 rounded-full transition-colors border border-primary/25">
            "Assign any available van to John Doe for a 1500kg trip"
          </button>
          <button type="button" onClick={() => setCopilotText('What is the current fleet status?')} className="text-xs bg-primary/15 text-primary hover:bg-primary/25 px-3 py-1.5 rounded-full transition-colors border border-primary/25">
            "What is the current fleet status?"
          </button>
        </div>
        <form onSubmit={handleCopilot} className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-3 rounded-xl border border-primary/40 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary/60 outline-none transition-all disabled:opacity-50 text-sm"
            value={copilotText}
            onChange={e => setCopilotText(e.target.value)}
            placeholder="e.g. Dispatch TRK-004 with Alice for 2000kg cargo..."
            disabled={isThinking}
          />
          <button
            type="submit"
            disabled={isThinking || !copilotText}
            className="px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[100px]"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(210 100% 45%))', color: 'hsl(var(--primary-foreground))' }}
          >
            {isThinking ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Thinking</>
            ) : 'Execute'}
          </button>
        </form>

        {/* Copilot Response Panel */}
        {copilotResponse && (
          <div className="mt-2 p-4 border border-border bg-card rounded-xl shadow-sm fade-in-up" style={{animationDelay: '0ms'}}>
            {copilotResponse.type === 'proposal' && (
              <div className="space-y-4">
                <p className="font-medium flex items-center gap-2 text-sm">🤖 Got it — here's what I'll dispatch:</p>
                <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-4 rounded-xl border border-border">
                  <div><span className="text-muted-foreground text-xs">Vehicle</span><div className="font-mono font-semibold mt-0.5">{copilotResponse.vehicle.licensePlate}</div></div>
                  <div><span className="text-muted-foreground text-xs">Driver</span><div className="font-semibold mt-0.5">{copilotResponse.driver.user.name}</div></div>
                  <div><span className="text-muted-foreground text-xs">Cargo</span><div className="font-mono font-semibold mt-0.5">{copilotResponse.cargoWeightKg} kg</div></div>
                  <div>
                    <span className="text-muted-foreground text-xs">Risk Score</span>
                    <div className="mt-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${copilotResponse.riskScore < 40 ? 'bg-green-500/20 text-green-400' : copilotResponse.riskScore < 70 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {copilotResponse.riskScore} {copilotResponse.riskScore < 40 ? '🟢 Low' : copilotResponse.riskScore < 70 ? '🟡 Medium' : '🔴 High'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleCopilotConfirm(copilotResponse)} className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">✓ Confirm Dispatch</button>
                  <button onClick={() => setCopilotResponse(null)} className="px-4 py-2 rounded-xl text-sm border border-border hover:bg-muted transition-colors">Cancel</button>
                </div>
              </div>
            )}
            {copilotResponse.type === 'clarify' && (
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">🤖</span>
                <p className="text-sm text-foreground/80 leading-relaxed">{copilotResponse.message}</p>
              </div>
            )}
            {copilotResponse.type === 'rejected' && (
              <div className="space-y-3">
                <p className="font-semibold flex items-center gap-2 text-sm text-destructive">🤖 Can't dispatch — rule violations:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                  {copilotResponse.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                </ul>
                {copilotResponse.suggestion && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleCopilot(undefined, `Dispatch with Driver ${copilotResponse.suggestion.id}`)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                      Try with {copilotResponse.suggestion.name} instead →
                    </button>
                    <button onClick={() => setCopilotResponse(null)} className="px-4 py-2 rounded-xl text-xs border border-border hover:bg-muted transition-colors">Cancel</button>
                  </div>
                )}
              </div>
            )}
            {copilotResponse.type === 'error' && (
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <p className="text-sm text-amber-400">{copilotResponse.message}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground uppercase tracking-widest font-semibold">
        <div className="flex-1 h-px bg-border" />
        or manual dispatch
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Manual Dispatch */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">🗺️</div>
          Manual Trip Dispatch
        </div>

        {/* PostGIS finder */}
        <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 justify-between">
            <span className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" /> PostGIS: Nearest Vehicle Finder</span>
            <button type="button" onClick={getUserLocation} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1">
              <Navigation className="w-3 h-3" /> Get My Location
            </button>
          </div>
          <div className="flex gap-2">
            <input type="number" step="0.0001" placeholder="Origin Lat" className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono" value={originLat} onChange={e => setOriginLat(e.target.value)} />
            <input type="number" step="0.0001" placeholder="Origin Lon" className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono" value={originLon} onChange={e => setOriginLon(e.target.value)} />
            <button type="button" onClick={handleFindNearest} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Search</button>
          </div>
          
          {nearestVehicle && (
            <div className={`mt-3 p-3 rounded-lg border text-sm flex justify-between items-center ${nearestVehicle.status === 'Available' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div>
                <div className="font-semibold">{nearestVehicle.licensePlate} <span className="text-muted-foreground font-normal text-xs">— {nearestVehicle.make} {nearestVehicle.model}</span></div>
                <div className="text-xs mt-0.5 text-muted-foreground">
                  {Math.round(nearestVehicle.distanceToMeter / 1000)} km away 
                  <span className="mx-1.5">•</span> 
                  ETA: {Math.round((nearestVehicle.distanceToMeter / 1000) / 60)} hrs
                </div>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${nearestVehicle.status === 'Available' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                {nearestVehicle.status}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleDispatch} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Destination */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Destination <span className="text-primary/50 text-[10px]">(New)</span></label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input required type="text" className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Chennai Port" />
              </div>
            </div>

            {/* Distance */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Est. Distance <span className="text-primary/50 text-[10px]">(New)</span></label>
              <div className="relative">
                <input required type="number" min="1" className="w-full pl-4 pr-10 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                  value={distanceKm} onChange={e => setDistanceKm(e.target.value)} placeholder="340" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">km</span>
              </div>
            </div>
          </div>

          {/* Vehicle select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assign Vehicle</label>
            <select required className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none cursor-pointer font-mono"
              value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
              <option value="">— Choose a vehicle —</option>
              {vehicles.map(v => <option key={v.id} value={v.id} disabled={v.status !== 'Available'}>{v.licensePlate} ({v.status}) — Max {v.maxCapacityKg.toLocaleString()}kg</option>)}
            </select>
          </div>

          {/* Driver select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assign Driver</label>
            <select required className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none cursor-pointer"
              value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
              <option value="">— Choose a driver —</option>
              {drivers.map(d => <option key={d.id} value={d.id} disabled={d.status !== 'Available'}>{d.user?.name} ({d.licenseNumber}) — {d.status}</option>)}
            </select>
          </div>

          {/* Cargo weight */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cargo Weight</label>
            <div className="relative">
              <input required type="number" min="0" className="w-full pl-4 pr-10 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                value={cargoWeight} onChange={e => setCargoWeight(e.target.value)} placeholder="e.g., 2500" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">kg</span>
            </div>
          </div>

          <button type="submit" className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 mt-2 hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(210 100% 45%))', boxShadow: '0 4px 20px hsl(var(--primary)/0.3)' }}>
            🚛 Dispatch Trip
          </button>
        </form>
      </div>
    </div>
  );
}

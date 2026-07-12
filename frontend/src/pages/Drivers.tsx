import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface Driver {
  id: number;
  user: { name: string; email: string };
  licenseNumber: string;
  licenseExpiry: string;
  status: string;
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function getLicenseBadge(expiry: string) {
  const days = daysUntil(expiry);
  if (days < 0) return { label: 'EXPIRED', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' };
  if (days <= 14) return { label: `${days}d left`, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' };
  if (days <= 30) return { label: `${days}d left`, color: '#f97316', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.3)' };
  return { label: `${days}d left`, color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)' };
}

function DriverCard({ d, index, onToggle, canToggle }: { d: Driver; index: number; onToggle: (id: number) => void; canToggle: boolean }) {
  const isSuspended = d.status === 'Suspended';
  const licenseBadge = getLicenseBadge(d.licenseExpiry);
  const initials = d.user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <div
      className="p-5 rounded-2xl border card-hover relative overflow-hidden group fade-in-up"
      style={{
        background: 'hsl(var(--card))',
        borderColor: isSuspended ? 'rgba(239,68,68,0.3)' : 'hsl(var(--border))',
        boxShadow: isSuspended ? '0 0 16px rgba(239,68,68,0.12)' : undefined,
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Suspend overlay streak */}
      {isSuspended && (
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-stripes" />
      )}

      {/* Header: avatar + name */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
          style={{
            background: isSuspended
              ? 'linear-gradient(135deg, #ef444460, #ef444420)'
              : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            border: isSuspended ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(59,130,246,0.3)',
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{d.user.name}</div>
          <div className="text-xs text-muted-foreground truncate">{d.user.email}</div>
        </div>
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0"
          style={{
            background: isSuspended ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
            color: isSuspended ? '#ef4444' : '#10b981',
            border: isSuspended ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)',
          }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${!isSuspended ? 'status-blink' : ''}`}
            style={{ background: isSuspended ? '#ef4444' : '#10b981' }}
          />
          {d.status}
        </div>
      </div>

      {/* License info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">License</span>
          <span className="font-mono font-medium">{d.licenseNumber}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Expiry</span>
          <span
            className="px-2 py-0.5 rounded-full font-semibold font-mono"
            style={{ background: licenseBadge.bg, color: licenseBadge.color, border: `1px solid ${licenseBadge.border}` }}
          >
            {licenseBadge.label}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Expires</span>
          <span className="text-foreground/80">{new Date(d.licenseExpiry).toLocaleDateString()}</span>
        </div>
      </div>

      {/* License countdown bar */}
      <div className="mb-4">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${Math.max(0, Math.min(100, (daysUntil(d.licenseExpiry) / 365) * 100))}%`,
              background: `linear-gradient(90deg, ${licenseBadge.color}60, ${licenseBadge.color})`,
            }}
          />
        </div>
      </div>

      {/* Action */}
      {canToggle && (
        <button
          onClick={() => onToggle(d.id)}
          className="w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200"
          style={
            isSuspended
              ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }
              : { background: 'rgba(239,68,68,0.10)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }
          }
        >
          {isSuspended ? '✓ Reinstate Driver' : '⊘ Suspend Driver'}
        </button>
      )}
    </div>
  );
}

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const { user } = useContext(AuthContext);

  const canToggle = user?.role === 'Safety Officer' || user?.role === 'Fleet Manager';

  const fetchDrivers = () => {
    setLoading(true);
    fetch('http://localhost:3001/api/drivers', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(data => { setDrivers(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/drivers/${id}/toggle-status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }
      toast.success('Driver status updated');
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statuses = ['All', 'Available', 'Suspended'];
  const filtered = filter === 'All' ? drivers : drivers.filter(d => d.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Driver Roster</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{drivers.length} drivers on your team</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active', count: drivers.filter(d => d.status === 'Available').length, color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
          { label: 'Suspended', count: drivers.filter(d => d.status === 'Suspended').length, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '⊘' },
          { label: 'Expiring Soon', count: drivers.filter(d => daysUntil(d.licenseExpiry) <= 30 && daysUntil(d.licenseExpiry) >= 0).length, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⚠️' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-border" style={{ background: s.bg }}>
            <div className="text-lg mb-1">{s.icon}</div>
            <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              filter === s ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground border-transparent hover:border-border hover:text-foreground'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {[1, 2, 3].map(i => <div key={i} className="h-52 rounded-2xl bg-card border border-border shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          <p className="text-4xl mb-3">👥</p>
          <p>No {filter !== 'All' ? filter.toLowerCase() : ''} drivers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map((d, i) => (
            <DriverCard key={d.id} d={d} index={i} onToggle={handleToggleStatus} canToggle={canToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Truck, User } from 'lucide-react';

interface AuditLogEntry {
  id: number;
  eventType: string;
  entityType: string;
  entityId: number;
  detail: string;
  actor: string;
  createdAt: string;
  trip?: any;
  vehicle?: any;
}

const EVENT_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  TripDispatched: { icon: '🚛', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
  TripCompleted: { icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  MaintenanceLogged: { icon: '🔧', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  DriverSuspended: { icon: '⊘', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
  DriverReinstated: { icon: '✓', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  ComplianceCheck: { icon: '🛡️', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)' },
};

function getEventConfig(type: string) {
  return EVENT_CONFIG[type] || { icon: '📋', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)' };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetch('http://localhost:3001/api/audit-log', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(data => { setLogs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const eventTypes = ['All', ...Array.from(new Set(logs.map(l => l.eventType)))];
  const filtered = filter === 'All' ? logs : logs.filter(l => l.eventType === filter);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audit Log</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Complete trail of all fleet events</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          {logs.length} Events
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {eventTypes.slice(0, 7).map(t => {
          const cfg = getEventConfig(t);
          const isActive = filter === t;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                isActive ? 'text-foreground' : 'text-muted-foreground border-transparent hover:border-border'
              }`}
              style={isActive && t !== 'All' ? {
                background: cfg.bg,
                borderColor: cfg.border,
                color: cfg.color,
              } : isActive ? { background: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))' } : {}}
            >
              {t !== 'All' && <span>{cfg.icon}</span>}
              {t}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-3 stagger">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 rounded-xl bg-card border border-border shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No audit events found.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gradient-to-b from-border via-border to-transparent" />

          <div className="space-y-4 stagger">
            {filtered.map((log, i) => {
              const cfg = getEventConfig(log.eventType);
              const isTrip = log.eventType === 'TripDispatched' || log.eventType === 'TripCompleted';
              
              return (
                <div key={log.id} className="flex gap-4 fade-in-up" style={{ animationDelay: `${Math.min(i * 30, 400)}ms` }}>
                  {/* Timeline dot */}
                  <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-lg z-10 relative mt-1"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, boxShadow: `0 0 8px ${cfg.color}20` }}>
                    {cfg.icon}
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 p-5 rounded-2xl border bg-card hover:border-border/80 transition-all card-hover"
                    style={{ borderColor: 'hsl(var(--border))' }}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          {log.eventType}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">{log.entityType} #{log.entityId}</span>
                      </div>
                      <div className="text-right flex-shrink-0 leading-tight">
                        <div className="text-xs font-semibold text-muted-foreground">{timeAgo(log.createdAt)}</div>
                        <div className="text-[10px] text-muted-foreground/50 mt-0.5">
                          {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-foreground/90 leading-relaxed mb-4">{log.detail}</p>

                    {/* Rich Data Panels based on event type */}
                    {isTrip && log.trip && (
                      <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 text-xs mb-3">
                        <div className="flex items-start gap-2">
                          <Truck className="w-4 h-4 text-blue-400 mt-0.5" />
                          <div>
                            <div className="font-semibold text-foreground/80">Vehicle</div>
                            <div className="font-mono">{log.trip.vehicle.licensePlate}</div>
                            <div className="text-muted-foreground text-[10px]">{log.trip.vehicle.make} {log.trip.vehicle.model}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-emerald-400 mt-0.5" />
                          <div>
                            <div className="font-semibold text-foreground/80">Driver</div>
                            <div>{log.trip.driver.user.name}</div>
                          </div>
                        </div>
                        {log.trip.destination && (
                          <div className="col-span-2 flex items-start gap-2 pt-2 border-t border-border/50">
                            <MapPin className="w-4 h-4 text-purple-400 mt-0.5" />
                            <div>
                              <div className="font-semibold text-foreground/80">Destination</div>
                              <div>{log.trip.destination} <span className="text-muted-foreground">({log.trip.distanceKm} km)</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actor footer */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="opacity-60">Action by</span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/40 border border-border/50">
                        {log.actor === 'copilot' || log.actor === 'pg_cron' ? '🤖' : '👤'}
                        <span className="font-semibold">{log.actor}</span>
                      </div>
                    </div>
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

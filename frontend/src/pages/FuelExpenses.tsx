import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, TrendingUp, Wrench, Truck, RefreshCw, ArrowUp } from 'lucide-react';

interface CostEntry {
  vehicleId: number;
  licensePlate: string;
  totalCost: number;
  tripsCount: number;
  costPerTrip: number;
}

interface ExpenseLog {
  id: number;
  vehicleId: number;
  description: string;
  cost: number;
  date: string;
  vehicle?: { licensePlate: string };
}

const CHART_COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#a855f7', '#f59e0b', '#ef4444'];

function KpiCard({ icon: Icon, label, value, sub, color, delay = 0 }: any) {
  return (
    <div
      className="p-5 rounded-2xl border border-border bg-card card-hover fade-in-up relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 blur-xl"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="relative z-10">
        <div className="text-2xl font-bold font-mono tracking-tight">{value}</div>
        <div className="text-sm font-medium text-foreground/80 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl">
      <div className="font-mono text-xs font-semibold mb-2">{label}</div>
      <div className="text-sm font-bold" style={{ color: '#3b82f6' }}>
        ${Number(payload[0].value).toLocaleString()} total
      </div>
      {payload[1] && (
        <div className="text-xs text-muted-foreground mt-0.5">
          ${Number(payload[1].value).toFixed(0)} / trip
        </div>
      )}
    </div>
  );
};

export default function FuelExpenses() {
  const [costData, setCostData] = useState<CostEntry[]>([]);
  const [logs, setLogs] = useState<ExpenseLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [metricsRes, logsRes] = await Promise.all([
        fetch('http://localhost:3001/api/dashboard/financial-metrics', { headers }),
        fetch('http://localhost:3001/api/expenses/logs', { headers }),
      ]);
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setCostData(data.costRanking || []);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalSpend = costData.reduce((s, c) => s + c.totalCost, 0);
  const totalTrips = costData.reduce((s, c) => s + c.tripsCount, 0);
  const avgCostPerTrip = totalTrips > 0 ? totalSpend / totalTrips : 0;
  const topVehicle = costData[0];

  const chartData = costData.slice(0, 8).map(c => ({
    name: c.licensePlate,
    total: Math.round(c.totalCost),
    perTrip: Math.round(c.costPerTrip),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fuel & Expenses</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Fleet cost analysis & maintenance spend</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-card border border-border shimmer" />)}
          </div>
          <div className="h-64 rounded-2xl bg-card border border-border shimmer" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={DollarSign}
              label="Total Maintenance Spend"
              value={`$${totalSpend.toLocaleString()}`}
              sub="Across all vehicles"
              color="#3b82f6"
              delay={0}
            />
            <KpiCard
              icon={TrendingUp}
              label="Avg Cost per Trip"
              value={`$${avgCostPerTrip.toFixed(0)}`}
              sub={`${totalTrips} trips total`}
              color="#10b981"
              delay={60}
            />
            <KpiCard
              icon={Truck}
              label="Vehicles Tracked"
              value={costData.length}
              sub="With maintenance records"
              color="#a855f7"
              delay={120}
            />
            {topVehicle && (
              <KpiCard
                icon={ArrowUp}
                label="Highest Cost Vehicle"
                value={topVehicle.licensePlate}
                sub={`$${topVehicle.totalCost.toLocaleString()} total spend`}
                color="#ef4444"
                delay={180}
              />
            )}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="p-6 rounded-2xl border border-border bg-card fade-in-up" style={{ animationDelay: '240ms' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold">Vehicle Cost Breakdown</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Total maintenance spend by vehicle</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontFamily: 'JetBrains Mono' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `$${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.4)', radius: 8 }} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Cost ranking table */}
          {costData.length > 0 && (
            <div className="rounded-2xl border border-border overflow-hidden fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="px-6 py-4 border-b border-border bg-card flex items-center gap-2">
                <Wrench className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Cost Ranking by Vehicle</h3>
              </div>
              <div className="divide-y divide-border">
                {costData.map((c, i) => {
                  const pct = totalSpend > 0 ? (c.totalCost / totalSpend) * 100 : 0;
                  return (
                    <div key={c.vehicleId} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: `${CHART_COLORS[i % CHART_COLORS.length]}20`, color: CHART_COLORS[i % CHART_COLORS.length] }}
                      >
                        {i + 1}
                      </div>
                      <div className="font-mono text-sm font-semibold w-20 flex-shrink-0">{c.licensePlate}</div>
                      <div className="flex-1">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                        </div>
                      </div>
                      <div className="text-right min-w-[80px] flex-shrink-0">
                        <div className="font-mono text-sm font-bold">${c.totalCost.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{c.tripsCount} trip{c.tripsCount !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expense log */}
          {logs.length > 0 && (
            <div className="rounded-2xl border border-border overflow-hidden fade-in-up" style={{ animationDelay: '360ms' }}>
              <div className="px-6 py-4 border-b border-border bg-card">
                <h3 className="font-semibold text-sm">Recent Maintenance Records</h3>
              </div>
              <div className="divide-y divide-border stagger">
                {logs.slice(0, 15).map((log, i) => (
                  <div key={log.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/20 transition-colors fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{log.description}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {log.vehicle?.licensePlate || `Vehicle #${log.vehicleId}`} · {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-sm">${Number(log.cost).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {costData.length === 0 && logs.length === 0 && (
            <div className="py-24 text-center text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No expense data yet</p>
              <p className="text-sm mt-1">Log maintenance records to see cost analytics here.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

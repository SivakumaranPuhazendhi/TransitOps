import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Truck, Users, MapPin, Wrench, DollarSign, Moon, Sun, LogOut, Bell, ShieldCheck, ChevronRight } from 'lucide-react';
import { useState, useEffect, useContext } from 'react';
import Trips from './pages/Trips';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Maintenance from './pages/Maintenance';
import AuditLog from './pages/AuditLog';
import Login from './pages/Login';
import MyTrips from './pages/MyTrips';
import FuelExpenses from './pages/FuelExpenses';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { io } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';

const socket = io('http://localhost:3001');

interface NavItem {
  to: string;
  icon: any;
  label: string;
  color?: string;
}

const SidebarItem = ({ to, icon: Icon, label, color }: NavItem) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
        isActive
          ? 'sidebar-active font-semibold'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
      }`}
    >
      {isActive && (
        <div
          className="absolute inset-0 opacity-20 rounded-xl"
          style={{ background: `linear-gradient(135deg, ${color || 'hsl(var(--primary))'}20, transparent)` }}
        />
      )}
      <Icon
        className={`w-4 h-4 flex-shrink-0 relative z-10 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
        style={isActive ? { color } : {}}
      />
      <span className="text-sm relative z-10 flex-1">{label}</span>
      {isActive && <ChevronRight className="w-3 h-3 relative z-10 opacity-60" />}
    </Link>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [driverExpiryWarning, setDriverExpiryWarning] = useState<{ date: string } | null>(null);
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    if (user?.role === 'Driver') {
      fetch('http://localhost:3001/api/driver/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data?.licenseExpiry) {
            const expiryDate = new Date(data.licenseExpiry);
            const diffDays = Math.ceil((expiryDate.getTime() - Date.now()) / 86400000);
            if (diffDays <= 14 && diffDays >= 0) setDriverExpiryWarning({ date: expiryDate.toLocaleDateString() });
            else if (diffDays < 0) setDriverExpiryWarning({ date: 'EXPIRED' });
          }
        })
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    socket.on('fleetUpdate', event => {
      if (event.type === 'MaintenanceFlagged') {
        setMaintenanceAlerts(prev => [{ plate: event.data.plate, drop: event.data.drop, time: new Date() }, ...prev]);
        toast.error(`🔧 Maintenance Alert: ${event.data.plate}`, { duration: 5000 });
      }
    });
    return () => { socket.off('fleetUpdate'); };
  }, []);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  const hasRole = (roles: string[]) => user && roles.includes(user.role);

  const getRoleColor = () => {
    switch (user?.role) {
      case 'Fleet Manager': return '#3b82f6';
      case 'Driver': return '#10b981';
      case 'Safety Officer': return '#f59e0b';
      case 'Financial Analyst': return '#a855f7';
      default: return 'hsl(var(--primary))';
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'Fleet Manager': return '🚛';
      case 'Driver': return '🧑‍✈️';
      case 'Safety Officer': return '🛡️';
      case 'Financial Analyst': return '📊';
      default: return '👤';
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-border bg-card flex flex-col relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 right-0 h-48 opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top, ${getRoleColor()}30, transparent 70%)` }} />

        {/* Logo */}
        <div className="p-5 relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-lg flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${getRoleColor()}, ${getRoleColor()}80)`, boxShadow: `0 0 15px ${getRoleColor()}40` }}
            >
              T
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight">TransitOps</div>
              <div className="text-[10px] text-muted-foreground">Fleet Intelligence</div>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: `${getRoleColor()}20`, border: `1px solid ${getRoleColor()}40` }}
              >
                {getRoleIcon()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">{user.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{user.role}</div>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 relative z-10 overflow-y-auto">
          <div className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-3 py-2">Navigation</div>
          <SidebarItem to="/" icon={Home} label="Dashboard" color={getRoleColor()} />
          {hasRole(['Fleet Manager', 'Safety Officer']) && <SidebarItem to="/vehicles" icon={Truck} label="Vehicles" color={getRoleColor()} />}
          {hasRole(['Fleet Manager', 'Safety Officer']) && <SidebarItem to="/drivers" icon={Users} label="Drivers" color={getRoleColor()} />}
          {hasRole(['Fleet Manager']) && <SidebarItem to="/trips" icon={MapPin} label="Dispatch Trips" color={getRoleColor()} />}
          {hasRole(['Driver']) && <SidebarItem to="/my-trips" icon={MapPin} label="My Trips" color={getRoleColor()} />}
          {hasRole(['Fleet Manager', 'Financial Analyst', 'Safety Officer']) && <SidebarItem to="/maintenance" icon={Wrench} label="Maintenance" color={getRoleColor()} />}
          {hasRole(['Fleet Manager', 'Safety Officer']) && <SidebarItem to="/audit" icon={ShieldCheck} label="Audit Log" color={getRoleColor()} />}
          {hasRole(['Fleet Manager', 'Financial Analyst']) && <SidebarItem to="/expenses" icon={DollarSign} label="Fuel & Expenses" color={getRoleColor()} />}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-border relative z-10 space-y-1">
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto relative">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex items-center justify-end px-6 py-3 border-b border-border/50 backdrop-blur-md bg-background/80">
          {hasRole(['Fleet Manager', 'Safety Officer']) && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 rounded-lg hover:bg-muted transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {maintenanceAlerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full status-blink" />
                )}
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl p-4 z-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">Live Alerts</h3>
                    <button onClick={() => setShowDropdown(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {maintenanceAlerts.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No alerts yet. System is healthy ✅</p>
                    ) : maintenanceAlerts.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
                        <div className="text-lg">🔧</div>
                        <div>
                          <span className="font-semibold text-destructive text-xs">{a.plate}</span>
                          <div className="text-xs text-muted-foreground">{(a.drop * 100).toFixed(0)}% efficiency drop detected</div>
                          <div className="text-[10px] text-muted-foreground/60 mt-0.5">{a.time.toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {driverExpiryWarning && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-3 text-destructive text-sm">
              ⚠️ <div><strong>Action Required:</strong> Your license expires on {driverExpiryWarning.date}. Contact your manager immediately.</div>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '13px' },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/vehicles" element={<ProtectedRoute roles={['Fleet Manager', 'Safety Officer']}><Vehicles /></ProtectedRoute>} />
                <Route path="/drivers" element={<ProtectedRoute roles={['Fleet Manager', 'Safety Officer']}><Drivers /></ProtectedRoute>} />
                <Route path="/trips" element={<ProtectedRoute roles={['Fleet Manager']}><Trips /></ProtectedRoute>} />
                <Route path="/my-trips" element={<ProtectedRoute roles={['Driver']}><MyTrips /></ProtectedRoute>} />
                <Route path="/maintenance" element={<ProtectedRoute roles={['Fleet Manager', 'Safety Officer', 'Financial Analyst']}><Maintenance /></ProtectedRoute>} />
                <Route path="/audit" element={<ProtectedRoute roles={['Fleet Manager', 'Safety Officer']}><AuditLog /></ProtectedRoute>} />
                <Route path="/expenses" element={<ProtectedRoute roles={['Fleet Manager', 'Financial Analyst']}><FuelExpenses /></ProtectedRoute>} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

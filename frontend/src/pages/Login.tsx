import { useRef, useEffect, useState, useContext } from 'react';
import * as THREE from 'three';
import { AuthContext } from '../context/AuthContext';

interface RoleCard {
  role: string;
  email: string;
  color: string;
  glowColor: string;
  icon: string;
  description: string;
}

const ROLES: RoleCard[] = [
  {
    role: 'Fleet Manager',
    email: 'manager@transitops.com',
    icon: '🚛',
    color: '#3b82f6',
    glowColor: 'rgba(59,130,246,0.4)',
    description: 'Dispatch trips, manage fleet & AI Copilot',
  },
  {
    role: 'Driver',
    email: 'driver1@transitops.com',
    icon: '🧑‍✈️',
    color: '#10b981',
    glowColor: 'rgba(16,185,129,0.4)',
    description: 'View assigned trips & update location',
  },
  {
    role: 'Safety Officer',
    email: 'safety@transitops.com',
    icon: '🛡️',
    color: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.4)',
    description: 'Monitor compliance & license expiries',
  },
  {
    role: 'Financial Analyst',
    email: 'finance@transitops.com',
    icon: '📊',
    color: '#a855f7',
    glowColor: 'rgba(168,85,247,0.4)',
    description: 'Track costs, fuel & maintenance spend',
  },
];

// ---- Three.js Transport Scene ----
function TransportCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.set(0, 28, 50);
    camera.lookAt(0, 0, 0);

    // Road grid — horizontal and vertical lanes
    const roadMat = new THREE.LineBasicMaterial({ color: '#1e3a5f', transparent: true, opacity: 0.6 });
    const roadGroup = new THREE.Group();

    const GRID = 10;
    const SPACING = 8;
    for (let i = -GRID; i <= GRID; i++) {
      // Horizontal roads
      const hGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-GRID * SPACING, 0, i * SPACING),
        new THREE.Vector3(GRID * SPACING, 0, i * SPACING)
      ]);
      roadGroup.add(new THREE.Line(hGeo, roadMat));
      // Vertical roads
      const vGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i * SPACING, 0, -GRID * SPACING),
        new THREE.Vector3(i * SPACING, 0, GRID * SPACING)
      ]);
      roadGroup.add(new THREE.Line(vGeo, roadMat));
    }
    scene.add(roadGroup);

    // City nodes (depots) at intersections
    const nodeGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const nodes: THREE.Mesh[] = [];
    const nodePositions = [
      [-24, 0, -24], [0, 0, -24], [24, 0, -24],
      [-24, 0, 0],   [0, 0, 0],   [24, 0, 0],
      [-24, 0, 24],  [0, 0, 24],  [24, 0, 24],
    ];
    const nodeColors = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#a855f7'];

    nodePositions.forEach(([x, y, z], i) => {
      const mat = new THREE.MeshBasicMaterial({ color: nodeColors[i] });
      const node = new THREE.Mesh(nodeGeo, mat);
      node.position.set(x!, y!, z!);
      scene.add(node);
      nodes.push(node);
    });

    // Trucks — small boxes moving along roads
    const truckGeo = new THREE.BoxGeometry(1.2, 0.6, 2.2);
    const TRUCK_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#06b6d4', '#ef4444'];

    interface TruckData {
      mesh: THREE.Mesh;
      route: { x: number; z: number }[];
      progress: number;
      speed: number;
      routeIdx: number;
    }

    const truckRoutes = [
      [{ x: -24, z: -24 }, { x: 0, z: -24 }, { x: 24, z: -24 }, { x: 24, z: 0 }, { x: 24, z: 24 }],
      [{ x: 24, z: 24 }, { x: 0, z: 24 }, { x: -24, z: 24 }, { x: -24, z: 0 }],
      [{ x: 0, z: -24 }, { x: 0, z: 0 }, { x: 0, z: 24 }],
      [{ x: -24, z: 0 }, { x: 0, z: 0 }, { x: 24, z: 0 }],
      [{ x: 24, z: -24 }, { x: 0, z: -24 }, { x: -24, z: -24 }, { x: -24, z: 0 }, { x: -24, z: 24 }],
      [{ x: 0, z: 24 }, { x: 0, z: 0 }, { x: 0, z: -24 }],
    ];

    const trucks: TruckData[] = truckRoutes.map((route, i) => {
      const mat = new THREE.MeshBasicMaterial({ color: TRUCK_COLORS[i % TRUCK_COLORS.length] });
      const mesh = new THREE.Mesh(truckGeo, mat);
      mesh.position.set(route[0]!.x, 0.5, route[0]!.z);
      scene.add(mesh);
      return { mesh, route, progress: Math.random(), speed: 0.003 + Math.random() * 0.004, routeIdx: 0 };
    });

    // Trail particles behind trucks
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(trucks.length * 30 * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.PointsMaterial({ color: '#3b82f6', size: 0.15, transparent: true, opacity: 0.4 });
    scene.add(new THREE.Points(trailGeo, trailMat));

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Slow camera orbit
      camera.position.x = Math.sin(t * 0.05) * 55;
      camera.position.z = Math.cos(t * 0.05) * 55;
      camera.lookAt(0, 0, 0);

      // Move trucks
      trucks.forEach((truck, ti) => {
        truck.progress += truck.speed;
        if (truck.progress >= 1) {
          truck.progress = 0;
          truck.routeIdx = (truck.routeIdx + 1) % (truck.route.length - 1);
        }
        const from = truck.route[truck.routeIdx]!;
        const to = truck.route[(truck.routeIdx + 1) % truck.route.length]!;
        truck.mesh.position.x = from.x + (to.x - from.x) * truck.progress;
        truck.mesh.position.z = from.z + (to.z - from.z) * truck.progress;
        // Orient truck along direction
        const angle = Math.atan2(to.x - from.x, to.z - from.z);
        truck.mesh.rotation.y = angle;
      });

      // Node pulse
      nodes.forEach((node, i) => {
        const scale = 1 + 0.3 * Math.sin(t * 2 + i);
        node.scale.set(scale, scale, scale);
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!el) return;
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" />;
}

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<RoleCard | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleRoleSelect = (role: RoleCard) => {
    setSelectedRole(role);
    setEmail(role.email);
    setPassword('password');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#030712', color: 'white' }}>
      {/* LEFT — 3D Transport Scene */}
      <div className="hidden lg:flex flex-col relative w-[55%] overflow-hidden">
        <TransportCanvas />
        {/* Dark gradient overlay right→left */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#030712] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/50 via-transparent to-[#030712]/70 pointer-events-none" />

        {/* Branding */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', boxShadow: '0 0 20px rgba(59,130,246,0.5)' }}>T</div>
              <span className="text-2xl font-bold tracking-tight">TransitOps</span>
            </div>
            <p className="text-blue-300/60 text-sm">Fleet Intelligence Platform — Live Tracking & AI Dispatch</p>
          </div>

          <div className="space-y-5">
            {[
              { icon: '🚛', title: 'Real-Time Fleet Tracking', desc: 'PostGIS-powered live vehicle positions across all routes' },
              { icon: '🤖', title: 'AI Dispatch Copilot', desc: 'Natural language fleet control — "Dispatch TRK-007 to Chennai Port"' },
              { icon: '⚡', title: 'Supabase Realtime', desc: 'Zero-latency websocket alerts for maintenance & compliance' },
              { icon: '🛡️', title: 'Automated Safety Compliance', desc: 'pg_cron auto-suspend + risk scoring on every dispatch' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4 fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>{f.icon}</div>
                <div>
                  <div className="font-semibold text-sm text-white/90">{f.title}</div>
                  <div className="text-xs text-white/40 mt-0.5 leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-white/20">Supabase Hackathon 2026 · TransitOps v2</div>
        </div>
      </div>

      {/* RIGHT — Login panel */}
      <div className="flex-1 flex flex-col justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>T</div>
            <span className="text-xl font-bold">TransitOps</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="text-white/40 mt-1 text-sm">Select your role to access the fleet platform</p>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((r) => (
              <button
                key={r.role}
                onClick={() => handleRoleSelect(r)}
                className="relative p-4 rounded-xl text-left transition-all duration-200 cursor-pointer"
                style={{
                  background: selectedRole?.role === r.role ? `linear-gradient(135deg, ${r.color}18, ${r.color}08)` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedRole?.role === r.role ? r.color + '50' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: selectedRole?.role === r.role ? `0 0 20px ${r.glowColor}` : undefined,
                  transform: selectedRole?.role === r.role ? 'scale(1.02)' : undefined,
                }}
              >
                <div className="text-2xl mb-2">{r.icon}</div>
                <div className="font-semibold text-sm text-white/90">{r.role}</div>
                <div className="text-xs text-white/40 mt-0.5 leading-relaxed">{r.description}</div>
                {selectedRole?.role === r.role && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: r.color }}>
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Login form */}
          {selectedRole && (
            <div className="p-5 rounded-xl space-y-4 fade-in-up"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', animationDelay: '0ms' }}>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: selectedRole.color }}>
                <span>{selectedRole.icon}</span>
                <span>Sign in as {selectedRole.role}</span>
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'rgba(255,255,255,0.4)' }}>Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder="your@email.com" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'rgba(255,255,255,0.4)' }}>Password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder="••••••••" />
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${selectedRole.color}, ${selectedRole.color}cc)`,
                    boxShadow: isLoading ? 'none' : `0 4px 20px ${selectedRole.glowColor}`,
                  }}>
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : `Sign in as ${selectedRole.role}`}
                </button>
              </form>
            </div>
          )}

          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
            All demo accounts use password: <span className="font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>password</span>
          </p>
        </div>
      </div>
    </div>
  );
}

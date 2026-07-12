import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Truck, User, Plus, Edit2, ShieldAlert } from 'lucide-react';

export default function FleetRegistry() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, dRes] = await Promise.all([
        fetch('http://localhost:3001/api/vehicles', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        fetch('http://localhost:3001/api/drivers', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);
      setVehicles(await vRes.json());
      setDrivers(await dRes.json());
    } catch (err) {
      toast.error('Failed to load registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setEditingItem(null);
    setFormData(activeTab === 'vehicles' ? { status: 'Available' } : { status: 'Available' });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'vehicles') {
      setFormData({ ...item });
    } else {
      setFormData({
        name: item.user?.name,
        email: item.user?.email,
        licenseNumber: item.licenseNumber,
        licenseExpiry: item.licenseExpiry.split('T')[0],
        status: item.status
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = activeTab === 'vehicles' ? '/api/vehicles' : '/api/drivers';
    const url = editingItem ? `http://localhost:3001${endpoint}/${editingItem.id}` : `http://localhost:3001${endpoint}`;
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      
      toast.success(editingItem ? 'Updated successfully!' : 'Created successfully!');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'On Trip': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'In Shop': 
      case 'Suspended': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fleet Registry</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your fleet and personnel records.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add {activeTab === 'vehicles' ? 'Vehicle' : 'Driver'}
        </button>
      </div>

      <div className="flex gap-2 border-b border-border pb-px">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'vehicles' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Truck className="w-4 h-4" /> Vehicles
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'drivers' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <User className="w-4 h-4" /> Drivers
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Loading registry...</div>
        ) : activeTab === 'vehicles' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Plate & Model</th>
                  <th className="px-6 py-4">Capacity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-foreground">{v.licensePlate}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{v.make} {v.model}</div>
                    </td>
                    <td className="px-6 py-4 font-mono">{v.maxCapacityKg} kg</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(v.status)}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEdit(v)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Name & Email</th>
                  <th className="px-6 py-4">License</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {drivers.map(d => (
                  <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{d.user?.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{d.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono">{d.licenseNumber}</div>
                      <div className={`text-xs mt-0.5 ${new Date(d.licenseExpiry) < new Date() ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                        Exp: {new Date(d.licenseExpiry).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEdit(d)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden fade-in-up">
            <div className="p-5 border-b border-border font-semibold flex items-center gap-2">
              {activeTab === 'vehicles' ? <Truck className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
              {editingItem ? 'Edit' : 'Add'} {activeTab === 'vehicles' ? 'Vehicle' : 'Driver'}
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {activeTab === 'vehicles' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Make</label>
                      <input required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" value={formData.make || ''} onChange={e => setFormData({...formData, make: e.target.value})} placeholder="Volvo" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Model</label>
                      <input required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" value={formData.model || ''} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="FH16" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">License Plate</label>
                    <input required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono uppercase" value={formData.licensePlate || ''} onChange={e => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})} placeholder="TN-01-AB-1234" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Max Capacity (kg)</label>
                    <input required type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono" value={formData.maxCapacityKg || ''} onChange={e => setFormData({...formData, maxCapacityKg: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Status</label>
                    <select required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" value={formData.status || 'Available'} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="In Shop">In Shop</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                    <input required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Email Address (Login ID)</label>
                    <input required type="email" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@transitops.com" />
                  </div>
                  {!editingItem && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><ShieldAlert className="w-3 h-3 text-amber-500" /> Temporary Password</label>
                      <input className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Leave blank for 'password123'" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">License Number</label>
                    <input required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono uppercase" value={formData.licenseNumber || ''} onChange={e => setFormData({...formData, licenseNumber: e.target.value.toUpperCase()})} placeholder="DL-..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">License Expiry</label>
                    <input required type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" value={formData.licenseExpiry || ''} onChange={e => setFormData({...formData, licenseExpiry: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Status</label>
                    <select required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" value={formData.status || 'Available'} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="Off Duty">Off Duty</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </>
              )}
              
              <div className="flex gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

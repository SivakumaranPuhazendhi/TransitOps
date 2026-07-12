import { useState, useEffect } from 'react';
import { Badge } from '../components/ui/Badge';
import toast from 'react-hot-toast';
import { MapPin } from 'lucide-react';

interface Trip {
  id: number;
  status: string;
  cargoWeightKg: number;
  createdAt: string;
  vehicle: { licensePlate: string; make: string; model: string };
}

interface Driver {
  id: number;
  licenseNumber: string;
  status: string;
  trips: Trip[];
}

export default function MyTrips() {
  const [driverData, setDriverData] = useState<Driver | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDriverData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/driver/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to load trips');
      const data = await res.json();
      setDriverData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  const handleCompleteTrip = async (tripId: number) => {
    if (!window.confirm('Are you sure you want to mark this trip as completed?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/trips/${tripId}/complete`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to complete trip');
      }
      toast.success('Trip marked as completed!');
      fetchDriverData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateLocation = async () => {
    // Mock coordinates (e.g., random variation around a central point)
    const mockLat = 40.7128 + (Math.random() - 0.5) * 0.1;
    const mockLon = -74.0060 + (Math.random() - 0.5) * 0.1;
    
    try {
      const res = await fetch('http://localhost:3001/api/driver/location', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ lat: mockLat, lon: mockLon })
      });
      if (!res.ok) throw new Error('Failed to update location');
      toast.success('Location updated successfully!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <h2 className="text-3xl font-bold tracking-tight">My Trips</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[1,2].map(i => (
            <div key={i} className="p-6 rounded-xl border border-border bg-card shadow-sm animate-pulse h-48">
              <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <div className="text-destructive">{error}</div>;
  if (!driverData) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Trips</h2>
          <p className="text-muted-foreground">Manage your currently assigned and past trips.</p>
        </div>
        <button onClick={handleUpdateLocation} className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium transition-colors border border-border">
          <MapPin className="w-4 h-4" /> Update My Location
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {driverData.trips.length === 0 ? (
          <div className="col-span-2 text-center py-12 p-6 rounded-xl border border-dashed border-border bg-muted/10">
            <h3 className="text-lg font-medium text-muted-foreground mb-1">No trips yet</h3>
            <p className="text-sm text-muted-foreground">Your next assignment will appear here once dispatched by the Fleet Manager.</p>
          </div>
        ) : (
          driverData.trips.map(trip => (
            <div key={trip.id} className="p-6 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Trip #{trip.id}</h3>
                    <span className="text-sm text-muted-foreground">{new Date(trip.createdAt).toLocaleString()}</span>
                  </div>
                  <Badge status={trip.status}>{trip.status}</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Vehicle:</span> {trip.vehicle.licensePlate} ({trip.vehicle.make} {trip.vehicle.model})</p>
                  <p><span className="font-medium">Cargo:</span> {trip.cargoWeightKg} kg</p>
                </div>
              </div>
              
              {trip.status === 'Dispatched' && (
                <div className="mt-6 pt-4 border-t border-border">
                  <button
                    onClick={() => handleCompleteTrip(trip.id)}
                    className="w-full bg-green-500 text-white hover:bg-green-600 font-medium py-2 rounded-md transition-colors"
                  >
                    Mark Completed
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

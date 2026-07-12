import { prisma } from '../index';
import { runRules } from './rules';
import { eventBus } from '../events/eventBus';
import { computeRiskScore } from './riskScore';

interface TripExtras {
  destination?: string;
  distanceKm?: number;
  originLat?: number;
  originLon?: number;
  destLat?: number;
  destLon?: number;
}

export async function dispatchTrip(vehicleId: number, driverId: number, cargoWeightKg: number, extras: TripExtras = {}) {
  // 1. Fetch Vehicle and Driver
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  const driver = await prisma.driver.findUnique({ where: { id: driverId } });

  if (!vehicle) return { success: false, errors: ['Vehicle not found'] };
  if (!driver) return { success: false, errors: ['Driver not found'] };

  // 2. Run Pluggable Rule Engine
  const { valid, errors } = runRules({ vehicle, driver, cargoWeightKg });
  
  if (!valid) {
    eventBus.emit('TripBlocked', { tripId: null, errors, vehicleId, driverId });
    return { success: false, errors };
  }

  // 3. Dispatch Atomically
  try {
    const result = await prisma.$transaction(async (tx) => {
      const cargoRatio = cargoWeightKg / vehicle.maxCapacityKg;
      const riskScore = computeRiskScore(8, 30, cargoRatio);

      const trip = await tx.trip.create({
        data: {
          vehicleId,
          driverId,
          cargoWeightKg,
          status: 'Draft',
          riskScore,
          startDate: null,
          destination: extras.destination ?? null,
          distanceKm: extras.distanceKm ?? null,
          originLat: extras.originLat ?? null,
          originLon: extras.originLon ?? null,
          destLat: extras.destLat ?? null,
          destLon: extras.destLon ?? null,
        }
      });

      await tx.$executeRaw`SELECT dispatch_trip_atomic(${trip.id}::int, ${vehicleId}::int, ${driverId}::int, ${riskScore}::float)`;

      const updatedTrip = await tx.trip.findUnique({
        where: { id: trip.id },
        include: {
          vehicle: { select: { licensePlate: true, make: true, model: true } },
          driver: { include: { user: { select: { name: true } } } }
        }
      });

      if (!updatedTrip) throw new Error('Trip not found after atomic dispatch');

      return { trip: updatedTrip, riskScore };
    });

    eventBus.emit('TripDispatched', {
      tripId: result.trip.id,
      vehicleId,
      driverId,
      riskScore: result.riskScore,
      destination: extras.destination,
    });

    return { success: true, trip: result.trip };
  } catch (err: any) {
    return { success: false, errors: [err.message] };
  }
}

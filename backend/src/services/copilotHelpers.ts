import { prisma } from '../index';

export async function findAlternativeDriver(excludedDriverId?: number) {
  const drivers = await prisma.driver.findMany({
    where: {
      status: 'Available',
      id: excludedDriverId ? { not: excludedDriverId } : undefined
    },
    include: {
      user: {
        select: { name: true }
      }
    },
    take: 1
  });

  if (drivers.length > 0) {
    return {
      id: drivers[0].id,
      name: drivers[0].user.name,
      licenseNumber: drivers[0].licenseNumber
    };
  }
  return null;
}

export async function findAlternativeVehicle(excludedVehicleId?: number) {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      status: 'Available',
      id: excludedVehicleId ? { not: excludedVehicleId } : undefined
    },
    take: 1
  });

  if (vehicles.length > 0) {
    return {
      id: vehicles[0].id,
      licensePlate: vehicles[0].licensePlate,
      maxCapacityKg: vehicles[0].maxCapacityKg
    };
  }
  return null;
}

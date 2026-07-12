import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Rich demo destinations across Indian cities for a realistic transport demo
const DESTINATIONS = [
  { name: 'Chennai Port Terminal', lat: 13.0827, lon: 80.2707, originLat: 12.9716, originLon: 77.5946, distanceKm: 346 },
  { name: 'Bangalore City Depot', lat: 12.9716, lon: 77.5946, originLat: 17.3850, originLon: 78.4867, distanceKm: 568 },
  { name: 'Mumbai JNPT Gateway', lat: 18.9488, lon: 72.9404, originLat: 19.0760, originLon: 72.8777, distanceKm: 55 },
  { name: 'Delhi NCR Logistics Park', lat: 28.7041, lon: 77.1025, originLat: 28.4595, originLon: 77.0266, distanceKm: 35 },
  { name: 'Hyderabad ISFC Hub', lat: 17.3850, lon: 78.4867, originLat: 17.6868, originLon: 83.2185, distanceKm: 625 },
  { name: 'Pune Industrial Zone', lat: 18.5204, lon: 73.8567, originLat: 19.0760, originLon: 72.8777, distanceKm: 149 },
  { name: 'Kolkata Netaji Port', lat: 22.5726, lon: 88.3639, originLat: 26.9124, originLon: 75.7873, distanceKm: 1205 },
  { name: 'Ahmedabad Central Yard', lat: 23.0225, lon: 72.5714, originLat: 19.0760, originLon: 72.8777, distanceKm: 532 },
  { name: 'Coimbatore Textile Hub', lat: 11.0168, lon: 76.9558, originLat: 13.0827, originLon: 80.2707, distanceKm: 492 },
  { name: 'Surat Diamond Exchange', lat: 21.1702, lon: 72.8311, originLat: 19.0760, originLon: 72.8777, distanceKm: 263 },
];

const MAINTENANCE_CATEGORIES = [
  'Brake Service', 'Engine Repair', 'Oil Change', 'Tire Replacement',
  'Transmission', 'Electrical', 'AC/Heating', 'Body Work', 'Fuel System', 'Annual Inspection'
];

export async function seedDatabase() {
  console.log('🌱 Starting rich demo seed...');

  // Clear all data in FK-safe order
  await prisma.auditLog.deleteMany();
  await prisma.fuelExpenseLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password', 10);

  // ==================== USERS ====================
  await prisma.user.create({ data: { email: 'manager@transitops.com', password: hashedPassword, name: 'Alice Manager', role: 'Fleet Manager' } });
  await prisma.user.create({ data: { email: 'safety@transitops.com', password: hashedPassword, name: 'Sam Safety', role: 'Safety Officer' } });
  await prisma.user.create({ data: { email: 'finance@transitops.com', password: hashedPassword, name: 'Fiona Finance', role: 'Financial Analyst' } });

  // ==================== DRIVERS ====================
  const driverData = [
    { name: 'Rajesh Kumar',    email: 'driver1@transitops.com', license: 'DL-RK001', expiry: 365,  status: 'Available' },
    { name: 'Priya Sharma',   email: 'driver2@transitops.com', license: 'DL-PS002', expiry: 200,  status: 'Available' },
    { name: 'Mohammed Ali',   email: 'driver3@transitops.com', license: 'DL-MA003', expiry: 10,   status: 'Available' },   // expiring soon!
    { name: 'Anita Desai',    email: 'driver4@transitops.com', license: 'DL-AD004', expiry: -5,   status: 'Suspended' },   // expired!
    { name: 'Vikram Singh',   email: 'driver5@transitops.com', license: 'DL-VS005', expiry: 540,  status: 'Available' },
    { name: 'Lakshmi Nair',   email: 'driver6@transitops.com', license: 'DL-LN006', expiry: -30,  status: 'Suspended' },   // expired + suspended
    { name: 'Suresh Patel',   email: 'driver7@transitops.com', license: 'DL-SP007', expiry: 730,  status: 'Available' },
    { name: 'Meera Iyer',     email: 'driver8@transitops.com', license: 'DL-MI008', expiry: 25,   status: 'Available' },   // expiring soon
    { name: 'Arjun Reddy',    email: 'driver9@transitops.com', license: 'DL-AR009', expiry: 450,  status: 'Available' },
    { name: 'Kavitha Menon',  email: 'driver10@transitops.com', license: 'DL-KM010', expiry: 90, status: 'Available' },
  ];

  const driverIds: number[] = [];
  for (const d of driverData) {
    const u = await prisma.user.create({
      data: { email: d.email, password: hashedPassword, name: d.name, role: 'Driver' }
    });
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + d.expiry);
    const dr = await prisma.driver.create({
      data: {
        userId: u.id,
        licenseNumber: d.license,
        licenseExpiry: expiryDate,
        status: d.status,
        suspendedReason: d.status === 'Suspended' ? (d.expiry < 0 ? 'auto_expired' : 'manual') : null,
      }
    });
    driverIds.push(dr.id);
  }

  // ==================== VEHICLES ====================
  const vehicleData = [
    { make: 'Volvo',       model: 'FH16',      plate: 'TRK-001', maxKg: 25000, status: 'Available' },
    { make: 'Scania',      model: 'R500',       plate: 'TRK-002', maxKg: 22000, status: 'Available' },
    { make: 'Tata',        model: 'Prima 4928', plate: 'TRK-003', maxKg: 18000, status: 'On Trip'   },
    { make: 'Ashok Leyland', model: 'U-4923',  plate: 'TRK-004', maxKg: 19000, status: 'Available' },
    { make: 'BharatBenz',  model: '4028',       plate: 'TRK-005', maxKg: 20000, status: 'In Shop'   },
    { make: 'Mahindra',    model: 'Blazo X 55', plate: 'TRK-006', maxKg: 17000, status: 'Available' },
    { make: 'Eicher',      model: 'Pro 8035',   plate: 'TRK-007', maxKg: 15000, status: 'On Trip'   },
    { make: 'Freightliner', model: 'Cascadia',  plate: 'TRK-008', maxKg: 24000, status: 'Available' },
    { make: 'Kenworth',    model: 'T680',       plate: 'TRK-009', maxKg: 23000, status: 'Available' },
    { make: 'MAN',         model: 'TGX 18.510', plate: 'TRK-010', maxKg: 21000, status: 'In Shop'   },
    { make: 'Ford',        model: 'Transit',    plate: 'VAN-01',  maxKg: 2000,  status: 'Available' },
    { make: 'Mercedes',    model: 'Sprinter',   plate: 'VAN-02',  maxKg: 2500,  status: 'On Trip'   },
    { make: 'Toyota',      model: 'HiAce',      plate: 'VAN-03',  maxKg: 1800,  status: 'Available' },
    { make: 'Renault',     model: 'Master',     plate: 'VAN-04',  maxKg: 2200,  status: 'Available' },
    { make: 'Iveco',       model: 'Daily 50',   plate: 'VAN-05',  maxKg: 3000,  status: 'Available' },
  ];

  const vehicles: any[] = [];
  for (const v of vehicleData) {
    const veh = await prisma.vehicle.create({ 
      data: {
        make: v.make,
        model: v.model,
        licensePlate: v.plate,
        maxCapacityKg: v.maxKg,
        status: v.status
      } 
    });
    vehicles.push(veh);
  }

  // ==================== TRIPS (with destinations) ====================
  const now = new Date();
  const daysAgo = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };
  const hoursAgo = (n: number) => { const d = new Date(now); d.setHours(d.getHours() - n); return d; };

  const tripData = [
    // Completed trips (historical)
    { vehicle: 1, driver: 1, cargo: 12000, status: 'Completed', risk: 32, dest: DESTINATIONS[0], start: daysAgo(14), end: daysAgo(13) },
    { vehicle: 2, driver: 2, cargo: 8000,  status: 'Completed', risk: 28, dest: DESTINATIONS[1], start: daysAgo(10), end: daysAgo(9)  },
    { vehicle: 4, driver: 5, cargo: 15000, status: 'Completed', risk: 55, dest: DESTINATIONS[2], start: daysAgo(7),  end: daysAgo(6)  },
    { vehicle: 6, driver: 7, cargo: 5000,  status: 'Completed', risk: 18, dest: DESTINATIONS[3], start: daysAgo(5),  end: daysAgo(4)  },
    { vehicle: 8, driver: 9, cargo: 18000, status: 'Completed', risk: 72, dest: DESTINATIONS[4], start: daysAgo(3),  end: daysAgo(2)  },
    { vehicle: 9, driver: 10, cargo: 9000, status: 'Completed', risk: 41, dest: DESTINATIONS[5], start: daysAgo(2),  end: daysAgo(1)  },
    { vehicle: 1, driver: 2, cargo: 11000, status: 'Completed', risk: 35, dest: DESTINATIONS[7], start: daysAgo(1),  end: hoursAgo(6) },
    // Active trips (On Trip - links to vehicles with On Trip status)
    { vehicle: 3, driver: 3, cargo: 14000, status: 'Dispatched', risk: 48, dest: DESTINATIONS[6], start: hoursAgo(8), end: null },
    { vehicle: 7, driver: 5, cargo: 9500,  status: 'Dispatched', risk: 33, dest: DESTINATIONS[8], start: hoursAgo(3), end: null },
    { vehicle: 12, driver: 8, cargo: 2000, status: 'Dispatched', risk: 22, dest: DESTINATIONS[9], start: hoursAgo(1), end: null },
    // Draft trips
    { vehicle: 4, driver: 9, cargo: 7500,  status: 'Draft', risk: 29, dest: DESTINATIONS[2], start: null, end: null },
    { vehicle: 6, driver: 10, cargo: 4000, status: 'Draft', risk: 15, dest: DESTINATIONS[3], start: null, end: null },
  ];

  const trips: any[] = [];
  for (const t of tripData) {
    const trip = await prisma.trip.create({
      data: {
        vehicleId: vehicles[t.vehicle - 1].id,
        driverId: driverIds[t.driver - 1],
        cargoWeightKg: t.cargo,
        status: t.status,
        riskScore: t.risk,
        startDate: t.start,
        endDate: t.end,
        destination: t.dest.name,
        distanceKm: t.dest.distanceKm,
        originLat: t.dest.originLat,
        originLon: t.dest.originLon,
        destLat: t.dest.lat,
        destLon: t.dest.lon,
      }
    });
    trips.push(trip);
  }

  // ==================== MAINTENANCE LOGS ====================
  const maintenanceData = [
    { vehicleIdx: 5,  category: 'Engine Repair',   cost: 4500, daysAgo: 2,   desc: 'Engine overhaul — cylinder head gasket replaced' },
    { vehicleIdx: 10, category: 'Transmission',     cost: 3200, daysAgo: 4,   desc: 'Gearbox synchronizer replaced, fluid flush' },
    { vehicleIdx: 1,  category: 'Oil Change',       cost: 250,  daysAgo: 7,   desc: 'Full synthetic 15W-40 engine oil, 12L' },
    { vehicleIdx: 3,  category: 'Brake Service',    cost: 1800, daysAgo: 8,   desc: 'Front and rear brake pads + rotors replaced' },
    { vehicleIdx: 7,  category: 'Tire Replacement', cost: 2400, daysAgo: 10,  desc: '4x Michelin X Line Energy Z 315/70 R22.5' },
    { vehicleIdx: 2,  category: 'Electrical',       cost: 890,  daysAgo: 12,  desc: 'Alternator replacement and battery terminal service' },
    { vehicleIdx: 6,  category: 'AC/Heating',       cost: 1200, daysAgo: 15,  desc: 'Cabin HVAC compressor recharge and filter' },
    { vehicleIdx: 4,  category: 'Oil Change',       cost: 310,  daysAgo: 20,  desc: 'Engine oil + coolant top-up service' },
    { vehicleIdx: 8,  category: 'Fuel System',      cost: 650,  daysAgo: 22,  desc: 'Fuel injector cleaning and filter replacement' },
    { vehicleIdx: 9,  category: 'Body Work',        cost: 2100, daysAgo: 25,  desc: 'Front bumper repair after dock collision' },
    { vehicleIdx: 5,  category: 'Annual Inspection',cost: 500,  daysAgo: 30,  desc: 'National permit renewal inspection — all systems pass' },
    { vehicleIdx: 11, category: 'Brake Service',    cost: 850,  daysAgo: 35,  desc: 'Brake fluid flush and pad replacement VAN-01' },
    { vehicleIdx: 12, category: 'Oil Change',       cost: 180,  daysAgo: 40,  desc: 'Full service oil + air filter VAN-02' },
    { vehicleIdx: 10, category: 'Engine Repair',    cost: 6800, daysAgo: 45,  desc: 'Complete engine rebuild after overheating incident' },
    { vehicleIdx: 3,  category: 'Tire Replacement', cost: 1600, daysAgo: 60,  desc: '2x rear tires replaced — worn below 3mm tread' },
  ];

  for (const m of maintenanceData) {
    const d = new Date(now); d.setDate(d.getDate() - m.daysAgo);
    await prisma.maintenanceLog.create({
      data: {
        vehicleId: vehicles[m.vehicleIdx - 1].id,
        description: `${m.category}: ${m.desc}`,
        cost: m.cost,
        date: d,
      }
    });
  }

  // ==================== FUEL EXPENSE LOGS ====================
  const fuelVehicles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // vehicle indices (0-based)
  for (const vIdx of fuelVehicles) {
    for (let month = 5; month >= 0; month--) {
      const d = new Date(now); d.setMonth(d.getMonth() - month);
      const baseCost = 85 + Math.random() * 15; // ₹85-100 per litre
      const liters = 200 + Math.random() * 200;  // 200-400 L per month
      await prisma.fuelExpenseLog.create({
        data: {
          vehicleId: vehicles[vIdx].id,
          amountLiters: Math.round(liters),
          cost: Math.round(liters * baseCost),
          date: d,
        }
      });
    }
  }

  // ==================== AUDIT LOGS ====================
  const auditData = [
    { type: 'TripDispatched',  entity: 'Trip',    id: 1,  detail: 'TRK-001 dispatched to Chennai Port Terminal, 12000kg, Risk:32',           actor: 'Alice Manager' },
    { type: 'TripDispatched',  entity: 'Trip',    id: 2,  detail: 'TRK-002 dispatched to Bangalore City Depot, 8000kg, Risk:28',              actor: 'Alice Manager' },
    { type: 'TripCompleted',   entity: 'Trip',    id: 1,  detail: 'Trip to Chennai Port Terminal completed. Duration: 26h, 346km',             actor: 'Rajesh Kumar'  },
    { type: 'TripCompleted',   entity: 'Trip',    id: 2,  detail: 'Trip to Bangalore City Depot completed. Duration: 28h, 568km',              actor: 'Priya Sharma'  },
    { type: 'TripDispatched',  entity: 'Trip',    id: 3,  detail: 'TRK-003 dispatched via AI Copilot to Kolkata Netaji Port, 14000kg, Risk:48', actor: 'copilot'      },
    { type: 'MaintenanceLogged', entity: 'Vehicle', id: 5, detail: 'TRK-005 BharatBenz 4028: Engine Repair — cylinder head gasket. Cost: ₹4500',  actor: 'Sam Safety'   },
    { type: 'DriverSuspended', entity: 'Driver',  id: 4,  detail: 'Anita Desai suspended — license DL-AD004 expired 5 days ago (auto-suspend)', actor: 'System'       },
    { type: 'DriverSuspended', entity: 'Driver',  id: 6,  detail: 'Lakshmi Nair suspended — license DL-LN006 expired 30 days ago (auto-suspend)', actor: 'System'     },
    { type: 'ComplianceCheck', entity: 'Driver',  id: 0,  detail: 'Scheduled compliance check: 2 expired licenses detected, auto-suspended',    actor: 'pg_cron'      },
    { type: 'TripDispatched',  entity: 'Trip',    id: 7,  detail: 'VAN-02 dispatched to Surat Diamond Exchange, 2000kg, Risk:22',               actor: 'Alice Manager' },
    { type: 'MaintenanceLogged', entity: 'Vehicle', id: 10, detail: 'TRK-010 MAN TGX: Transmission repair — gearbox synchronizer. Cost: ₹3200', actor: 'Sam Safety'  },
    { type: 'TripDispatched',  entity: 'Trip',    id: 4,  detail: 'TRK-004 dispatched to Mumbai JNPT Gateway, 15000kg, Risk:55',                actor: 'Alice Manager' },
    { type: 'TripCompleted',   entity: 'Trip',    id: 3,  detail: 'Trip to Mumbai JNPT Gateway completed. Duration: 22h, 149km',                actor: 'Vikram Singh'  },
    { type: 'MaintenanceLogged', entity: 'Vehicle', id: 3, detail: 'TRK-003 Tata Prima: Brake Service — front and rear pads + rotors. Cost: ₹1800', actor: 'Sam Safety' },
    { type: 'ComplianceCheck', entity: 'Driver',  id: 0,  detail: 'Mohammed Ali (DL-MA003) license expiring in 10 days — notification sent',    actor: 'pg_cron'      },
  ];

  const tripIds = trips.map(t => t.id);
  for (const a of auditData) {
    const entityId = a.entity === 'Trip' && a.id > 0 && a.id <= tripIds.length ? tripIds[a.id - 1] : a.id;
    const daysAgoVal = Math.floor(Math.random() * 14);
    const d = new Date(now); d.setDate(d.getDate() - daysAgoVal);
    await prisma.auditLog.create({
      data: { eventType: a.type, entityType: a.entity, entityId, detail: a.detail, actor: a.actor, createdAt: d }
    });
  }

  // Set Driver 1 as "On Trip" to match their active trip
  const driver3 = await prisma.driver.findFirst({ where: { licenseNumber: 'DL-MA003' } });
  if (driver3) await prisma.driver.update({ where: { id: driver3.id }, data: { status: 'On Trip' } });
  const driver5 = await prisma.driver.findFirst({ where: { licenseNumber: 'DL-VS005' } });
  if (driver5) await prisma.driver.update({ where: { id: driver5.id }, data: { status: 'On Trip' } });
  const driver8 = await prisma.driver.findFirst({ where: { licenseNumber: 'DL-MI008' } });
  if (driver8) await prisma.driver.update({ where: { id: driver8.id }, data: { status: 'On Trip' } });

  // Ensure PostGIS extension and column exists (in case db push wiped it)
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS postgis`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "lastLocation" geometry(Point, 4326)`);

  // Update vehicle lastLocation using PostGIS for map visualization
  await prisma.$executeRaw`
    UPDATE "Vehicle" SET "lastLocation" = ST_SetSRID(ST_MakePoint(80.2707, 13.0827), 4326) WHERE "licensePlate" = 'TRK-001'
  `;
  await prisma.$executeRaw`
    UPDATE "Vehicle" SET "lastLocation" = ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326) WHERE "licensePlate" = 'TRK-002'
  `;
  await prisma.$executeRaw`
    UPDATE "Vehicle" SET "lastLocation" = ST_SetSRID(ST_MakePoint(80.5000, 14.0000), 4326) WHERE "licensePlate" = 'TRK-003'
  `;
  await prisma.$executeRaw`
    UPDATE "Vehicle" SET "lastLocation" = ST_SetSRID(ST_MakePoint(78.4867, 17.3850), 4326) WHERE "licensePlate" = 'TRK-004'
  `;
  await prisma.$executeRaw`
    UPDATE "Vehicle" SET "lastLocation" = ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326) WHERE "licensePlate" = 'TRK-005'
  `;
  await prisma.$executeRaw`
    UPDATE "Vehicle" SET "lastLocation" = ST_SetSRID(ST_MakePoint(77.1025, 28.7041), 4326) WHERE "licensePlate" = 'TRK-006'
  `;
  await prisma.$executeRaw`
    UPDATE "Vehicle" SET "lastLocation" = ST_SetSRID(ST_MakePoint(76.9558, 12.0000), 4326) WHERE "licensePlate" = 'TRK-007'
  `;
  await prisma.$executeRaw`
    UPDATE "Vehicle" SET "lastLocation" = ST_SetSRID(ST_MakePoint(72.8311, 21.1702), 4326) WHERE "licensePlate" = 'TRK-008'
  `;
  await prisma.$executeRaw`
    UPDATE "Vehicle" SET "lastLocation" = ST_SetSRID(ST_MakePoint(75.7873, 26.9124), 4326) WHERE "licensePlate" = 'TRK-009'
  `;
  await prisma.$executeRaw`
    UPDATE "Vehicle" SET "lastLocation" = ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326) WHERE "licensePlate" = 'TRK-010'
  `;
  await prisma.$executeRaw`
    UPDATE "Vehicle" SET "lastLocation" = ST_SetSRID(ST_MakePoint(72.8200, 18.9700), 4326) WHERE "licensePlate" = 'VAN-02'
  `;

  console.log('✅ Rich demo seed complete!');
  console.log(`  • ${vehicleData.length} vehicles`);
  console.log(`  • ${driverData.length} drivers (2 suspended, 2 expiring soon, 3 on trip)`);
  console.log(`  • ${tripData.length} trips (7 completed, 3 active, 2 draft)`);
  console.log(`  • ${maintenanceData.length} maintenance logs`);
  console.log(`  • ${fuelVehicles.length * 6} fuel expense records`);
  console.log(`  • ${auditData.length} audit log entries`);
}

// Allow running directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n🌱 Database seeded successfully for demo!');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

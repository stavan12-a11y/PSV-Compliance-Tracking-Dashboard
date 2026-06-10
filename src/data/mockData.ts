import type {
  AppData,
  Equipment,
  Location,
  PSV,
  PSVDatasheet,
  PSVEvent,
  PSVStatus,
} from '../types';

// ---------------------------------------------------------------------------
// Seed data for the dashboard. This is placeholder data modelled on the kind of
// equipment a campus Utilities & Energy Services group operates. Replace the
// arrays below (or import real data into the store) when real data is available.
// ---------------------------------------------------------------------------

let evtCounter = 0;
const eid = () => `evt-seed-${++evtCounter}`;
const isoDateTime = (date: string) => `${date}T09:00:00.000Z`;

const STATUS_DESCRIPTION: Record<PSVStatus, string> = {
  installed: 'Installed in service',
  out_for_service: 'Removed — sent out for service / recertification',
  inventory: 'Placed in inventory (spare)',
};

interface TimelineEntry {
  date: string;
  status: PSVStatus;
  note?: string;
}

const DEFAULT_DATASHEET: PSVDatasheet = {
  make: 'Consolidated',
  model: '1900-30',
  type: 'Conventional Spring',
  setPressure: 150,
  pressureUnit: 'PSIG',
  capacity: '12,500 lb/hr',
  inletSize: '2"',
  outletSize: '3"',
  orifice: 'J',
  bodyMaterial: 'Carbon Steel (WCB)',
  springMaterial: 'Tungsten Alloy Steel',
  connectionType: 'Flanged (RF)',
  coldDifferentialTestPressure: '150 PSIG',
  serviceMedium: 'Saturated Steam',
  nationalBoardNumber: 'NB-22184',
  manufactureYear: '2019',
};

function ds(partial: Partial<PSVDatasheet>): PSVDatasheet {
  return { ...DEFAULT_DATASHEET, ...partial };
}

function buildValve(args: {
  id: string;
  sn: string;
  tag: string;
  locationId: string;
  datasheet: PSVDatasheet;
  createdAt: string;
  timeline: TimelineEntry[];
}): PSV {
  const events: PSVEvent[] = [
    {
      id: eid(),
      psvId: args.id,
      type: 'created',
      date: args.createdAt,
      description: `PSV ${args.sn} added to the tracking system`,
      recordedAt: isoDateTime(args.createdAt),
    },
  ];

  for (const t of args.timeline) {
    events.push({
      id: eid(),
      psvId: args.id,
      type: 'status-change',
      status: t.status,
      date: t.date,
      description: STATUS_DESCRIPTION[t.status],
      note: t.note,
      recordedAt: isoDateTime(t.date),
    });
  }

  const status: PSVStatus = args.timeline.length
    ? args.timeline[args.timeline.length - 1].status
    : 'inventory';

  return {
    id: args.id,
    serialNumber: args.sn,
    tag: args.tag,
    locationId: args.locationId,
    status,
    datasheet: args.datasheet,
    events,
    createdAt: isoDateTime(args.createdAt),
  };
}

// --- Equipment -------------------------------------------------------------

const equipment: Equipment[] = [
  {
    id: 'eq-blr1',
    name: 'Boiler #1',
    tag: 'BLR-001',
    type: 'Watertube Boiler',
    area: 'Central Utility Plant',
    description: '250,000 lb/hr high-pressure steam boiler serving the campus loop.',
  },
  {
    id: 'eq-blr2',
    name: 'Boiler #2',
    tag: 'BLR-002',
    type: 'Watertube Boiler',
    area: 'Central Utility Plant',
    description: '250,000 lb/hr high-pressure steam boiler (lead/lag with Boiler #1).',
  },
  {
    id: 'eq-chl3',
    name: 'Chiller #3',
    tag: 'CHL-003',
    type: 'Centrifugal Chiller',
    area: 'Central Utility Plant',
    description: '3,000-ton electric centrifugal chiller on the chilled water loop.',
  },
  {
    id: 'eq-da101',
    name: 'Deaerator',
    tag: 'DA-101',
    type: 'Spray-Tray Deaerator',
    area: 'Central Utility Plant',
    description: 'Feedwater deaerator and storage tank for boiler makeup water.',
  },
  {
    id: 'eq-prv200',
    name: 'Steam PRV Station',
    tag: 'PRV-200',
    type: 'Pressure Reducing Station',
    area: 'West Campus Satellite Utility Plant',
    description: 'High-to-medium pressure steam reducing station with downstream relief.',
  },
  {
    id: 'eq-ac410',
    name: 'Air Compressor A',
    tag: 'AC-410',
    type: 'Rotary Screw Compressor',
    area: 'Central Utility Plant',
    description: 'Plant/instrument air compressor with receiver tank.',
  },
];

// --- Locations -------------------------------------------------------------

const locations: Location[] = [
  // Boiler #1
  { id: 'loc-blr1-drum', equipmentId: 'eq-blr1', name: 'Steam Drum Relief', tag: 'BLR-001-PSV-A', description: 'Primary drum safety valve.' },
  { id: 'loc-blr1-sh', equipmentId: 'eq-blr1', name: 'Superheater Outlet Relief', tag: 'BLR-001-PSV-B', description: 'Superheater outlet protection.' },
  { id: 'loc-blr1-econ', equipmentId: 'eq-blr1', name: 'Economizer Inlet Relief', tag: 'BLR-001-PSV-C', description: 'Economizer overpressure protection.' },
  // Boiler #2
  { id: 'loc-blr2-drum', equipmentId: 'eq-blr2', name: 'Steam Drum Relief', tag: 'BLR-002-PSV-A', description: 'Primary drum safety valve.' },
  { id: 'loc-blr2-sh', equipmentId: 'eq-blr2', name: 'Superheater Outlet Relief', tag: 'BLR-002-PSV-B', description: 'Superheater outlet protection.' },
  // Chiller #3
  { id: 'loc-chl3-high', equipmentId: 'eq-chl3', name: 'Refrigerant High-Side Relief', tag: 'CHL-003-PSV-A', description: 'High-side refrigerant relief.' },
  { id: 'loc-chl3-evap', equipmentId: 'eq-chl3', name: 'Evaporator Relief', tag: 'CHL-003-PSV-B', description: 'Evaporator vessel relief.' },
  // Deaerator
  { id: 'loc-da101-tank', equipmentId: 'eq-da101', name: 'Storage Tank Relief', tag: 'DA-101-PSV-A', description: 'Deaerator storage tank relief.' },
  // PRV Station
  { id: 'loc-prv200-mp', equipmentId: 'eq-prv200', name: 'Medium-Pressure Header Relief', tag: 'PRV-200-PSV-A', description: 'Downstream MP header relief.' },
  { id: 'loc-prv200-lp', equipmentId: 'eq-prv200', name: 'Low-Pressure Header Relief', tag: 'PRV-200-PSV-B', description: 'Low-pressure header relief.' },
  // Air Compressor A
  { id: 'loc-ac410-rcvr', equipmentId: 'eq-ac410', name: 'Receiver Tank Relief', tag: 'AC-410-PSV-A', description: 'Air receiver tank relief.' },
];

// --- PSVs ------------------------------------------------------------------
// Each location has an installed valve + a spare so the device can be swapped
// during recertification. Install dates are spread to exercise compliance math.

const psvs: PSV[] = [
  // --- Boiler #1 / Steam Drum (OVERDUE installed valve) --------------------
  buildValve({
    id: 'psv-1001', sn: 'CV-1001', tag: 'BLR-001-PSV-A', locationId: 'loc-blr1-drum',
    datasheet: ds({ make: 'Consolidated', model: '1900-30JM', setPressure: 650, capacity: '185,000 lb/hr', orifice: 'M', inletSize: '4"', outletSize: '6"', serviceMedium: 'Saturated Steam', manufactureYear: '2018', nationalBoardNumber: 'NB-19842' }),
    createdAt: '2018-05-01',
    timeline: [
      { date: '2018-06-12', status: 'installed' },
      { date: '2022-09-20', status: 'out_for_service', note: '3-year recert cycle' },
      { date: '2022-10-05', status: 'inventory', note: 'Returned from recert, held as spare' },
    ],
  }),
  buildValve({
    id: 'psv-1002', sn: 'CV-1002', tag: 'BLR-001-PSV-A', locationId: 'loc-blr1-drum',
    datasheet: ds({ make: 'Consolidated', model: '1900-30JM', setPressure: 650, capacity: '185,000 lb/hr', orifice: 'M', inletSize: '4"', outletSize: '6"', serviceMedium: 'Saturated Steam', manufactureYear: '2018', nationalBoardNumber: 'NB-19843' }),
    createdAt: '2018-05-01',
    timeline: [
      { date: '2022-10-05', status: 'installed', note: 'Swapped in for recert of CV-1001' },
    ],
  }),

  // --- Boiler #1 / Superheater (DUE SOON) ----------------------------------
  buildValve({
    id: 'psv-1010', sn: 'CV-1010', tag: 'BLR-001-PSV-B', locationId: 'loc-blr1-sh',
    datasheet: ds({ make: 'Crosby', model: 'HCI-2', setPressure: 600, capacity: '120,000 lb/hr', orifice: 'L', inletSize: '3"', outletSize: '4"', serviceMedium: 'Superheated Steam', manufactureYear: '2020', nationalBoardNumber: 'NB-20551' }),
    createdAt: '2020-03-10',
    timeline: [
      { date: '2023-07-01', status: 'installed' },
    ],
  }),
  buildValve({
    id: 'psv-1011', sn: 'CV-1011', tag: 'BLR-001-PSV-B', locationId: 'loc-blr1-sh',
    datasheet: ds({ make: 'Crosby', model: 'HCI-2', setPressure: 600, capacity: '120,000 lb/hr', orifice: 'L', inletSize: '3"', outletSize: '4"', serviceMedium: 'Superheated Steam', manufactureYear: '2020', nationalBoardNumber: 'NB-20552' }),
    createdAt: '2020-03-10',
    timeline: [
      { date: '2023-06-20', status: 'out_for_service', note: 'At vendor for recertification' },
    ],
  }),

  // --- Boiler #1 / Economizer (COMPLIANT) ----------------------------------
  buildValve({
    id: 'psv-1020', sn: 'CV-1020', tag: 'BLR-001-PSV-C', locationId: 'loc-blr1-econ',
    datasheet: ds({ make: 'Kunkle', model: '6010', setPressure: 700, capacity: '95,000 lb/hr', orifice: 'K', inletSize: '2.5"', outletSize: '4"', serviceMedium: 'Feedwater', manufactureYear: '2021' }),
    createdAt: '2021-08-01',
    timeline: [
      { date: '2024-09-10', status: 'installed' },
    ],
  }),
  buildValve({
    id: 'psv-1021', sn: 'CV-1021', tag: 'BLR-001-PSV-C', locationId: 'loc-blr1-econ',
    datasheet: ds({ make: 'Kunkle', model: '6010', setPressure: 700, capacity: '95,000 lb/hr', orifice: 'K', inletSize: '2.5"', outletSize: '4"', serviceMedium: 'Feedwater', manufactureYear: '2021' }),
    createdAt: '2021-08-01',
    timeline: [
      { date: '2024-09-10', status: 'inventory', note: 'Shelf spare' },
    ],
  }),

  // --- Boiler #2 / Steam Drum (OVERDUE) ------------------------------------
  buildValve({
    id: 'psv-2001', sn: 'CV-2001', tag: 'BLR-002-PSV-A', locationId: 'loc-blr2-drum',
    datasheet: ds({ make: 'Consolidated', model: '1900-30JM', setPressure: 650, capacity: '185,000 lb/hr', orifice: 'M', inletSize: '4"', outletSize: '6"', serviceMedium: 'Saturated Steam', manufactureYear: '2018' }),
    createdAt: '2018-05-01',
    timeline: [
      { date: '2023-02-15', status: 'installed' },
    ],
  }),
  buildValve({
    id: 'psv-2002', sn: 'CV-2002', tag: 'BLR-002-PSV-A', locationId: 'loc-blr2-drum',
    datasheet: ds({ make: 'Consolidated', model: '1900-30JM', setPressure: 650, capacity: '185,000 lb/hr', orifice: 'M', inletSize: '4"', outletSize: '6"', serviceMedium: 'Saturated Steam', manufactureYear: '2018' }),
    createdAt: '2018-05-01',
    timeline: [
      { date: '2023-02-15', status: 'inventory', note: 'Shelf spare' },
    ],
  }),

  // --- Boiler #2 / Superheater (COMPLIANT) ---------------------------------
  buildValve({
    id: 'psv-2010', sn: 'CV-2010', tag: 'BLR-002-PSV-B', locationId: 'loc-blr2-sh',
    datasheet: ds({ make: 'Crosby', model: 'HCI-2', setPressure: 600, capacity: '120,000 lb/hr', orifice: 'L', inletSize: '3"', outletSize: '4"', serviceMedium: 'Superheated Steam', manufactureYear: '2022' }),
    createdAt: '2022-01-15',
    timeline: [
      { date: '2025-02-20', status: 'installed' },
    ],
  }),
  buildValve({
    id: 'psv-2011', sn: 'CV-2011', tag: 'BLR-002-PSV-B', locationId: 'loc-blr2-sh',
    datasheet: ds({ make: 'Crosby', model: 'HCI-2', setPressure: 600, capacity: '120,000 lb/hr', orifice: 'L', inletSize: '3"', outletSize: '4"', serviceMedium: 'Superheated Steam', manufactureYear: '2022' }),
    createdAt: '2022-01-15',
    timeline: [
      { date: '2025-02-20', status: 'out_for_service', note: 'Routine recert at vendor' },
    ],
  }),

  // --- Chiller #3 / High-Side (COMPLIANT) ----------------------------------
  buildValve({
    id: 'psv-3001', sn: 'RV-3001', tag: 'CHL-003-PSV-A', locationId: 'loc-chl3-high',
    datasheet: ds({ make: 'Henry', model: '5231', type: 'Conventional Spring', setPressure: 185, pressureUnit: 'PSIG', capacity: '420 lb/min', orifice: 'D', inletSize: '1"', outletSize: '1.5"', serviceMedium: 'R-134a Refrigerant', bodyMaterial: 'Bronze', manufactureYear: '2023' }),
    createdAt: '2023-04-01',
    timeline: [
      { date: '2024-05-15', status: 'installed' },
    ],
  }),
  buildValve({
    id: 'psv-3002', sn: 'RV-3002', tag: 'CHL-003-PSV-A', locationId: 'loc-chl3-high',
    datasheet: ds({ make: 'Henry', model: '5231', type: 'Conventional Spring', setPressure: 185, pressureUnit: 'PSIG', capacity: '420 lb/min', orifice: 'D', inletSize: '1"', outletSize: '1.5"', serviceMedium: 'R-134a Refrigerant', bodyMaterial: 'Bronze', manufactureYear: '2023' }),
    createdAt: '2023-04-01',
    timeline: [
      { date: '2024-05-15', status: 'inventory', note: 'Shelf spare' },
    ],
  }),

  // --- Chiller #3 / Evaporator (DUE SOON) ----------------------------------
  buildValve({
    id: 'psv-3010', sn: 'RV-3010', tag: 'CHL-003-PSV-B', locationId: 'loc-chl3-evap',
    datasheet: ds({ make: 'Henry', model: '5232', type: 'Conventional Spring', setPressure: 200, pressureUnit: 'PSIG', capacity: '510 lb/min', orifice: 'E', inletSize: '1.25"', outletSize: '2"', serviceMedium: 'R-134a Refrigerant', bodyMaterial: 'Bronze', manufactureYear: '2020' }),
    createdAt: '2020-06-01',
    timeline: [
      { date: '2023-08-25', status: 'installed' },
    ],
  }),
  buildValve({
    id: 'psv-3011', sn: 'RV-3011', tag: 'CHL-003-PSV-B', locationId: 'loc-chl3-evap',
    datasheet: ds({ make: 'Henry', model: '5232', type: 'Conventional Spring', setPressure: 200, pressureUnit: 'PSIG', capacity: '510 lb/min', orifice: 'E', inletSize: '1.25"', outletSize: '2"', serviceMedium: 'R-134a Refrigerant', bodyMaterial: 'Bronze', manufactureYear: '2020' }),
    createdAt: '2020-06-01',
    timeline: [
      { date: '2023-08-10', status: 'inventory', note: 'Shelf spare' },
    ],
  }),

  // --- Deaerator / Storage Tank (COMPLIANT) --------------------------------
  buildValve({
    id: 'psv-4001', sn: 'SV-4001', tag: 'DA-101-PSV-A', locationId: 'loc-da101-tank',
    datasheet: ds({ make: 'Kunkle', model: '912', setPressure: 75, capacity: '45,000 lb/hr', orifice: 'H', inletSize: '3"', outletSize: '4"', serviceMedium: 'Saturated Steam', manufactureYear: '2022' }),
    createdAt: '2022-09-01',
    timeline: [
      { date: '2024-11-05', status: 'installed' },
    ],
  }),
  buildValve({
    id: 'psv-4002', sn: 'SV-4002', tag: 'DA-101-PSV-A', locationId: 'loc-da101-tank',
    datasheet: ds({ make: 'Kunkle', model: '912', setPressure: 75, capacity: '45,000 lb/hr', orifice: 'H', inletSize: '3"', outletSize: '4"', serviceMedium: 'Saturated Steam', manufactureYear: '2022' }),
    createdAt: '2022-09-01',
    timeline: [
      { date: '2024-11-05', status: 'inventory', note: 'Shelf spare' },
    ],
  }),

  // --- PRV Station / MP Header (OVERDUE) -----------------------------------
  buildValve({
    id: 'psv-5001', sn: 'SV-5001', tag: 'PRV-200-PSV-A', locationId: 'loc-prv200-mp',
    datasheet: ds({ make: 'Farris', model: '2600', setPressure: 125, capacity: '60,000 lb/hr', orifice: 'J', inletSize: '3"', outletSize: '4"', serviceMedium: 'Saturated Steam', manufactureYear: '2019' }),
    createdAt: '2019-10-01',
    timeline: [
      { date: '2022-11-15', status: 'installed' },
    ],
  }),
  buildValve({
    id: 'psv-5002', sn: 'SV-5002', tag: 'PRV-200-PSV-A', locationId: 'loc-prv200-mp',
    datasheet: ds({ make: 'Farris', model: '2600', setPressure: 125, capacity: '60,000 lb/hr', orifice: 'J', inletSize: '3"', outletSize: '4"', serviceMedium: 'Saturated Steam', manufactureYear: '2019' }),
    createdAt: '2019-10-01',
    timeline: [
      { date: '2022-11-15', status: 'out_for_service', note: 'Held at vendor — needs reinstall' },
    ],
  }),

  // --- PRV Station / LP Header (COMPLIANT) ---------------------------------
  buildValve({
    id: 'psv-5010', sn: 'SV-5010', tag: 'PRV-200-PSV-B', locationId: 'loc-prv200-lp',
    datasheet: ds({ make: 'Farris', model: '2700', setPressure: 50, capacity: '40,000 lb/hr', orifice: 'H', inletSize: '2.5"', outletSize: '4"', serviceMedium: 'Saturated Steam', manufactureYear: '2023' }),
    createdAt: '2023-05-01',
    timeline: [
      { date: '2025-01-12', status: 'installed' },
    ],
  }),
  buildValve({
    id: 'psv-5011', sn: 'SV-5011', tag: 'PRV-200-PSV-B', locationId: 'loc-prv200-lp',
    datasheet: ds({ make: 'Farris', model: '2700', setPressure: 50, capacity: '40,000 lb/hr', orifice: 'H', inletSize: '2.5"', outletSize: '4"', serviceMedium: 'Saturated Steam', manufactureYear: '2023' }),
    createdAt: '2023-05-01',
    timeline: [
      { date: '2025-01-12', status: 'inventory', note: 'Shelf spare' },
    ],
  }),

  // --- Air Compressor A / Receiver (COMPLIANT) -----------------------------
  buildValve({
    id: 'psv-6001', sn: 'SV-6001', tag: 'AC-410-PSV-A', locationId: 'loc-ac410-rcvr',
    datasheet: ds({ make: 'Kunkle', model: '6021', setPressure: 150, capacity: '3,200 SCFM', orifice: 'F', inletSize: '1.5"', outletSize: '2"', serviceMedium: 'Compressed Air', bodyMaterial: 'Carbon Steel', manufactureYear: '2024' }),
    createdAt: '2024-02-01',
    timeline: [
      { date: '2024-06-18', status: 'installed' },
    ],
  }),
  buildValve({
    id: 'psv-6002', sn: 'SV-6002', tag: 'AC-410-PSV-A', locationId: 'loc-ac410-rcvr',
    datasheet: ds({ make: 'Kunkle', model: '6021', setPressure: 150, capacity: '3,200 SCFM', orifice: 'F', inletSize: '1.5"', outletSize: '2"', serviceMedium: 'Compressed Air', bodyMaterial: 'Carbon Steel', manufactureYear: '2024' }),
    createdAt: '2024-02-01',
    timeline: [
      { date: '2024-06-18', status: 'inventory', note: 'Shelf spare' },
    ],
  }),
];

export const seedData: AppData = { equipment, locations, psvs };

const RECERT_INTERVAL_YEARS = 3;
const DUE_SOON_DAYS = 90;

const STATUS_LABELS = {
  installed: 'Installed',
  out_for_service: 'Out for Service',
  inventory: 'In Inventory',
};

const COMPLIANCE_LABELS = {
  compliant: 'Compliant',
  due_soon: 'Due Soon',
  overdue: 'Overdue',
  not_installed: 'Not Installed',
};

const EVENT_TYPE_LABELS = {
  created: 'Created',
  'status-change': 'Status Change',
  service: 'Service',
  'datasheet-update': 'Datasheet Update',
  'history-edit': 'History Edit',
  note: 'Note',
  replacement: 'Replacement',
};

function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseISODate(iso) {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, day ?? 1);
}

function addYears(iso, years) {
  const d = parseISODate(iso);
  d.setFullYear(d.getFullYear() + years);
  return toISODate(d);
}

function toISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysBetween(a, b) {
  const ms = parseISODate(b).getTime() - parseISODate(a).getTime();
  return Math.round(ms / 86_400_000);
}

function formatDate(iso) {
  if (!iso) return '—';
  return parseISODate(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(isoDateTime) {
  return new Date(isoDateTime).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function lastInstallDate(psv) {
  const installs = psv.events
    .filter((e) => e.type === 'status-change' && e.status === 'installed')
    .map((e) => e.date)
    .sort();
  return installs.length ? installs[installs.length - 1] : null;
}

function lastServiceDate(psv) {
  const services = psv.events
    .filter((e) => e.type === 'service')
    .map((e) => e.date)
    .sort();
  return services.length ? services[services.length - 1] : null;
}

function lastReplacementDate(psv) {
  const replacements = psv.events
    .filter((e) => e.type === 'replacement')
    .map((e) => e.date)
    .sort();
  return replacements.length ? replacements[replacements.length - 1] : null;
}

function getCertDate(psv) {
  if (psv.useAndReplace) return lastReplacementDate(psv) ?? lastInstallDate(psv);
  if (psv.servicedOnSite) return lastServiceDate(psv) ?? lastInstallDate(psv);
  return lastInstallDate(psv);
}

function getCompliance(psv) {
  const installDate = lastInstallDate(psv);
  const certDate = getCertDate(psv);
  const active = psv.useAndReplace || psv.servicedOnSite || psv.status === 'installed';

  if (!active || !certDate) {
    return {
      state: 'not_installed',
      dueDate: null,
      daysRemaining: null,
      lastInstallDate: installDate,
    };
  }

  const dueDate = addYears(certDate, RECERT_INTERVAL_YEARS);
  const daysRemaining = daysBetween(todayISO(), dueDate);
  let state;
  if (daysRemaining < 0) state = 'overdue';
  else if (daysRemaining <= DUE_SOON_DAYS) state = 'due_soon';
  else state = 'compliant';

  return { state, dueDate, daysRemaining, lastInstallDate: installDate };
}

function resolveContext(psv, locById, eqById) {
  const loc = locById.get(psv.locationId);
  const eq = loc ? eqById.get(loc.equipmentId) : undefined;
  return { loc, eq };
}

function buildRegisterRow(psv, locById, eqById) {
  const ctx = resolveContext(psv, locById, eqById);
  const c = getCompliance(psv);
  return {
    'PSV ID': psv.id,
    Equipment: ctx.eq?.name ?? '',
    'Equipment Tag': ctx.eq?.tag ?? '',
    Area: ctx.eq?.area ?? '',
    Location: ctx.loc?.name ?? '',
    'Location Tag': ctx.loc?.tag ?? '',
    'Serial Number': psv.serialNumber,
    'Inventory ID': psv.inventoryId ?? '',
    'PSV Tag': psv.tag ?? '',
    Status: STATUS_LABELS[psv.status] ?? psv.status,
    'Serviced On Site': psv.servicedOnSite ? 'Yes' : 'No',
    'Use And Replace': psv.useAndReplace ? 'Yes' : 'No',
    'Created At': psv.createdAt ? formatDateTime(psv.createdAt) : '',
    Make: psv.datasheet?.make ?? '',
    Model: psv.datasheet?.model ?? '',
    'Set Pressure': psv.datasheet?.setPressure ?? '',
    'Pressure Unit': psv.datasheet?.pressureUnit ?? '',
    Capacity: psv.datasheet?.capacity ?? '',
    'Inlet Size': psv.datasheet?.inletSize ?? '',
    'Outlet Size': psv.datasheet?.outletSize ?? '',
    'Service Medium': psv.datasheet?.serviceMedium ?? '',
    'National Board No.': psv.datasheet?.nationalBoardNumber ?? '',
    'Last Install Date': formatDate(lastInstallDate(psv)),
    'Last Service Date': formatDate(lastServiceDate(psv)),
    'Last Replacement Date': formatDate(lastReplacementDate(psv)),
    'Due Date': c.dueDate ? formatDate(c.dueDate) : '',
    'Days Remaining': c.daysRemaining ?? '',
    Compliance: COMPLIANCE_LABELS[c.state] ?? c.state,
  };
}

const REGISTER_COLUMNS = [
  'PSV ID',
  'Equipment',
  'Equipment Tag',
  'Area',
  'Location',
  'Location Tag',
  'Serial Number',
  'Inventory ID',
  'PSV Tag',
  'Status',
  'Serviced On Site',
  'Use And Replace',
  'Created At',
  'Make',
  'Model',
  'Set Pressure',
  'Pressure Unit',
  'Capacity',
  'Inlet Size',
  'Outlet Size',
  'Service Medium',
  'National Board No.',
  'Last Install Date',
  'Last Service Date',
  'Last Replacement Date',
  'Due Date',
  'Days Remaining',
  'Compliance',
];

const HISTORY_COLUMNS = [
  'Event ID',
  'Equipment',
  'Equipment Tag',
  'Location',
  'Location Tag',
  'Serial Number',
  'Inventory ID',
  'PSV Tag',
  'Event Type',
  'Event Date',
  'Status',
  'Description',
  'Previous S/N',
  'New S/N',
  'Note',
  'Recorded At',
];

const REPAIR_COLUMNS = [
  'Record ID',
  'Equipment',
  'Equipment Tag',
  'Location',
  'Location Tag',
  'Serial Number',
  'Inventory ID',
  'PSV Tag',
  'Date',
  'Description',
  'Vendor',
  'Work Order',
  'Note',
  'Recorded At',
];

function rowsToSheet(XLSX, rows, columns) {
  const aoa = [
    [...columns],
    ...rows.map((row) => columns.map((col) => row[col] ?? '')),
  ];
  return XLSX.utils.aoa_to_sheet(aoa);
}

function appendSheet(wb, XLSX, name, rows, columns) {
  const ws =
    rows.length > 0
      ? rowsToSheet(XLSX, rows, columns)
      : XLSX.utils.aoa_to_sheet([['No records to report.']]);
  XLSX.utils.book_append_sheet(wb, ws, name);
}

function buildBackupInfoRows(data, generatedAt) {
  const psvs = data.psvs ?? [];
  const eventCount = psvs.reduce((n, p) => n + (p.events?.length ?? 0), 0);
  const repairCount = psvs.reduce((n, p) => n + (p.repairHistory?.length ?? 0), 0);

  return [
    ['PSV Tracking Dashboard — Monthly Backup'],
    ['Generated', formatDateTime(generatedAt)],
    [''],
    ['This email contains TWO files:'],
    ['1. Excel (.xlsx)', 'Human-readable reports — open in Excel or Google Sheets'],
    ['2. JSON (.json)', 'Complete lossless backup — re-import via Data → Import data in the dashboard'],
    [''],
    ['EXCEL WORKBOOK SHEETS'],
    ['Sheet', 'What it contains'],
    ['Backup Info', 'This summary (first tab)'],
    ['All PSVs', 'Every valve: datasheet, status, compliance dates, equipment/location'],
    ['Installed / Out for Service / Overdue / Upcoming Due', 'Filtered views of the register'],
    ['History Log', 'Every history entry: status changes, services, notes, datasheet edits — with Description AND Note columns'],
    ['Repair History', 'All repair/overhaul records with vendor, work order, description, and notes'],
    ['Equipment', 'All equipment: name, tag, type, area, description'],
    ['Locations', 'All locations: name, tag, description, parent equipment'],
    [''],
    ['COUNTS IN THIS BACKUP'],
    ['Equipment', data.equipment?.length ?? 0],
    ['Locations', data.locations?.length ?? 0],
    ['PSVs', psvs.length],
    ['History events', eventCount],
    ['Repair records', repairCount],
    [''],
    ['NOTES ARE INCLUDED in History Log (Note column) and Repair History (Note column).'],
    ['Location descriptions and equipment descriptions are on their respective sheets.'],
  ];
}

function buildBackupWorkbook(data, generatedAt = new Date().toISOString()) {
  const XLSX = require('xlsx');
  const psvs = data.psvs ?? [];
  const locById = new Map((data.locations ?? []).map((l) => [l.id, l]));
  const eqById = new Map((data.equipment ?? []).map((e) => [e.id, e]));
  const withCompliance = psvs.map((psv) => ({ psv, c: getCompliance(psv) }));

  const wb = XLSX.utils.book_new();

  const infoWs = XLSX.utils.aoa_to_sheet(buildBackupInfoRows(data, generatedAt));
  infoWs['!cols'] = [{ wch: 28 }, { wch: 72 }];
  XLSX.utils.book_append_sheet(wb, infoWs, 'Backup Info');

  appendSheet(
    wb,
    XLSX,
    'All PSVs',
    psvs.map((psv) => buildRegisterRow(psv, locById, eqById)),
    REGISTER_COLUMNS,
  );
  appendSheet(
    wb,
    XLSX,
    'Installed',
    psvs
      .filter((p) => p.status === 'installed')
      .map((psv) => buildRegisterRow(psv, locById, eqById)),
    REGISTER_COLUMNS,
  );
  appendSheet(
    wb,
    XLSX,
    'Out for Service',
    psvs
      .filter((p) => p.status === 'out_for_service')
      .map((psv) => buildRegisterRow(psv, locById, eqById)),
    REGISTER_COLUMNS,
  );
  appendSheet(
    wb,
    XLSX,
    'Overdue',
    withCompliance
      .filter((x) => x.c.state === 'overdue')
      .map((x) => x.psv)
      .map((psv) => buildRegisterRow(psv, locById, eqById)),
    REGISTER_COLUMNS,
  );
  appendSheet(
    wb,
    XLSX,
    'Upcoming Due',
    withCompliance
      .filter((x) => x.c.state === 'due_soon')
      .map((x) => x.psv)
      .map((psv) => buildRegisterRow(psv, locById, eqById)),
    REGISTER_COLUMNS,
  );

  const historyRows = [];
  for (const psv of psvs) {
    const ctx = resolveContext(psv, locById, eqById);
    for (const event of psv.events ?? []) {
      historyRows.push({
        'Event ID': event.id,
        Equipment: ctx.eq?.name ?? '',
        'Equipment Tag': ctx.eq?.tag ?? '',
        Location: ctx.loc?.name ?? '',
        'Location Tag': ctx.loc?.tag ?? '',
        'Serial Number': psv.serialNumber,
        'Inventory ID': psv.inventoryId ?? '',
        'PSV Tag': psv.tag ?? '',
        'Event Type': EVENT_TYPE_LABELS[event.type] ?? event.type,
        'Event Date': formatDate(event.date),
        Status: event.status ? (STATUS_LABELS[event.status] ?? event.status) : '',
        Description: event.description ?? '',
        'Previous S/N': event.previousSerialNumber ?? '',
        'New S/N': event.newSerialNumber ?? '',
        Note: event.note ?? '',
        'Recorded At': formatDateTime(event.recordedAt),
      });
    }
  }
  historyRows.sort((a, b) => {
    if (a['Event Date'] !== b['Event Date']) return a['Event Date'] < b['Event Date'] ? 1 : -1;
    return a['Recorded At'] < b['Recorded At'] ? 1 : -1;
  });
  appendSheet(wb, XLSX, 'History Log', historyRows, HISTORY_COLUMNS);

  const repairRows = [];
  for (const psv of psvs) {
    const ctx = resolveContext(psv, locById, eqById);
    for (const record of psv.repairHistory ?? []) {
      repairRows.push({
        'Record ID': record.id,
        Equipment: ctx.eq?.name ?? '',
        'Equipment Tag': ctx.eq?.tag ?? '',
        Location: ctx.loc?.name ?? '',
        'Location Tag': ctx.loc?.tag ?? '',
        'Serial Number': psv.serialNumber,
        'Inventory ID': psv.inventoryId ?? '',
        'PSV Tag': psv.tag ?? '',
        Date: formatDate(record.date),
        Description: record.description ?? '',
        Vendor: record.vendor ?? '',
        'Work Order': record.workOrder ?? '',
        Note: record.note ?? '',
        'Recorded At': formatDateTime(record.recordedAt),
      });
    }
  }
  appendSheet(wb, XLSX, 'Repair History', repairRows, REPAIR_COLUMNS);

  appendSheet(
    wb,
    XLSX,
    'Equipment',
    (data.equipment ?? []).map((eq) => ({
      'Equipment ID': eq.id,
      Name: eq.name,
      Tag: eq.tag ?? '',
      Type: eq.type ?? '',
      Area: eq.area ?? '',
      Description: eq.description ?? '',
    })),
    ['Equipment ID', 'Name', 'Tag', 'Type', 'Area', 'Description'],
  );

  appendSheet(
    wb,
    XLSX,
    'Locations',
    (data.locations ?? []).map((loc) => {
      const eq = eqById.get(loc.equipmentId);
      return {
        'Location ID': loc.id,
        Equipment: eq?.name ?? '',
        'Equipment Tag': eq?.tag ?? '',
        'Location Name': loc.name,
        'Location Tag': loc.tag ?? '',
        Description: loc.description ?? '',
      };
    }),
    ['Location ID', 'Equipment', 'Equipment Tag', 'Location Name', 'Location Tag', 'Description'],
  );

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { buildBackupWorkbook, todayISO };

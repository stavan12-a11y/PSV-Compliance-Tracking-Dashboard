import type { WorkBook, WorkSheet } from 'xlsx';
import type { AppData, Equipment, Location, PSV, PSVEvent, PSVRepairRecord } from '../types';
import {
  COMPLIANCE_LABELS,
  STATUS_LABELS,
  getCompliance,
  lastInstallDate,
  lastServiceDate,
} from './compliance';
import { sortEventsNewestFirst, statusChangeEvents } from './events';
import { formatDate, formatDateTime, todayISO } from './dates';

interface ExportScope {
  equipment?: Equipment;
}

type Row = Record<string, string | number>;

// ---------------------------------------------------------------------------
// Bulk export — dashboard & equipment page
// ---------------------------------------------------------------------------

export async function exportToExcel(data: AppData, scope: ExportScope = {}) {
  const XLSX = await import('xlsx');
  const eqIds = scope.equipment ? new Set([scope.equipment.id]) : null;

  const locations = eqIds
    ? data.locations.filter((l) => eqIds.has(l.equipmentId))
    : data.locations;
  const locIds = new Set(locations.map((l) => l.id));
  const psvs = data.psvs.filter((p) => locIds.has(p.locationId));

  const eqById = new Map(data.equipment.map((e) => [e.id, e]));
  const locById = new Map(data.locations.map((l) => [l.id, l]));

  const wb = XLSX.utils.book_new();

  const allRows = buildRegisterRows(psvs, locById, eqById);
  appendSheet(wb, XLSX, 'All PSVs', allRows, REGISTER_COLUMNS);

  appendSheet(
    wb,
    XLSX,
    'Installed',
    buildRegisterRows(psvs.filter((p) => p.status === 'installed'), locById, eqById),
    REGISTER_COLUMNS,
  );

  appendSheet(
    wb,
    XLSX,
    'Out for Service',
    buildRegisterRows(psvs.filter((p) => p.status === 'out_for_service'), locById, eqById),
    REGISTER_COLUMNS,
  );

  const withCompliance = psvs.map((psv) => ({ psv, c: getCompliance(psv) }));

  appendSheet(
    wb,
    XLSX,
    'Overdue',
    buildRegisterRows(
      withCompliance.filter((x) => x.c.state === 'overdue').map((x) => x.psv),
      locById,
      eqById,
      (a, b) => (getCompliance(a).daysRemaining ?? 0) - (getCompliance(b).daysRemaining ?? 0),
    ),
    REGISTER_COLUMNS,
  );

  appendSheet(
    wb,
    XLSX,
    'Upcoming Due',
    buildRegisterRows(
      withCompliance.filter((x) => x.c.state === 'due_soon').map((x) => x.psv),
      locById,
      eqById,
      (a, b) => (getCompliance(a).daysRemaining ?? 0) - (getCompliance(b).daysRemaining ?? 0),
    ),
    REGISTER_COLUMNS,
  );

  const scopeName = scope.equipment
    ? scope.equipment.tag || scope.equipment.name.replace(/\s+/g, '-')
    : 'All-Equipment';
  XLSX.writeFile(wb, `PSV-Report_${scopeName}_${todayISO()}.xlsx`);
}

// ---------------------------------------------------------------------------
// Single-PSV export — PSV detail page
// ---------------------------------------------------------------------------

export async function exportPSVToExcel(data: AppData, psv: PSV) {
  const XLSX = await import('xlsx');
  const locById = new Map(data.locations.map((l) => [l.id, l]));
  const eqById = new Map(data.equipment.map((e) => [e.id, e]));
  const ctx = resolveContext(psv, locById, eqById);
  const c = getCompliance(psv);

  const wb = XLSX.utils.book_new();

  const summaryAoa: Array<[string, string | number]> = [
    ['PSV SUMMARY', ''],
    ['Serial Number', psv.serialNumber],
    ['Inventory ID', psv.inventoryId ?? ''],
    ['PSV Tag', psv.tag ?? ''],
    ['Equipment', ctx.eq?.name ?? ''],
    ['Equipment Tag', ctx.eq?.tag ?? ''],
    ['Area', ctx.eq?.area ?? ''],
    ['Location', ctx.loc?.name ?? ''],
    ['Location Tag', ctx.loc?.tag ?? ''],
    ['Current Status', STATUS_LABELS[psv.status]],
    ['Serviced On Site', psv.servicedOnSite ? 'Yes' : 'No'],
    ['Last Install Date', formatDate(lastInstallDate(psv))],
    ['Last Service Date', formatDate(lastServiceDate(psv))],
    ['Recert Due Date', c.dueDate ? formatDate(c.dueDate) : 'Not installed'],
    ['Days Remaining', c.daysRemaining ?? ''],
    ['Compliance', COMPLIANCE_LABELS[c.state]],
    ['', ''],
    ['DATASHEET', ''],
    ['Make / Manufacturer', psv.datasheet.make],
    ['Model Number', psv.datasheet.model],
    ['Set Pressure', `${psv.datasheet.setPressure} ${psv.datasheet.pressureUnit}`],
    ['Capacity', psv.datasheet.capacity],
    ['Inlet Size', psv.datasheet.inletSize],
    ['Outlet Size', psv.datasheet.outletSize],
    ['Service Medium', psv.datasheet.serviceMedium ?? ''],
    ['National Board No.', psv.datasheet.nationalBoardNumber ?? ''],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const statusRows = sortEventsNewestFirst(statusChangeEvents(psv.events)).map((event) =>
    buildStatusHistoryRow(psv, event, ctx),
  );
  appendSheet(wb, XLSX, 'Status History', statusRows, STATUS_HISTORY_COLUMNS);

  const repairRows = sortRepairsNewestFirst(psv.repairHistory ?? []).map((record) =>
    buildRepairRow(psv, record, ctx),
  );
  appendSheet(wb, XLSX, 'Repair History', repairRows, REPAIR_COLUMNS);

  const safeSn = psv.serialNumber.replace(/[^\w.-]+/g, '-');
  XLSX.writeFile(wb, `PSV_${safeSn}_${todayISO()}.xlsx`);
}

// ---------------------------------------------------------------------------
// Column layouts (fixed order for every sheet)
// ---------------------------------------------------------------------------

const REGISTER_COLUMNS = [
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
  'Due Date',
  'Days Remaining',
  'Compliance',
] as const;

const STATUS_HISTORY_COLUMNS = [
  'Equipment',
  'Equipment Tag',
  'Location',
  'Location Tag',
  'Serial Number',
  'Inventory ID',
  'PSV Tag',
  'Event Date',
  'Status',
  'Description',
  'Note',
  'Recorded At',
] as const;

const REPAIR_COLUMNS = [
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
] as const;

// ---------------------------------------------------------------------------
// Row builders
// ---------------------------------------------------------------------------

interface PsvContext {
  loc?: Location;
  eq?: Equipment;
}

function resolveContext(
  psv: PSV,
  locById: Map<string, Location>,
  eqById: Map<string, Equipment>,
): PsvContext {
  const loc = locById.get(psv.locationId);
  const eq = loc ? eqById.get(loc.equipmentId) : undefined;
  return { loc, eq };
}

function identityColumns(psv: PSV, ctx: PsvContext): Row {
  return {
    Equipment: ctx.eq?.name ?? '',
    'Equipment Tag': ctx.eq?.tag ?? '',
    Area: ctx.eq?.area ?? '',
    Location: ctx.loc?.name ?? '',
    'Location Tag': ctx.loc?.tag ?? '',
    'Serial Number': psv.serialNumber,
    'Inventory ID': psv.inventoryId ?? '',
    'PSV Tag': psv.tag ?? '',
  };
}

function buildRegisterRows(
  psvs: PSV[],
  locById: Map<string, Location>,
  eqById: Map<string, Equipment>,
  sort?: (a: PSV, b: PSV) => number,
): Row[] {
  const sorted = sort
    ? [...psvs].sort(sort)
    : [...psvs].sort((a, b) => sortRegisterDefault(a, b, locById, eqById));
  return sorted.map((psv) => buildRegisterRow(psv, locById, eqById));
}

function sortRegisterDefault(a: PSV, b: PSV, locById: Map<string, Location>, eqById: Map<string, Equipment>): number {
  const aCtx = resolveContext(a, locById, eqById);
  const bCtx = resolveContext(b, locById, eqById);
  const eqCmp = (aCtx.eq?.name ?? '').localeCompare(bCtx.eq?.name ?? '');
  if (eqCmp !== 0) return eqCmp;
  const locCmp = (aCtx.loc?.name ?? '').localeCompare(bCtx.loc?.name ?? '');
  if (locCmp !== 0) return locCmp;
  return a.serialNumber.localeCompare(b.serialNumber);
}

function buildRegisterRow(
  psv: PSV,
  locById: Map<string, Location>,
  eqById: Map<string, Equipment>,
): Row {
  const ctx = resolveContext(psv, locById, eqById);
  const c = getCompliance(psv);
  return {
    ...identityColumns(psv, ctx),
    Status: STATUS_LABELS[psv.status],
    'Serviced On Site': psv.servicedOnSite ? 'Yes' : 'No',
    Make: psv.datasheet.make,
    Model: psv.datasheet.model,
    'Set Pressure': psv.datasheet.setPressure,
    'Pressure Unit': psv.datasheet.pressureUnit,
    Capacity: psv.datasheet.capacity,
    'Inlet Size': psv.datasheet.inletSize,
    'Outlet Size': psv.datasheet.outletSize,
    'Service Medium': psv.datasheet.serviceMedium ?? '',
    'National Board No.': psv.datasheet.nationalBoardNumber ?? '',
    'Last Install Date': formatDate(lastInstallDate(psv)),
    'Last Service Date': formatDate(lastServiceDate(psv)),
    'Due Date': c.dueDate ? formatDate(c.dueDate) : '',
    'Days Remaining': c.daysRemaining ?? '',
    Compliance: COMPLIANCE_LABELS[c.state],
  };
}

function buildStatusHistoryRow(psv: PSV, event: PSVEvent, ctx: PsvContext): Row {
  return {
    Equipment: ctx.eq?.name ?? '',
    'Equipment Tag': ctx.eq?.tag ?? '',
    Location: ctx.loc?.name ?? '',
    'Location Tag': ctx.loc?.tag ?? '',
    'Serial Number': psv.serialNumber,
    'Inventory ID': psv.inventoryId ?? '',
    'PSV Tag': psv.tag ?? '',
    'Event Date': formatDate(event.date),
    Status: event.status ? STATUS_LABELS[event.status] : '',
    Description: event.description,
    Note: event.note ?? '',
    'Recorded At': formatDateTime(event.recordedAt),
  };
}

function buildRepairRow(psv: PSV, record: PSVRepairRecord, ctx: PsvContext): Row {
  return {
    Equipment: ctx.eq?.name ?? '',
    'Equipment Tag': ctx.eq?.tag ?? '',
    Location: ctx.loc?.name ?? '',
    'Location Tag': ctx.loc?.tag ?? '',
    'Serial Number': psv.serialNumber,
    'Inventory ID': psv.inventoryId ?? '',
    'PSV Tag': psv.tag ?? '',
    Date: formatDate(record.date),
    Description: record.description,
    Vendor: record.vendor ?? '',
    'Work Order': record.workOrder ?? '',
    Note: record.note ?? '',
    'Recorded At': formatDateTime(record.recordedAt),
  };
}

function sortRepairsNewestFirst(records: PSVRepairRecord[]): PSVRepairRecord[] {
  return [...records].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.recordedAt < b.recordedAt ? 1 : -1;
  });
}

// ---------------------------------------------------------------------------
// Sheet helpers
// ---------------------------------------------------------------------------

function appendSheet(
  wb: WorkBook,
  XLSX: typeof import('xlsx'),
  name: string,
  rows: Row[],
  columns: readonly string[],
) {
  const sheetRows = rows.length ? rows : [emptyPlaceholder(columns)];
  const ws = XLSX.utils.json_to_sheet(sheetRows, { header: [...columns] });
  autoWidth(ws, sheetRows, columns);
  XLSX.utils.book_append_sheet(wb, ws, name);
}

function emptyPlaceholder(columns: readonly string[]): Row {
  const row: Row = { Note: 'No records to report.' };
  for (const col of columns) row[col] = '';
  return row;
}

function autoWidth(ws: WorkSheet, rows: Row[], columns: readonly string[]) {
  ws['!cols'] = columns.map((key) => {
    const maxContent = rows.reduce((max, row) => {
      const v = row[key];
      const len = v === null || v === undefined ? 0 : String(v).length;
      return Math.max(max, len);
    }, key.length);
    return { wch: Math.min(Math.max(maxContent + 2, 10), 48) };
  });
}

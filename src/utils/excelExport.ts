import type { WorkBook, WorkSheet } from 'xlsx';
import type { AppData, Equipment, Location, PSV, PSVEvent, PSVRepairRecord } from '../types';
import {
  COMPLIANCE_LABELS,
  STATUS_LABELS,
  getCompliance,
  lastInstallDate,
  lastServiceDate,
  summarize,
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

  const equipment = eqIds ? data.equipment.filter((e) => eqIds.has(e.id)) : data.equipment;
  const locations = eqIds
    ? data.locations.filter((l) => eqIds.has(l.equipmentId))
    : data.locations;
  const locIds = new Set(locations.map((l) => l.id));
  const psvs = data.psvs.filter((p) => locIds.has(p.locationId));

  const eqById = new Map(data.equipment.map((e) => [e.id, e]));
  const locById = new Map(data.locations.map((l) => [l.id, l]));

  const wb = XLSX.utils.book_new();

  const registerRows = psvs
    .map((psv) => buildRegisterRow(psv, locById, eqById))
    .sort(
      (a, b) =>
        String(a.Equipment).localeCompare(String(b.Equipment)) ||
        String(a.Location).localeCompare(String(b.Location)) ||
        String(a['Serial Number']).localeCompare(String(b['Serial Number'])),
    );
  appendSheet(wb, XLSX, 'PSV Register', registerRows, REGISTER_COLUMNS);

  const summaryRows: Row[] = equipment.map((eq) => {
    const eqLocIds = new Set(data.locations.filter((l) => l.equipmentId === eq.id).map((l) => l.id));
    const eqPsvs = data.psvs.filter((p) => eqLocIds.has(p.locationId));
    const s = summarize(eqPsvs);
    return {
      Equipment: eq.name,
      'Equipment Tag': eq.tag,
      Area: eq.area,
      'Total PSVs': s.total,
      Installed: s.installed,
      Inventory: s.inventory,
      'Out for Service': s.outForService,
      Passing: s.compliant + s.dueSoon,
      'Due Soon': s.dueSoon,
      Overdue: s.overdue,
      'Compliant %': s.complianceRate,
    };
  });
  const totals = summarize(psvs);
  summaryRows.push({
    Equipment: 'TOTAL',
    'Equipment Tag': '',
    Area: '',
    'Total PSVs': totals.total,
    Installed: totals.installed,
    Inventory: totals.inventory,
    'Out for Service': totals.outForService,
    Passing: totals.compliant + totals.dueSoon,
    'Due Soon': totals.dueSoon,
    Overdue: totals.overdue,
    'Compliant %': totals.complianceRate,
  });
  appendSheet(wb, XLSX, 'Compliance Summary', summaryRows, SUMMARY_COLUMNS);

  const dueRows = psvs
    .map((psv) => ({ psv, c: getCompliance(psv) }))
    .filter((x) => x.c.state !== 'not_installed')
    .sort((a, b) => (a.c.daysRemaining ?? 0) - (b.c.daysRemaining ?? 0))
    .map(({ psv, c }) => buildDueRow(psv, c, locById, eqById));
  appendSheet(wb, XLSX, 'Due & Overdue', dueRows, DUE_COLUMNS);

  const statusEntries: Array<{ row: Row; date: string; recordedAt: string }> = [];
  for (const psv of psvs) {
    const ctx = resolveContext(psv, locById, eqById);
    for (const event of statusChangeEvents(psv.events)) {
      statusEntries.push({
        row: buildStatusHistoryRow(psv, event, ctx),
        date: event.date,
        recordedAt: event.recordedAt,
      });
    }
  }
  statusEntries.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.recordedAt < b.recordedAt ? 1 : -1;
  });
  appendSheet(
    wb,
    XLSX,
    'Status History',
    statusEntries.map((entry) => entry.row),
    STATUS_HISTORY_COLUMNS,
  );

  const repairEntries: Array<{ row: Row; date: string; recordedAt: string }> = [];
  for (const psv of psvs) {
    const ctx = resolveContext(psv, locById, eqById);
    for (const record of psv.repairHistory ?? []) {
      repairEntries.push({
        row: buildRepairRow(psv, record, ctx),
        date: record.date,
        recordedAt: record.recordedAt,
      });
    }
  }
  repairEntries.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.recordedAt < b.recordedAt ? 1 : -1;
  });
  appendSheet(
    wb,
    XLSX,
    'Repair History',
    repairEntries.map((entry) => entry.row),
    REPAIR_COLUMNS,
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

const SUMMARY_COLUMNS = [
  'Equipment',
  'Equipment Tag',
  'Area',
  'Total PSVs',
  'Installed',
  'Inventory',
  'Out for Service',
  'Passing',
  'Due Soon',
  'Overdue',
  'Compliant %',
] as const;

const DUE_COLUMNS = [
  'Equipment',
  'Equipment Tag',
  'Area',
  'Location',
  'Location Tag',
  'Serial Number',
  'Inventory ID',
  'PSV Tag',
  'Status',
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

function buildDueRow(
  psv: PSV,
  c: ReturnType<typeof getCompliance>,
  locById: Map<string, Location>,
  eqById: Map<string, Equipment>,
): Row {
  const ctx = resolveContext(psv, locById, eqById);
  return {
    ...identityColumns(psv, ctx),
    Status: STATUS_LABELS[psv.status],
    'Due Date': formatDate(c.dueDate),
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

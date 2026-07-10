import { describe, expect, it } from 'vitest';
import XLSX from 'xlsx';
import { seedData } from '../src/data/mockData';
import { buildBulkExportWorkbook } from '../src/utils/excelExport';

describe('buildBulkExportWorkbook', () => {
  it('creates five sheets with every PSV on the All PSVs tab', () => {
    const wb = buildBulkExportWorkbook(seedData, {}, XLSX);

    expect(wb.SheetNames).toEqual([
      'All PSVs',
      'Installed',
      'Out for Service',
      'Overdue',
      'Upcoming Due',
    ]);

    const allRows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets['All PSVs']);
    expect(allRows.length).toBe(seedData.psvs.length);
  });

  it('includes PSVs even when location metadata is missing', () => {
    const orphan: typeof seedData.psvs[number] = {
      ...seedData.psvs[0],
      id: 'orphan-psv',
      serialNumber: 'ORPHAN-001',
      locationId: 'missing-location-id',
    };
    const data = {
      ...seedData,
      psvs: [...seedData.psvs, orphan],
    };

    const wb = buildBulkExportWorkbook(data, {}, XLSX);
    const allRows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets['All PSVs']);
    expect(allRows.some((row) => row['Serial Number'] === 'ORPHAN-001')).toBe(true);
  });
});

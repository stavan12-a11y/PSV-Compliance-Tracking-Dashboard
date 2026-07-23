import type { PSVDatasheet, PSV } from '../types';

/** Short spec line for commercial boiler (use & replace) valves — no serial number. */
export function commercialBoilerSpec(datasheet: PSVDatasheet): string {
  const parts = [
    datasheet.make && datasheet.model ? `${datasheet.make} ${datasheet.model}` : null,
    datasheet.setPressure ? `${datasheet.setPressure} ${datasheet.pressureUnit}` : null,
    datasheet.capacity ? `Rating ${datasheet.capacity}` : null,
    datasheet.inletSize || datasheet.outletSize
      ? `${datasheet.inletSize || '—'} / ${datasheet.outletSize || '—'}`
      : null,
  ].filter(Boolean);
  return parts.join(' · ');
}

/** Primary label shown in lists, breadcrumbs, and headers. */
export function psvDisplayName(psv: PSV): string {
  if (psv.useAndReplace) {
    return commercialBoilerSpec(psv.datasheet) || 'Commercial boiler valve';
  }
  return psv.serialNumber || '—';
}

export function psvPrimaryLabel(psv: PSV): string {
  return psv.useAndReplace ? 'Valve specification' : 'Serial Number';
}

export function isCommercialBoilerDatasheetComplete(sheet: PSVDatasheet): boolean {
  return Boolean(
    sheet.make.trim() &&
      sheet.model.trim() &&
      sheet.setPressure > 0 &&
      sheet.pressureUnit.trim() &&
      sheet.capacity.trim() &&
      sheet.inletSize.trim() &&
      sheet.outletSize.trim(),
  );
}

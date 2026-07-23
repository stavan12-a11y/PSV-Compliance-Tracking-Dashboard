import type { AppData, PSV } from '../types';

export const COMMERCIAL_BOILER_DEFAULT_LABEL = 'Commercial boiler safety';

/** User-facing label for commercial boiler (use & replace) valves. */
export function commercialBoilerLabel(psv: Pick<PSV, 'tag' | 'useAndReplace'>): string {
  const custom = psv.tag?.trim();
  return custom || COMMERCIAL_BOILER_DEFAULT_LABEL;
}

/** Primary label shown in lists, breadcrumbs, and headers. */
export function psvDisplayName(psv: PSV): string {
  if (psv.useAndReplace) {
    return commercialBoilerLabel(psv);
  }
  return psv.serialNumber || '—';
}

export function psvPrimaryLabel(psv: PSV): string {
  return psv.useAndReplace ? 'Safety' : 'Serial Number';
}

/**
 * Enforces commercial-boiler display rules: safety name instead of S/N, always
 * installed, no inventory/spare tracking fields.
 */
export function normalizeCommercialBoilerPsv(psv: PSV): PSV {
  if (!psv.useAndReplace) return psv;
  return {
    ...psv,
    serialNumber: '',
    inventoryId: undefined,
    servicedOnSite: undefined,
    status: 'installed',
    tag: commercialBoilerLabel(psv),
    datasheet: {
      make: psv.datasheet?.make ?? '',
      model: psv.datasheet?.model ?? '',
      setPressure: psv.datasheet?.setPressure ?? 0,
      pressureUnit: psv.datasheet?.pressureUnit ?? 'PSIG',
      capacity: psv.datasheet?.capacity ?? '',
      inletSize: psv.datasheet?.inletSize ?? '',
      outletSize: psv.datasheet?.outletSize ?? '',
      serviceMedium: psv.datasheet?.serviceMedium,
      nationalBoardNumber: psv.datasheet?.nationalBoardNumber,
    },
  };
}

export function normalizeAppData(data: AppData): AppData {
  return {
    ...data,
    psvs: data.psvs.map(normalizeCommercialBoilerPsv),
  };
}

import type { PSV } from '../types';

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

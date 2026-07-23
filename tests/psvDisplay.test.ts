import { describe, expect, it } from 'vitest';
import type { PSV } from '../src/types';
import {
  COMMERCIAL_BOILER_DEFAULT_LABEL,
  commercialBoilerLabel,
  normalizeCommercialBoilerPsv,
  psvDisplayName,
  psvPrimaryLabel,
} from '../src/utils/psvDisplay';

const basePsv = (overrides: Partial<PSV> = {}): PSV => ({
  id: 'psv-1',
  serialNumber: 'SN-100',
  locationId: 'loc-1',
  status: 'installed',
  datasheet: {
    make: '',
    model: '',
    setPressure: 0,
    pressureUnit: 'PSIG',
    capacity: '',
    inletSize: '',
    outletSize: '',
  },
  events: [],
  repairHistory: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('commercial boiler display', () => {
  it('uses default safety name when tag is empty', () => {
    const psv = basePsv({ useAndReplace: true, tag: undefined, serialNumber: '' });
    expect(psvDisplayName(psv)).toBe(COMMERCIAL_BOILER_DEFAULT_LABEL);
    expect(psvPrimaryLabel(psv)).toBe('Safety');
  });

  it('uses custom safety name from tag', () => {
    const psv = basePsv({ useAndReplace: true, tag: 'Boiler #2 relief', serialNumber: '' });
    expect(psvDisplayName(psv)).toBe('Boiler #2 relief');
    expect(commercialBoilerLabel(psv)).toBe('Boiler #2 relief');
  });

  it('normalizes commercial boiler fields on save', () => {
    const psv = basePsv({
      useAndReplace: true,
      serialNumber: 'SHOULD-CLEAR',
      inventoryId: 'INV-1',
      servicedOnSite: true,
      status: 'inventory',
      tag: '',
    });
    const normalized = normalizeCommercialBoilerPsv(psv);
    expect(normalized.serialNumber).toBe('');
    expect(normalized.inventoryId).toBeUndefined();
    expect(normalized.servicedOnSite).toBeUndefined();
    expect(normalized.status).toBe('installed');
    expect(normalized.tag).toBe(COMMERCIAL_BOILER_DEFAULT_LABEL);
  });
});

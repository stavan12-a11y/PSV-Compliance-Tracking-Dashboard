import { describe, expect, it } from 'vitest';
import { computeComplianceRate } from '../src/utils/compliance';

describe('computeComplianceRate', () => {
  it('counts due soon as compliant in the numerator', () => {
    expect(computeComplianceRate({ compliant: 0, dueSoon: 2, overdue: 3 })).toBe(40);
  });

  it('uses monitored valves as the denominator', () => {
    expect(computeComplianceRate({ compliant: 1, dueSoon: 0, overdue: 1 })).toBe(50);
  });

  it('returns 100% when no valves are in compliance scope', () => {
    expect(computeComplianceRate({ compliant: 0, dueSoon: 0, overdue: 0 })).toBe(100);
  });

  it('returns 100% when all monitored valves are passing', () => {
    expect(computeComplianceRate({ compliant: 2, dueSoon: 1, overdue: 0 })).toBe(100);
  });
});

import { describe, expect, it } from 'vitest';
import { toOffsetIso } from '../../../src/lib/datetime';
import { analyticsRangeForPreset, rangeFromLocalInputs } from '../../../src/features/analytics/range';

describe('analytics date-range presets', () => {
  it('writes timezone offset without rounding past the real hour', () => {
    const date = new Date(2026, 8, 1, 0, 0, 0);
    const iso = toOffsetIso(date);
    expect(new Date(iso).getTime()).toBe(date.getTime());
    expect(iso.startsWith('2026-09-01T00:00:00')).toBe(true);
  });

  it('uses the local calendar day for Today', () => {
    const now = new Date(2026, 8, 1, 15, 45, 0);
    const range = analyticsRangeForPreset('today', now);
    expect(range.startDate.startsWith('2026-09-01T00:00:00')).toBe(true);
    expect(range.endDate.startsWith('2026-09-01T23:59:59')).toBe(true);
    expect(new Date(range.endDate).getTime()).toBeGreaterThan(new Date(range.startDate).getTime());
  });

  it('uses Monday–Sunday of the current local week', () => {
    const tuesday = new Date(2026, 8, 1, 12, 0, 0);
    const range = analyticsRangeForPreset('week', tuesday);
    expect(range.startDate.startsWith('2026-08-31T00:00:00')).toBe(true);
    expect(range.endDate.startsWith('2026-09-06T23:59:59')).toBe(true);
  });

  it('uses the full local calendar month', () => {
    const midMonth = new Date(2026, 8, 15, 12, 0, 0);
    const range = analyticsRangeForPreset('month', midMonth);
    expect(range.startDate.startsWith('2026-09-01T00:00:00')).toBe(true);
    expect(range.endDate.startsWith('2026-09-30T23:59:59')).toBe(true);
  });

  it('converts custom local inputs to offset ISO instants', () => {
    const range = rangeFromLocalInputs('2026-09-01T00:00', '2026-09-02T00:00');
    expect(range).not.toBeNull();
    expect(range?.startDate).toMatch(/2026-09-01T00:00:00/);
    expect(range?.endDate).toMatch(/2026-09-02T00:00:00/);
  });

  it('rejects an inverted custom range', () => {
    expect(rangeFromLocalInputs('2026-09-02T00:00', '2026-09-01T00:00')).toBeNull();
  });
});

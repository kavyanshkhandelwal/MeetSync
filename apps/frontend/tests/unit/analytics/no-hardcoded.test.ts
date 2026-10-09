import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { relativePosix, walkFiles } from '../../helpers/srcTree';

describe('analytics UI has no fabricated metrics', () => {
  const src = path.resolve(__dirname, '../../../src');
  const files = walkFiles(src).filter((file) => /\.(ts|tsx)$/.test(file));

  it('does not hardcode occupancy or +12% style deltas', () => {
    const hits = files
      .filter((file) => {
        const text = fs.readFileSync(file, 'utf8');
        return /68%|\+12%|from last month/.test(text);
      })
      .map((file) => relativePosix(src, file));
    expect(hits).toEqual([]);
  });

  it('sends an explicit date range from the dashboard and analytics pages', () => {
    const home = fs.readFileSync(path.join(src, 'app/page.tsx'), 'utf8');
    const analytics = fs.readFileSync(path.join(src, 'app/analytics/page.tsx'), 'utf8');
    expect(home).toContain('analyticsRangeForPreset');
    expect(home).toContain('useDashboardAnalytics');
    expect(home).not.toContain('value="68%"');
    expect(analytics).toContain('useDashboardAnalytics(range)');
    expect(analytics).toContain('Today');
    expect(analytics).toContain('This week');
    expect(analytics).toContain('This month');
    expect(analytics).toContain('Custom');
    expect(analytics).not.toContain('useBookings');
  });

  it('renders error and empty states instead of fake peaks', () => {
    const analytics = fs.readFileSync(path.join(src, 'app/analytics/page.tsx'), 'utf8');
    expect(analytics).toContain('analyticsErrorMessage');
    expect(analytics).toContain('peakHourDisplay');
    expect(analytics).toContain('occupancyCard');
    expect(analytics).not.toMatch(/peakHourLabel \|\| '0:00'/);
  });
});

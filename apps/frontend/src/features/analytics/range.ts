import { endOfLocalDay, startOfLocalDay, toOffsetIso } from '../../lib/datetime';

export type AnalyticsPreset = 'today' | 'week' | 'month' | 'custom';

function startOfLocalWeek(date: Date): Date {
  const start = startOfLocalDay(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  return start;
}

function endOfLocalWeek(date: Date): Date {
  const start = startOfLocalWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return endOfLocalDay(end);
}

function startOfLocalMonth(date: Date): Date {
  const start = startOfLocalDay(date);
  start.setDate(1);
  return start;
}

function endOfLocalMonth(date: Date): Date {
  const start = startOfLocalMonth(date);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return endOfLocalDay(end);
}

export function analyticsRangeForPreset(
  preset: Exclude<AnalyticsPreset, 'custom'>,
  now: Date = new Date(),
): { startDate: string; endDate: string } {
  if (preset === 'today') {
    return {
      startDate: toOffsetIso(startOfLocalDay(now)),
      endDate: toOffsetIso(endOfLocalDay(now)),
    };
  }
  if (preset === 'week') {
    return {
      startDate: toOffsetIso(startOfLocalWeek(now)),
      endDate: toOffsetIso(endOfLocalWeek(now)),
    };
  }
  return {
    startDate: toOffsetIso(startOfLocalMonth(now)),
    endDate: toOffsetIso(endOfLocalMonth(now)),
  };
}

export function rangeFromLocalInputs(startLocal: string, endLocal: string): { startDate: string; endDate: string } | null {
  if (!startLocal || !endLocal) {
    return null;
  }
  const start = new Date(startLocal);
  const end = new Date(endLocal);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }
  return { startDate: toOffsetIso(start), endDate: toOffsetIso(end) };
}

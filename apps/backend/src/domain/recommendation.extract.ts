import { BadRequestError } from '../utils/errors';

export const UNRESOLVABLE_TIME_MESSAGE =
  "No valid meeting time could be determined. Please specify a time such as 'tomorrow at 3 PM'.";

export type RawExtractedRequirements = {
  capacity: number;
  startTime: string;
  endTime: string;
  equipment: string[];
  building?: string;
  floor?: number;
  purpose?: string;
};

function toUtcOffsetIso(date: Date): string {
  return date.toISOString().replace('.000Z', '+00:00').replace('Z', '+00:00');
}

function utcDay(now: Date, tomorrow: boolean): Date {
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (tomorrow) {
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return day;
}

function applyUtcClock(day: Date, hour24: number, minute: number): Date {
  return new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour24, minute, 0, 0),
  );
}

function hour12To24(hour12: number, meridiem: string): number {
  const hour = hour12 % 12;
  return meridiem.toLowerCase() === 'pm' ? hour + 12 : hour;
}

const RANGE_RE =
  /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*(?:to|-)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
const AT_12_RE = /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
const AT_24_RE = /\bat\s+([01]?\d|2[0-3]):([0-5]\d)\b/;
const AROUND_RE = /\baround\b/i;

function resolveTimes(query: string, now: Date): { start: Date; end: Date } {
  if (AROUND_RE.test(query) && !RANGE_RE.test(query)) {
    throw new BadRequestError(UNRESOLVABLE_TIME_MESSAGE);
  }

  const day = utcDay(now, /tomorrow/i.test(query));
  const range = query.match(RANGE_RE);
  if (range) {
    const start = applyUtcClock(
      day,
      hour12To24(parseInt(range[1], 10), range[3]),
      parseInt(range[2] || '0', 10),
    );
    const end = applyUtcClock(
      day,
      hour12To24(parseInt(range[4], 10), range[6]),
      parseInt(range[5] || '0', 10),
    );
    return { start, end };
  }

  const at12 = query.match(AT_12_RE);
  if (at12) {
    const start = applyUtcClock(
      day,
      hour12To24(parseInt(at12[1], 10), at12[3]),
      parseInt(at12[2] || '0', 10),
    );
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return { start, end };
  }

  const at24 = query.match(AT_24_RE);
  if (at24) {
    const start = applyUtcClock(day, parseInt(at24[1], 10), parseInt(at24[2], 10));
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return { start, end };
  }

  throw new BadRequestError(UNRESOLVABLE_TIME_MESSAGE);
}

function extractEquipmentTokens(query: string): string[] {
  const tokens: string[] = [];
  if (/projector/i.test(query)) tokens.push('projector');
  if (/whiteboard/i.test(query)) tokens.push('whiteboard');
  if (/video\s*conference|videoconference|video-conference/i.test(query)) {
    tokens.push('video conference');
  }
  if (/\btv\b/i.test(query)) tokens.push('tv');
  return tokens;
}

function extractFloor(query: string): number | undefined {
  const match =
    query.match(/\bfloor\s+(\d+)\b/i) || query.match(/\b(\d+)(?:st|nd|rd|th)?\s+floor\b/i);
  if (!match) {
    return undefined;
  }
  return parseInt(match[1], 10);
}

/**
 * Deterministic fallback parser. Not an LLM.
 * Times are interpreted in UTC. Unresolvable times fail instead of guessing 2–3 PM.
 */
export function extractRequirements(
  query: string,
  now: Date = new Date(),
): RawExtractedRequirements {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new BadRequestError('Query is required');
  }

  const people = trimmed.match(/(\d+)\s*(?:people|persons|pax|attendees|seats)/i);
  const capacity = people ? parseInt(people[1], 10) : 1;
  const { start, end } = resolveTimes(trimmed, now);

  const purposeMatch = trimmed.match(/\bfor\s+(?!(\d+)\s*(?:people|persons|pax|attendees|seats))(.{5,80})/i);
  const purpose = purposeMatch?.[2]?.trim();

  return {
    capacity,
    startTime: toUtcOffsetIso(start),
    endTime: toUtcOffsetIso(end),
    equipment: extractEquipmentTokens(trimmed),
    floor: extractFloor(trimmed),
    purpose: purpose && purpose.length >= 5 ? purpose.slice(0, 500) : undefined,
  };
}

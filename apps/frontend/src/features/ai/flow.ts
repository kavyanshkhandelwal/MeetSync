import { datetimeLocalFromIso, toOffsetIso } from '../../lib/datetime';
import { ExtractedRequirements } from './api';

export const NO_ROOMS_MESSAGE = 'No available rooms match these requirements.';
export const NO_ROOMS_GUIDANCE =
  'Try reducing the required capacity, removing an equipment requirement, changing the building, or selecting another time.';
export const STALE_RESULTS_MESSAGE =
  'Requirements changed. Find rooms again to refresh availability.';

export type ConstraintForm = {
  capacity: string;
  startLocal: string;
  endLocal: string;
  purpose: string;
  building: string;
  floor: string;
  equipment: string;
};

export function constraintFingerprint(form: ConstraintForm): string {
  return [
    form.capacity.trim(),
    form.startLocal,
    form.endLocal,
    form.purpose.trim(),
    form.building.trim(),
    form.floor.trim(),
    form.equipment.trim(),
  ].join('|');
}

export function requirementsAreStale(saved: string | null, current: string): boolean {
  return saved !== null && saved !== current;
}

export function parseEquipmentList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formFromExtracted(
  extracted: ExtractedRequirements,
  previousPurpose = '',
): ConstraintForm {
  return {
    capacity: String(extracted.capacity),
    startLocal: datetimeLocalFromIso(extracted.startTime),
    endLocal: datetimeLocalFromIso(extracted.endTime),
    purpose: extracted.purpose || previousPurpose,
    building: extracted.building || '',
    floor: extracted.floor !== undefined ? String(extracted.floor) : '',
    equipment: extracted.equipment.join(', '),
  };
}

export function buildConstraintPayload(form: ConstraintForm): ExtractedRequirements {
  const payload: ExtractedRequirements = {
    capacity: Number(form.capacity),
    startTime: toOffsetIso(new Date(form.startLocal)),
    endTime: toOffsetIso(new Date(form.endLocal)),
    equipment: parseEquipmentList(form.equipment),
  };
  if (form.building.trim()) {
    payload.building = form.building.trim();
  }
  if (form.floor.trim() !== '') {
    payload.floor = Number(form.floor);
  }
  if (form.purpose.trim().length >= 5) {
    payload.purpose = form.purpose.trim();
  }
  return payload;
}

export function clientConstraintIssue(form: ConstraintForm, now: Date = new Date()): string | null {
  const capacity = Number(form.capacity);
  if (!Number.isInteger(capacity) || capacity < 1) {
    return 'Capacity must be at least 1.';
  }
  if (!form.startLocal || !form.endLocal) {
    return 'Start and end times are required.';
  }
  const start = new Date(form.startLocal);
  const end = new Date(form.endLocal);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Times must be valid datetimes.';
  }
  if (end <= start) {
    return 'End time must be after start time.';
  }
  const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
  if (minutes < 15) {
    return 'Booking must be at least 15 minutes long.';
  }
  if (minutes > 8 * 60) {
    return "Booking can't be longer than 8 hours.";
  }
  if (start <= now) {
    return "Booking start time can't be in the past.";
  }
  if (form.floor.trim() !== '' && !Number.isInteger(Number(form.floor))) {
    return 'Floor must be a whole number.';
  }
  return null;
}

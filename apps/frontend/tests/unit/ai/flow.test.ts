import { describe, expect, it } from 'vitest';
import { toOffsetIso } from '../../../src/lib/datetime';
import {
  ConstraintForm,
  buildConstraintPayload,
  clientConstraintIssue,
  constraintFingerprint,
  formFromExtracted,
  requirementsAreStale,
} from '../../../src/features/ai/flow';

const baseForm: ConstraintForm = {
  capacity: '8',
  startLocal: '2030-06-16T15:00',
  endLocal: '2030-06-16T16:00',
  purpose: 'Team meeting',
  building: 'North',
  floor: '2',
  equipment: 'Projector',
};

describe('recommendation constraint editing', () => {
  it('sends the edited capacity, not the originally extracted value', () => {
    const payload = buildConstraintPayload({ ...baseForm, capacity: '12' });
    expect(payload.capacity).toBe(12);
    expect(payload.startTime).toBe(toOffsetIso(new Date('2030-06-16T15:00')));
    expect(payload.endTime).toBe(toOffsetIso(new Date('2030-06-16T16:00')));
  });

  it('sends edited start and end times', () => {
    const payload = buildConstraintPayload({
      ...baseForm,
      startLocal: '2030-06-17T09:00',
      endLocal: '2030-06-17T10:30',
    });
    expect(payload.startTime).toBe(toOffsetIso(new Date('2030-06-17T09:00')));
    expect(payload.endTime).toBe(toOffsetIso(new Date('2030-06-17T10:30')));
  });

  it('preserves an edited purpose for booking', () => {
    const payload = buildConstraintPayload({ ...baseForm, purpose: 'Quarterly planning' });
    expect(payload.purpose).toBe('Quarterly planning');
    const form = formFromExtracted(
      {
        capacity: 8,
        startTime: '2030-06-16T15:00:00+00:00',
        endTime: '2030-06-16T16:00:00+00:00',
        equipment: [],
        purpose: 'Quarterly planning',
      },
    );
    expect(form.purpose).toBe('Quarterly planning');
    expect(form.purpose).not.toMatch(/^AI recommendation:/);
  });

  it('marks displayed rooms stale after a constraint edit', () => {
    const saved = constraintFingerprint(baseForm);
    expect(requirementsAreStale(saved, constraintFingerprint({ ...baseForm, capacity: '16' }))).toBe(
      true,
    );
    expect(requirementsAreStale(saved, constraintFingerprint(baseForm))).toBe(false);
  });

  it('rejects inverted and past times before a network request is required', () => {
    expect(
      clientConstraintIssue({ ...baseForm, startLocal: '2030-06-16T16:00', endLocal: '2030-06-16T15:00' }),
    ).toMatch(/after start/i);
    expect(
      clientConstraintIssue(
        { ...baseForm, startLocal: '2020-01-01T15:00', endLocal: '2020-01-01T16:00' },
        new Date('2030-06-15T10:00:00Z'),
      ),
    ).toMatch(/past/i);
  });
});

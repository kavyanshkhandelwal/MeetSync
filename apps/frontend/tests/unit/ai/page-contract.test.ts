import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  bookingErrorMessage,
  extractionSourceMessage,
  recommendationErrorMessage,
} from '../../../src/features/ai/api';
import { NO_ROOMS_MESSAGE, STALE_RESULTS_MESSAGE } from '../../../src/features/ai/flow';
import { ROOM_NO_LONGER_AVAILABLE } from '../../../src/features/bookings/errors';

const page = fs.readFileSync(
  path.resolve(__dirname, '../../../src/app/ai/page.tsx'),
  'utf8',
);

describe('recommendation page contract', () => {
  it('submits the initial query without sending edited constraints', () => {
    expect(page).toContain('recommendRooms(query)');
    expect(page).toContain('Extract constraints');
    expect(page).toContain('Extracting constraints...');
    expect(page).toContain('Extracted requirements');
    expect(page).toContain('datetime-local');
  });

  it('sends the current edited constraints only when Find rooms is clicked', () => {
    expect(page).toContain('Find rooms');
    expect(page).toContain('Finding rooms...');
    expect(page).toContain('recommendRooms(query, buildConstraintPayload(form))');
    expect(page).toContain('onClick={onFindRooms}');
    expect(page).not.toMatch(/onChange=\{[^}]*recommendRooms/);
  });

  it('shows empty, stale, and API error states without implying AI booked a room', () => {
    expect(page).toContain('NO_ROOMS_MESSAGE');
    expect(page).toContain('STALE_RESULTS_MESSAGE');
    expect(page).toContain('recommendationErrorMessage');
    expect(page).not.toContain('AI couldn\'t find a room');
    expect(page).not.toContain('AI booked');
    expect(NO_ROOMS_MESSAGE).toBe('No available rooms match these requirements.');
    expect(STALE_RESULTS_MESSAGE).toContain('Find rooms again');
  });

  it('Book Now uses the existing booking modal, not an AI book endpoint', () => {
    expect(page).toContain("from '@/components/bookings/BookingModal'");
    expect(page).toContain('BookingModal');
    expect(page).toContain('defaultPurpose={form.purpose}');
    expect(page).not.toContain('/ai/book');
    expect(page).not.toContain("from '@/features/bookings/api'");
    expect(page).not.toContain('createBooking(');
    expect(page).not.toContain('prisma');
    expect(page).toContain('extractionSourceMessage');
  });

  it('is a form, not a chat UI', () => {
    expect(page).not.toMatch(/assistant bubble|message history|streaming|ChatGPT/i);
    expect(page).not.toContain('conversation');
  });

  it('describes extractionSource honestly', () => {
    expect(extractionSourceMessage('fallback')).toContain('deterministic parsing');
    expect(extractionSourceMessage('llm')).toBe(
      'Constraints extracted with AI; availability verified against the calendar.',
    );
  });

  it('maps API failures to a user-facing message without provider internals', () => {
    expect(
      recommendationErrorMessage({ response: { status: 400, data: { message: 'Query is required' } } }),
    ).toBe('Query is required');
    expect(
      recommendationErrorMessage({
        response: { status: 502, data: { message: 'OpenAI rate limit: missing API key' } },
      }),
    ).toBe('Recommendation failed');
    expect(
      bookingErrorMessage({ response: { status: 409, data: { message: 'Room is already booked for this time' } } }),
    ).toBe(ROOM_NO_LONGER_AVAILABLE);
  });
});

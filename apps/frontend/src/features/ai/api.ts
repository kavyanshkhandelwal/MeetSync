import { apiClient } from '../../lib/axios';
import { bookingConflictMessage } from '../bookings/errors';

export type ExtractedRequirements = {
  capacity: number;
  startTime: string;
  endTime: string;
  equipment: string[];
  building?: string;
  floor?: number;
  purpose?: string;
};

export type RecommendedRoom = {
  roomId: string;
  name: string;
  capacity: number;
  building: string;
  floor: number;
  equipments: string[];
};

export type RecommendationResult = {
  extracted: ExtractedRequirements;
  extractionSource: 'llm' | 'fallback';
  rooms: RecommendedRoom[];
  explanation: string;
};

export function extractionSourceMessage(source: RecommendationResult['extractionSource']): string {
  if (source === 'llm') {
    return 'Constraints extracted with AI; availability verified against the calendar.';
  }
  return 'Using deterministic parsing because AI extraction is unavailable.';
}

export const recommendRooms = async (
  query: string,
  constraints?: ExtractedRequirements,
): Promise<RecommendationResult> => {
  const response = await apiClient.post(
    '/ai/recommend',
    constraints ? { query, constraints } : { query },
  );
  return response.data.data;
};

function sanitizeRecommendationError(message: string): string {
  if (/openai|api[_-]?key|stack trace|econnreset|rate limit/i.test(message)) {
    return 'Recommendation failed';
  }
  return message;
}

export function recommendationErrorMessage(error: unknown): string {
  const err = error as {
    response?: { status?: number; data?: { message?: string } };
    message?: string;
  };
  const status = err.response?.status;
  const raw = err.response?.data?.message || err.message || 'Recommendation failed';
  const message = sanitizeRecommendationError(raw);
  if (status === 400) {
    return message === 'Recommendation failed' ? 'These requirements are invalid.' : message;
  }
  if (status === 401) {
    return 'Please sign in again.';
  }
  return message;
}

export function bookingErrorMessage(error: unknown): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return bookingConflictMessage(error) || err.response?.data?.message || err.message || 'Booking failed';
}

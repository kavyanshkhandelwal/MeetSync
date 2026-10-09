import { describe, expect, it } from 'vitest';
import { rankRecommendedRooms } from '../../../src/domain/recommendation.rank';

describe('deterministic recommendation ranking', () => {
  it('places an 8-seat room before a 20-seat room when both fit 8', () => {
    const ranked = rankRecommendedRooms([
      { name: 'Boardroom', capacity: 20, building: 'HQ' },
      { name: 'Huddle', capacity: 8, building: 'HQ' },
    ]);
    expect(ranked.map((room) => room.name)).toEqual(['Huddle', 'Boardroom']);
  });

  it('prefers an explicit building match when capacity is equal', () => {
    const ranked = rankRecommendedRooms(
      [
        { name: 'East', capacity: 8, building: 'East Annex' },
        { name: 'Main', capacity: 8, building: 'Main Tower' },
      ],
      'Main Tower',
    );
    expect(ranked[0].name).toBe('Main');
  });

  it('uses name as the final tie-breaker', () => {
    const ranked = rankRecommendedRooms([
      { name: 'Zeta', capacity: 8, building: 'HQ' },
      { name: 'Alpha', capacity: 8, building: 'HQ' },
    ]);
    expect(ranked.map((room) => room.name)).toEqual(['Alpha', 'Zeta']);
  });
});

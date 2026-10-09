export function rankRecommendedRooms<T extends { capacity: number; building: string; name: string }>(
  rooms: T[],
  requestedBuilding?: string,
): T[] {
  return [...rooms].sort((a, b) => {
    if (a.capacity !== b.capacity) {
      return a.capacity - b.capacity;
    }
    if (requestedBuilding) {
      const wanted = requestedBuilding.toLowerCase();
      const aHit = a.building.toLowerCase() === wanted ? 0 : 1;
      const bHit = b.building.toLowerCase() === wanted ? 0 : 1;
      if (aHit !== bHit) {
        return aHit - bHit;
      }
    }
    return a.name.localeCompare(b.name);
  });
}

export function buildRecommendationExplanation(input: {
  count: number;
  capacity: number;
  startTime: string;
  endTime: string;
  equipment: string[];
  building?: string;
}): string {
  if (input.count === 0) {
    return 'No rooms are currently available for those requirements.';
  }

  const start = new Date(input.startTime);
  const end = new Date(input.endTime);
  const time = `${String(start.getUTCHours()).padStart(2, '0')}:${String(start.getUTCMinutes()).padStart(2, '0')} to ${String(end.getUTCHours()).padStart(2, '0')}:${String(end.getUTCMinutes()).padStart(2, '0')} UTC`;
  const equipment =
    input.equipment.length > 0 ? ` and ${input.equipment.join(', ')}` : '';
  const building = input.building ? ` in ${input.building}` : '';
  const noun = input.count === 1 ? 'room' : 'rooms';

  return `Found ${input.count} active ${noun} available from ${time} with capacity for at least ${input.capacity} people${equipment}${building}. Availability was verified against existing bookings.`;
}

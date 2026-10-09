export function normalizeEquipment(requested: string[], inventory: string[]): string[] {
  const matched: string[] = [];
  const seen = new Set<string>();

  for (const raw of requested) {
    const token = raw.trim().toLowerCase();
    if (!token) {
      continue;
    }
    const exact = inventory.find((item) => item.toLowerCase() === token);
    const partial = inventory.find(
      (item) => item.toLowerCase().includes(token) || token.includes(item.toLowerCase()),
    );
    const canonical = exact || partial;
    if (canonical && !seen.has(canonical.toLowerCase())) {
      seen.add(canonical.toLowerCase());
      matched.push(canonical);
    }
  }

  return matched;
}

export function matchBuilding(query: string, buildings: string[]): string | undefined {
  const lower = query.toLowerCase();
  const hits = buildings.filter((building) => lower.includes(building.toLowerCase()));
  if (hits.length === 0) {
    return undefined;
  }
  return hits.sort((a, b) => b.length - a.length)[0];
}

export function normalizeBuilding(requested: string | undefined, buildings: string[]): string | undefined {
  if (!requested?.trim()) {
    return undefined;
  }
  const token = requested.trim().toLowerCase();
  return (
    buildings.find((item) => item.toLowerCase() === token) ||
    buildings.find((item) => item.toLowerCase().includes(token) || token.includes(item.toLowerCase()))
  );
}

export function normalizeFloor(floor: number | undefined, floors: number[]): number | undefined {
  if (floor === undefined) {
    return undefined;
  }
  return floors.includes(floor) ? floor : undefined;
}

export function collectInventory(
  rooms: Array<{ equipments: string[]; building: string; floor: number }>,
): {
  equipments: string[];
  buildings: string[];
  floors: number[];
} {
  const equipments = new Set<string>();
  const buildings = new Set<string>();
  const floors = new Set<number>();
  rooms.forEach((room) => {
    room.equipments.forEach((item) => equipments.add(item));
    if (room.building) {
      buildings.add(room.building);
    }
    floors.add(room.floor);
  });
  return {
    equipments: [...equipments],
    buildings: [...buildings],
    floors: [...floors],
  };
}

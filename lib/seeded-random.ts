/** FNV-1a 32-bit — même seed = même gagnant, vérifiable. */
export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededUnit(seed: string): number {
  return hashSeed(seed) / 4294967296;
}

export function pickIndex(length: number, seed: string): number {
  if (length <= 0) return -1;
  return Math.floor(seededUnit(seed) * length);
}

export function pickId(ids: string[], seed: string): string | null {
  if (!ids.length) return null;
  return ids[pickIndex(ids.length, seed)] ?? null;
}

export function makeSeed(date: string, groupeId: string, jour: number): string {
  return `${date}|${groupeId}|jour-${jour}`;
}

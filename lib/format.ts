export function fcfa(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
}

export function starsLabel(score: number): string {
  const clamped = Math.max(0, Math.min(5, score));
  return `${clamped.toFixed(1)} / 5`;
}

export function phoneGabon(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("241")) return `+${digits}`;
  if (digits.startsWith("0")) return `+241 ${digits.slice(1)}`;
  return `+241 ${digits}`;
}

export function shortPhone(tel: string): string {
  const d = tel.replace(/\D/g, "").slice(-6);
  return `077…${d.slice(-3)}`;
}

export function todayISO(dateDebut: string, jourNumero: number): string {
  const d = new Date(`${dateDebut}T00:00:00`);
  d.setDate(d.getDate() + (jourNumero - 1));
  return d.toISOString().slice(0, 10);
}

export function parseHour(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(":").map(Number);
  return { h: h || 18, m: m || 0 };
}

export function isDrawHour(heureTirage: string, now = new Date()): boolean {
  const { h, m } = parseHour(heureTirage);
  return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
}

/**
 * Dates des flux Oxatis : le DataPlug exporte tantôt "JJ/MM/AAAA", tantôt un
 * datetime ISO. Ces helpers sont la seule lecture de ces valeurs dans l'app.
 */

export function parseLooseDate(dateStr: string): Date | null {
  if (!dateStr?.trim()) return null;
  const parts = dateStr.trim().split("/");
  const date =
    parts.length === 3
      ? new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10))
      : new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function isFutureDate(dateStr: string): boolean {
  const date = parseLooseDate(dateStr);
  return date !== null && date > startOfToday();
}

/** Sortie déjà effective : le jour même ou un jour passé. */
export function isReleasedDate(dateStr: string): boolean {
  const date = parseLooseDate(dateStr);
  if (date === null) return false;
  date.setHours(0, 0, 0, 0);
  return date <= startOfToday();
}

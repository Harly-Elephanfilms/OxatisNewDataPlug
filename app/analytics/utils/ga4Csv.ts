import Papa from "papaparse";

export interface Ga4TrafficRow {
  date: string;
  source: string;
  users: number;
  sessions: number;
  views: number;
  conversions: number;
}

export interface Ga4TrafficReport {
  rows: Ga4TrafficRow[];
  totals: { users: number; sessions: number; views: number; conversions: number };
  byDay: Array<{ date: string; users: number; sessions: number; views: number; conversions: number }>;
  bySource: Array<{ source: string; sessions: number; conversions: number }>;
}

function normalizeHeader(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findColumn(headers: string[], candidates: string[]): string | undefined {
  const normalized = new Map(headers.map((header) => [normalizeHeader(header), header]));
  for (const candidate of candidates) {
    const match = normalized.get(normalizeHeader(candidate));
    if (match) return match;
  }
  return undefined;
}

function numberValue(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? "").trim();
  const suffix = raw.match(/([km])\s*$/i)?.[1]?.toLowerCase();
  const normalized = raw.replace(/[km]\s*$/i, "").replace(/[\s\u00a0]/g, "").replace(/,(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return 0;
  return parsed * (suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : 1);
}

function normalizeDate(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (/^\d{8}$/.test(raw)) return raw.slice(0, 4) + "-" + raw.slice(4, 6) + "-" + raw.slice(6, 8);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const fr = raw.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (fr) return fr[3] + "-" + fr[2].padStart(2, "0") + "-" + fr[1].padStart(2, "0");
  return "";
}

export function parseGa4Csv(csv: string): Ga4TrafficReport {
  const parsed = Papa.parse<Record<string, string>>(csv.replace(/^\uFEFF/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });
  if (parsed.errors.length && parsed.data.length === 0) {
    throw new Error("Le fichier CSV n’a pas pu être lu. Vérifie son format puis réessaie.");
  }

  const headers = parsed.meta.fields ?? [];
  const dateColumn = findColumn(headers, ["Date", "Day"]);
  const sourceColumn = findColumn(headers, [
    "Session source / medium",
    "Session source",
    "First user source / medium",
    "First user source",
    "Source/Support de la session",
    "Première combinaison source/support de l'utilisateur",
    "Groupe de canaux principal de la session",
    "Session primary channel group",
    "Session default channel group",
  ]);
  const usersColumn = findColumn(headers, ["Active users", "Total users", "Users", "Utilisateurs actifs", "Utilisateurs"]);
  const sessionsColumn = findColumn(headers, ["Sessions"]);
  const viewsColumn = findColumn(headers, ["Views", "Page views", "Vues"]);
  const conversionsColumn = findColumn(headers, ["Key events", "Conversions", "Événements clés"]);

  if (!usersColumn && !sessionsColumn && !viewsColumn && !conversionsColumn) {
    throw new Error("Aucune colonne de trafic reconnue. Le CSV doit contenir au moins Users, Sessions, Views ou Key events.");
  }

  const rows = parsed.data.map((raw) => ({
    date: dateColumn ? normalizeDate(raw[dateColumn]) : "",
    source: sourceColumn ? String(raw[sourceColumn] ?? "").trim() || "Non renseignée" : "Non renseignée",
    users: usersColumn ? numberValue(raw[usersColumn]) : 0,
    sessions: sessionsColumn ? numberValue(raw[sessionsColumn]) : 0,
    views: viewsColumn ? numberValue(raw[viewsColumn]) : 0,
    conversions: conversionsColumn ? numberValue(raw[conversionsColumn]) : 0,
  })).filter((row) => row.date || row.source !== "Non renseignée" || row.users || row.sessions || row.views || row.conversions);

  const totals = rows.reduce((sum, row) => ({
    users: sum.users + row.users,
    sessions: sum.sessions + row.sessions,
    views: sum.views + row.views,
    conversions: sum.conversions + row.conversions,
  }), { users: 0, sessions: 0, views: 0, conversions: 0 });

  const dayMap = new Map<string, Ga4TrafficReport["byDay"][number]>();
  const sourceMap = new Map<string, Ga4TrafficReport["bySource"][number]>();
  for (const row of rows) {
    if (row.date) {
      const current = dayMap.get(row.date) ?? { date: row.date, users: 0, sessions: 0, views: 0, conversions: 0 };
      dayMap.set(row.date, {
        date: row.date,
        users: current.users + row.users,
        sessions: current.sessions + row.sessions,
        views: current.views + row.views,
        conversions: current.conversions + row.conversions,
      });
    }
    const currentSource = sourceMap.get(row.source) ?? { source: row.source, sessions: 0, conversions: 0 };
    sourceMap.set(row.source, {
      source: row.source,
      sessions: currentSource.sessions + row.sessions,
      conversions: currentSource.conversions + row.conversions,
    });
  }

  return {
    rows,
    totals,
    byDay: Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    bySource: Array.from(sourceMap.values()).sort((a, b) => b.sessions - a.sessions),
  };
}

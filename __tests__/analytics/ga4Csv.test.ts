import { describe, expect, it } from "vitest";
import { parseGa4Csv } from "@/app/analytics/utils/ga4Csv";

describe("parseGa4Csv", () => {
  it("reads common GA4 headers and aggregates daily traffic and sources", () => {
    const report = parseGa4Csv([
      "Date,Session source / medium,Active users,Sessions,Views,Key events",
      "20260901,google / organic,12,15,30,2",
      "20260901,(direct) / (none),8,9,16,1",
      "20260902,google / organic,10,11,25,3",
    ].join("\n"));

    expect(report.totals).toEqual({ users: 30, sessions: 35, views: 71, conversions: 6 });
    expect(report.byDay).toEqual([
      { date: "2026-09-01", users: 20, sessions: 24, views: 46, conversions: 3 },
      { date: "2026-09-02", users: 10, sessions: 11, views: 25, conversions: 3 },
    ]);
    expect(report.bySource[0]).toEqual({ source: "google / organic", sessions: 26, conversions: 5 });
  });

  it("accepts French column names and semicolon-separated files", () => {
    const report = parseGa4Csv("Date;Utilisateurs actifs;Sessions;Vues\n01/09/2026;1 200;1 350;2 500");
    expect(report.rows[0]).toMatchObject({ date: "2026-09-01", users: 1200, sessions: 1350, views: 2500 });
  });

  it("reads source labels and shortened counts from the French GA4 overview", () => {
    const report = parseGa4Csv([
      "Source/Support de la session;Sessions;Utilisateurs actifs;Événements clés",
      "google / organic;6,6 k;4,5 k;0",
      "(direct) / (none);14 k;13 k;0",
    ].join("\n"));

    expect(report.totals).toEqual({ users: 17500, sessions: 20600, views: 0, conversions: 0 });
    expect(report.bySource[0]).toEqual({ source: "(direct) / (none)", sessions: 14000, conversions: 0 });
  });

  it("explains when the file has no recognized traffic metric", () => {
    expect(() => parseGa4Csv("Date,Source\n20260901,google")).toThrow("Aucune colonne de trafic reconnue");
  });
});

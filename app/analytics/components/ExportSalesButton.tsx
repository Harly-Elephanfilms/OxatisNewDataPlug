"use client";

import * as XLSX from "xlsx";
import type { SalesAnalysis } from "@/lib/oxatis-orders";
import { buildSalesWorkbook } from "../utils/salesWorkbook";

export function ExportSalesButton({ result }: { result: SalesAnalysis }) {
  const download = () => {
    const workbook = buildSalesWorkbook(result);
    XLSX.writeFile(workbook, `statistiques-ventes-${result.period.from}-${result.period.to}.xlsx`);
  };

  return (
    <button type="button" className="btn btn-secondary btn-sm" onClick={download}>
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5M12 15V3" />
      </svg>
      Télécharger Excel
    </button>
  );
}

// app/analytics/hooks/useSalesAnalysis.ts
"use client";
import { useState, useCallback } from "react";
import type { SalesAnalysis } from "@/lib/oxatis-orders";

type Status = "idle" | "loading" | "done" | "error";

interface Progress {
  done: number;
  total: number;
  errors: number;
}

interface UseSalesAnalysis {
  status: Status;
  progress: Progress;
  result: SalesAnalysis | null;
  error: string;
  analyze: (from: string, to: string) => void;
  reset: () => void;
}

export function useSalesAnalysis(): UseSalesAnalysis {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<Progress>({ done: 0, total: 0, errors: 0 });
  const [result, setResult] = useState<SalesAnalysis | null>(null);
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress({ done: 0, total: 0, errors: 0 });
    setResult(null);
    setError("");
  }, []);

  const analyze = useCallback((from: string, to: string) => {
    setStatus("loading");
    setProgress({ done: 0, total: 0, errors: 0 });
    setResult(null);
    setError("");

    const source = new EventSource(
      `/api/oxatis/orders/stream?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );

    source.onmessage = (e: MessageEvent) => {
      const payload = JSON.parse(e.data as string) as {
        type: string;
        count?: number;
        done?: number;
        total?: number;
        errors?: number;
        data?: SalesAnalysis;
        message?: string;
      };

      if (payload.type === "total") {
        setProgress((p) => ({ ...p, total: payload.count ?? 0 }));
      } else if (payload.type === "progress") {
        setProgress({
          done: payload.done ?? 0,
          total: payload.total ?? 0,
          errors: payload.errors ?? 0,
        });
      } else if (payload.type === "result") {
        setResult(payload.data ?? null);
        setStatus("done");
        source.close();
      } else if (payload.type === "error") {
        setError(payload.message ?? "Erreur inconnue");
        setStatus("error");
        source.close();
      }
    };

    source.onerror = () => {
      setError("Connexion interrompue. Vérifiez vos credentials et réessayez.");
      setStatus("error");
      source.close();
    };
  }, []);

  return { status, progress, result, error, analyze, reset };
}

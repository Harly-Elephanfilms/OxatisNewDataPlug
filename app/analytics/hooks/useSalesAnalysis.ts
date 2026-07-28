// app/analytics/hooks/useSalesAnalysis.ts
"use client";
import { useState, useCallback, useRef } from "react";
import type { SalesAnalysis } from "@/lib/oxatis-orders";

type Status = "idle" | "loading" | "done" | "error";

interface Progress {
  done: number;
  total: number;
  errors: number;
}

/** Info renvoyée quand le serveur a plafonné le nombre de commandes traitées. */
interface Truncation {
  processed: number;
  available: number;
}

interface UseSalesAnalysis {
  status: Status;
  progress: Progress;
  result: SalesAnalysis | null;
  truncated: Truncation | null;
  error: string;
  analyze: (from: string, to: string) => void;
  reset: () => void;
}

export function useSalesAnalysis(): UseSalesAnalysis {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<Progress>({ done: 0, total: 0, errors: 0 });
  const [result, setResult] = useState<SalesAnalysis | null>(null);
  const [truncated, setTruncated] = useState<Truncation | null>(null);
  const [error, setError] = useState("");
  const sourceRef = useRef<EventSource | null>(null);

  const reset = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
    setStatus("idle");
    setProgress({ done: 0, total: 0, errors: 0 });
    setResult(null);
    setTruncated(null);
    setError("");
  }, []);

  const analyze = useCallback((from: string, to: string) => {
    sourceRef.current?.close();

    setStatus("loading");
    setProgress({ done: 0, total: 0, errors: 0 });
    setResult(null);
    setTruncated(null);
    setError("");

    const source = new EventSource(
      `/api/oxatis/orders/stream?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    sourceRef.current = source;

    source.onmessage = (e: MessageEvent) => {
      let payload: {
        type: string;
        count?: number;
        done?: number;
        total?: number;
        errors?: number;
        data?: SalesAnalysis;
        message?: string;
        processed?: number;
        available?: number;
      };
      try {
        payload = JSON.parse(e.data as string);
      } catch {
        setError("Réponse serveur invalide.");
        setStatus("error");
        source.close();
        return;
      }

      if (payload.type === "total") {
        setProgress((p) => ({ ...p, total: payload.count ?? 0 }));
      } else if (payload.type === "truncated") {
        setTruncated({ processed: payload.processed ?? 0, available: payload.available ?? 0 });
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

  return { status, progress, result, truncated, error, analyze, reset };
}

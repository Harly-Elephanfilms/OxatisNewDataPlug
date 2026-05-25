import { useState, useCallback } from "react";
import type { Article } from "@/lib/types";

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/oxatis/fetch-articles");
      const data = await res.json() as { items?: Article[]; error?: string };
      if (data.items) {
        setArticles(data.items);
      } else {
        setError(data.error ?? "Erreur chargement articles");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  return { articles, setArticles, loading, error, fetchArticles };
}

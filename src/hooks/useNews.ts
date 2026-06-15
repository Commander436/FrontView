import { useEffect, useState, useCallback } from 'react';
import { fetchAggregatedNews } from '@/lib/newsFeeds';
import type { NewsArticle } from '@/types/news';

export function useNews(active: boolean) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchAggregatedNews(force);
      setArticles(items);
    } catch (e: any) {
      setError(e?.message || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    void load(false);
    const id = setInterval(() => void load(false), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [active, load]);

  return { articles, loading, error, reload: () => load(true) };
}
import { useState, useEffect } from 'react';
import { Ship } from '@/types/globe';
import { aisStore } from '@/lib/aisStore';

// Subscribes to the app-wide AIS store. The store starts streaming during the
// terminal intro, so by the time the user enters the globe view ships are
// already cached and hydrate instantly. Toggling the layer OFF/ON never wipes
// the underlying cache — only this hook's local state is cleared.
export function useAIS(enabled: boolean) {
  const [ships, setShips] = useState<Ship[]>(() => enabled ? aisStore.getSnapshot() : []);
  const [error, setError] = useState<string | null>(aisStore.error);

  useEffect(() => {
    if (!enabled) {
      setShips([]);
      return;
    }
    // Hydrate immediately from cache so the counter is never 0 on re-enable.
    setShips(aisStore.getSnapshot());
    const unsub = aisStore.subscribe(next => {
      setShips(next);
      setError(aisStore.error);
    });
    return unsub;
  }, [enabled]);

  return { ships, loading: false, error, wsConnected: aisStore.connected };
}

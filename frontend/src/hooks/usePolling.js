import { useState, useEffect, useCallback, useRef } from 'react';

export const usePolling = (fetchFn, interval = 2000, enabled = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const savedFetchFn = useRef(fetchFn);

  useEffect(() => {
    savedFetchFn.current = fetchFn;
  }, [fetchFn]);

  const fetchData = useCallback(async () => {
    try {
      const result = await savedFetchFn.current();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    fetchData(); // Initial fetch

    const id = setInterval(() => {
      fetchData();
    }, interval);

    return () => clearInterval(id);
  }, [fetchData, interval, enabled]);

  return { data, loading, error, refetch: fetchData };
};

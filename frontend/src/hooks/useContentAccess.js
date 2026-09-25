import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

// Fetches a short-lived (5-minute) streaming URL and refreshes it before it expires,
// so a long video doesn't hit an expired token mid-playback.
export function useContentAccess(lessonId) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState('');

  const fetchAccess = useCallback(async () => {
    try {
      const { data } = await api.post(`/content/${lessonId}/access`);
      setUrl(data.streamUrl);
      setError('');
      return data.expiresIn;
    } catch {
      setError('You do not have access to this lesson.');
      return null;
    }
  }, [lessonId]);

  useEffect(() => {
    let timer;
    fetchAccess().then((expiresIn) => {
      if (expiresIn) timer = setTimeout(fetchAccess, (expiresIn - 30) * 1000); // refresh 30s early
    });
    return () => clearTimeout(timer);
  }, [fetchAccess]);

  return { url, error };
}
import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

function buildStreamUrl(streamUrl) {
  if (!streamUrl) return null;

  // Backend may return an absolute URL.
  if (/^https?:\/\//i.test(streamUrl)) {
    return streamUrl;
  }

  // In production, VITE_API_URL should point to the Render backend,
  // for example: https://hrctech-api.onrender.com
  const apiRoot = (import.meta.env.VITE_API_URL || window.location.origin)
    .replace(/\/+$/, '');

  return `${apiRoot}${streamUrl.startsWith('/') ? streamUrl : `/${streamUrl}`}`;
}

export function useContentAccess(lessonId) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState('');

  const fetchAccess = useCallback(async () => {
    try {
      const { data } = await api.post(`/content/${lessonId}/access`);

      const streamUrl = buildStreamUrl(data.streamUrl);

      setUrl(streamUrl);
      setError('');

      return data.expiresIn;
    } catch (err) {
      console.error('Content access error:', err);
      setUrl(null);
      setError('You do not have access to this lesson.');
      return null;
    }
  }, [lessonId]);

  useEffect(() => {
    let timer;

    fetchAccess().then((expiresIn) => {
      if (expiresIn) {
        timer = setTimeout(
          fetchAccess,
          Math.max(1, expiresIn - 30) * 1000
        );
      }
    });

    return () => clearTimeout(timer);
  }, [fetchAccess]);

  return { url, error };
}
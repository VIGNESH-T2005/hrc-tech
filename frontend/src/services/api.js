import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true
}); // cookie carries the refresh token
let accessToken = null;
let onUnauthorized = () => {};

export function setAccessToken(token) { accessToken = token; }
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;

    // Never retry the refresh call itself — a 401 here just means "not logged in yet",
    // and retrying it would call /auth/refresh recursively.
    const isRefreshCall = config?.url?.includes('/auth/refresh');

    if (response?.status === 401 && !config._retried && !isRefreshCall) {
      config._retried = true;
      try {
        refreshPromise ??= api.post('/auth/refresh').finally(() => { refreshPromise = null; });
        const { data } = await refreshPromise;
        setAccessToken(data.accessToken);
        config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(config);
      } catch {
        setAccessToken(null);
        onUnauthorized();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
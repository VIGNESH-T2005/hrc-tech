import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setAccessToken, setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const clear = useCallback(() => { setAccessToken(null); setUser(null); }, []);

  useEffect(() => {
    setUnauthorizedHandler(clear);
    // Try a silent refresh on first load, since the httpOnly cookie may still be valid
    // even though this in-memory token was wiped by a page refresh.
    api.post('/auth/refresh')
      .then(({ data }) => { setAccessToken(data.accessToken); setUser(data.user); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [clear]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    await api.post('/auth/register', { name, email, password });
    return login(email, password);
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } finally { clear(); }
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
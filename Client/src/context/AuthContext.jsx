import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, setAuthToken } from '../utils/api';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Track whether we are already refreshing to avoid infinite loops
  const isRefreshing  = useRef(false);
  const interceptorId = useRef(null);

  const saveToken = (nextToken) => {
    setToken(nextToken);
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      setAuthToken(nextToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken('');
    }
  };

  const fetchMe = async (currentToken) => {
    const tkn = currentToken ?? token;
    if (!tkn) { setUser(null); setLoading(false); return; }
    try {
      setLoading(true);
      setAuthToken(tkn);
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      saveToken('');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh interceptor: on 401, call /auth/refresh, retry once
  useEffect(() => {
    if (interceptorId.current !== null) {
      api.interceptors.response.eject(interceptorId.current);
    }

    interceptorId.current = api.interceptors.response.use(
      (res) => res,
      async (err) => {
        const original = err.config;
        const is401    = err.response?.status === 401;
        const isRetry  = original._retry;
        const isRefreshEndpoint = original.url?.includes('/auth/refresh');

        if (is401 && !isRetry && !isRefreshEndpoint && !isRefreshing.current) {
          original._retry     = true;
          isRefreshing.current = true;
          try {
            const { data } = await api.post('/auth/refresh');
            saveToken(data.token);
            original.headers.Authorization = `Bearer ${data.token}`;
            return api(original);
          } catch {
            saveToken('');
            setUser(null);
            return Promise.reject(err);
          } finally {
            isRefreshing.current = false;
          }
        }
        return Promise.reject(err);
      }
    );

    return () => {
      if (interceptorId.current !== null) {
        api.interceptors.response.eject(interceptorId.current);
      }
    };
  }, []);

  useEffect(() => { fetchMe(); }, [token]);

  const loginWithToken = async (nextToken) => { saveToken(nextToken); };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    saveToken('');
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, loading, loginWithToken, logout, refetchUser: fetchMe }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
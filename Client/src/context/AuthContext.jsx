import { createContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken } from '../utils/api';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const fetchMe = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setAuthToken(token);
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (_error) {
      saveToken('');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, [token]);

  const loginWithToken = async (nextToken) => {
    saveToken(nextToken);
  };

  const logout = () => {
    saveToken('');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      loginWithToken,
      logout,
      refetchUser: fetchMe,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
import { useState, useEffect, useCallback } from 'react';
import { apiFetch, getOwnerToken, setOwnerToken } from '../utils/api.js';

export interface AuthUser {
  username: string;
  role: 'owner' | 'guest';
  displayName: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    try {
      const token = getOwnerToken();
      if (!token) {
        setUser({ username: 'guest', role: 'guest', displayName: 'Pengunjung' });
        setIsOwner(false);
        setIsLoading(false);
        return;
      }

      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.role === 'owner') {
          setUser(data.user);
          setIsOwner(true);
        } else {
          setOwnerToken(null);
          setUser({ username: 'guest', role: 'guest', displayName: 'Pengunjung' });
          setIsOwner(false);
        }
      } else {
        setOwnerToken(null);
        setUser({ username: 'guest', role: 'guest', displayName: 'Pengunjung' });
        setIsOwner(false);
      }
    } catch (e) {
      setUser({ username: 'guest', role: 'guest', displayName: 'Pengunjung' });
      setIsOwner(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Username atau password salah' };
      }

      setOwnerToken(data.token);
      setUser(data.user);
      setIsOwner(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal terhubung ke server' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setOwnerToken(null);
      setUser({ username: 'guest', role: 'guest', displayName: 'Pengunjung' });
      setIsOwner(false);
      setIsLoading(false);
    }
  };

  return {
    user,
    isOwner,
    isLoading,
    login,
    logout,
    checkAuth,
  };
}

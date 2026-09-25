import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { User } from "../types/models";
import { loginRequest, registerRequest, fetchCurrentUser } from "../api/auth";
import { ApiRequestError } from "../api/client";
import { saveAuthToken, getAuthToken, saveStoredUser, getStoredUser, clearAuthStorage } from "../utils/storage";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On app launch, check for a persisted token and validate it against the
  // server before deciding where to navigate (see SplashScreen).
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getAuthToken();
        const storedUserJson = await getStoredUser();

        if (storedToken) {
          setToken(storedToken);
          if (storedUserJson) {
            setUser(JSON.parse(storedUserJson));
          }
          const freshUser = await fetchCurrentUser();
          setUser(freshUser);
          await saveStoredUser(JSON.stringify(freshUser));
        }
      } catch {
        // Token invalid/expired - clear everything and fall back to login.
        await clearAuthStorage();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const result = await loginRequest({ email, password });
      await saveAuthToken(result.token);
      await saveStoredUser(JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Unable to sign in. Please try again.";
      setError(message);
      throw err;
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    setError(null);
    try {
      const result = await registerRequest({ username, email, password });
      await saveAuthToken(result.token);
      await saveStoredUser(JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Unable to create your account.";
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await clearAuthStorage();
    setToken(null);
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({ user, token, isLoading, error, login, register, logout, clearError }),
    [user, token, isLoading, error, login, register, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

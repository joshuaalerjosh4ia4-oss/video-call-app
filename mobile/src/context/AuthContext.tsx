import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { User } from "../types/models";
import {
  changePasswordRequest,
  fetchCurrentUser,
  loginRequest,
  registerRequest,
  RegistrationInput,
} from "../api/auth";
import { ApiRequestError } from "../api/client";
import { saveAuthToken, getAuthToken, saveStoredUser, getStoredUser, clearAuthStorage } from "../utils/storage";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: RegistrationInput) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
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
      return result.user.mustChangePassword === true;
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Unable to sign in. Please try again.";
      setError(message);
      throw err;
    }
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    setError(null);
    try {
      await changePasswordRequest({ newPassword });
      if (user) {
        const updatedUser = { ...user, mustChangePassword: false };
        setUser(updatedUser);
        await saveStoredUser(JSON.stringify(updatedUser));
      }
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Unable to change your password. Please try again.";
      setError(message);
      throw err;
    }
  }, [user]);

  const register = useCallback(async (input: RegistrationInput) => {
    setError(null);
    try {
      await registerRequest(input);
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
    () => ({ user, token, isLoading, error, login, register, changePassword, logout, clearError }),
    [user, token, isLoading, error, login, register, changePassword, logout, clearError]
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

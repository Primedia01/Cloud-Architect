/**
 * @file Authentication context provider for the application.
 * Manages user session state, login/logout flows, and role-based access control
 * using React Context and localStorage for persistence.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { User } from "@shared/schema";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

/** User type with the password field omitted for client-side security. */
type AuthUser = Omit<User, "password">;

/**
 * Shape of the authentication context value.
 * Provides the current user, loading state, login/logout actions, and role checking.
 */
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Provides authentication state to the component tree.
 * Restores the user session from localStorage on mount and exposes
 * login, logout, and role-checking utilities via context.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("ooh_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  /** Authenticates the user, stores their data in localStorage, and updates state. */
  const login = useCallback(async (username: string, password: string) => {
    const result = await api.post<AuthUser>("/api/auth/login", { username, password });
    localStorage.setItem("ooh_user_id", result.id);
    localStorage.setItem("ooh_user", JSON.stringify(result));
    setUser(result);
  }, []);

  /** Clears user data from localStorage, resets state, and invalidates the React Query cache. */
  const logout = useCallback(() => {
    localStorage.removeItem("ooh_user_id");
    localStorage.removeItem("ooh_user");
    setUser(null);
    queryClient.clear();
  }, []);

  /** Returns true if the current user holds any of the specified roles. */
  const hasRole = useCallback(
    (...roles: string[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Accesses the authentication context. Must be used within an AuthProvider. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

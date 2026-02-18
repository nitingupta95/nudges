"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

// ============================================
// TYPES
// ============================================

interface User {
  id: string;
  name: string;
  email: string;
  role: "MEMBER" | "RECRUITER" | "ADMIN";
  createdAt?: string;
}

interface MemberProfile {
  id: string;
  userId: string;
  skills: string[];
  pastCompanies: string[];
  domains: string[];
  experienceLevel: string;
  yearsOfExperience: number;
  currentCompany?: string;
  currentTitle?: string;
  location?: string;
  preferredDomains: string[];
  preferredRoles: string[];
  isOpenToRefer: boolean;
  profileCompleteness: number;
}

interface AuthContextType {
  user: User | null;
  profile: MemberProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: "MEMBER" | "RECRUITER") => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<MemberProfile>) => Promise<void>;
  clearError: () => void;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = useMemo(() => !!user, [user]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Fetch current user
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/users/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return data.user;
      } else if (response.status === 401) {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
    return null;
  }, []);

  // Fetch member profile
  const refreshProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/users/me/profile", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        return data;
      }
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
    return null;
  }, []);

  // Initial auth check
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const userData = await refreshUser();
        if (userData) {
          await refreshProfile();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshUser, refreshProfile]);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }

      const data = await response.json();
      setUser(data.user);

      // Fetch profile after login
      await refreshProfile();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  // Signup
  const signup = useCallback(async (name: string, email: string, password: string, role?: "MEMBER" | "RECRUITER") => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, role: role || "MEMBER" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Signup failed");
      }

      const data = await response.json();
      setUser(data.user);

      // Fetch profile after signup
      await refreshProfile();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  // Logout
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data: Partial<MemberProfile>) => {
    setError(null);

    try {
      const response = await fetch("/api/users/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      setError(message);
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      isAuthenticated,
      isLoading,
      error,
      login,
      signup,
      logout,
      refreshUser,
      refreshProfile,
      updateProfile,
      clearError,
    }),
    [
      user,
      profile,
      isAuthenticated,
      isLoading,
      error,
      login,
      signup,
      logout,
      refreshUser,
      refreshProfile,
      updateProfile,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// HOOK
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
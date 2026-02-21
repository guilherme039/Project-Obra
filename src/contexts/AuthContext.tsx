import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthState } from "@/types/erp";
import { login as doLogin, logout as doLogout, getSession, initializeData } from "@/services/api";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeData();
        const session = getSession();
        if (session) {
          setAuthState({ user: session, isAuthenticated: true });
        }
      } catch {
        // sessão pode vir do localStorage; não poluir console
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await doLogin(email, password);
      if (user) {
        setAuthState({ user, isAuthenticated: true });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    doLogout();
    setAuthState({ user: null, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

import { Outlet, Navigate } from "react-router-dom";

export function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}

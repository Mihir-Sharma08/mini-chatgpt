import { createContext, useCallback, useEffect, useState } from "react";
import * as api from "../services/api";

export const AuthContext = createContext(null);

const TOKEN_KEY = "mini-chatgpt-token";

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Storage may be unavailable (private mode); the session just won't persist.
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [sessionNotice, setSessionNotice] = useState(null);

  const clearSession = useCallback(() => {
    writeToken(null);
    api.setAuthToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      clearSession();
      setSessionNotice("Your session has expired. Please log in again.");
    });

    const token = readToken();
    if (!token) {
      setIsAuthLoading(false);
      return undefined;
    }

    api.setAuthToken(token);
    let cancelled = false;

    api
      .fetchMe()
      .then((currentUser) => {
        if (!cancelled) setUser(currentUser);
      })
      .catch(() => {
        // A 401 is already handled by the unauthorized handler above.
        // Other failures (e.g. server offline) just leave the user logged out for now.
      })
      .finally(() => {
        if (!cancelled) setIsAuthLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const startSession = ({ token, user: loggedInUser }) => {
    writeToken(token);
    api.setAuthToken(token);
    setSessionNotice(null);
    setUser(loggedInUser);
  };

  const login = async (credentials) => startSession(await api.loginUser(credentials));
  const register = async (details) => startSession(await api.registerUser(details));

  const value = { user, isAuthLoading, sessionNotice, login, register, logout: clearSession };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
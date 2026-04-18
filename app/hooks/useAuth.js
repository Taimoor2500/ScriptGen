"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Holds the auth state for the session. `user` is the logged-in user (or null),
 * `loading` is true while we're still resolving /api/auth/me on first mount.
 *
 * All mutating calls refresh history via the provided callback so the
 * sidebar stays in sync without the caller having to orchestrate it.
 */
export function useAuth({ onAuthChange } = {}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const signup = useCallback(async (email, password) => {
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Signup failed.");
      return false;
    }
    setUser(data.user);
    onAuthChange?.(data.user);
    return true;
  }, [onAuthChange]);

  const login = useCallback(async (email, password) => {
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Login failed.");
      return false;
    }
    setUser(data.user);
    onAuthChange?.(data.user);
    return true;
  }, [onAuthChange]);

  const logout = useCallback(async () => {
    setError("");
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    onAuthChange?.(null);
  }, [onAuthChange]);

  return { user, loading, error, signup, login, logout };
}

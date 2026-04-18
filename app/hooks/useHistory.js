"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Loads and exposes the current user's last-3 search history. When the user
 * changes (login/logout), `refresh` gets called; when a brand-new search
 * lands we also refresh so the sidebar stays current.
 */
export function useHistory(user) {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setSearches([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/history", { credentials: "include" });
      const data = await res.json();
      setSearches(Array.isArray(data?.searches) ? data.searches : []);
    } catch {
      setSearches([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { searches, loading, refresh };
}

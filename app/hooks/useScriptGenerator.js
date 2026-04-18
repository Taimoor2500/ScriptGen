"use client";

import { useCallback, useState } from "react";

/**
 * Encapsulates the lifecycle of a single script-generation request:
 * input state, loading state, error state, response metadata.
 *
 * Optional `onSaved` callback fires after a successful generate that
 * persisted to history — the page uses it to refresh the history sidebar.
 */
export function useScriptGenerator({ onSaved } = {}) {
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState("");
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");

  const generate = useCallback(async ({ prompt, tone, length }) => {
    if (!prompt.trim()) {
      setError("Give it an idea to run with.");
      return;
    }
    setError("");
    setScript("");
    setMeta(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt, tone, length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      setScript(data.script);
      setMeta({
        wordCount: data.wordCount,
        targetWords: data.targetWords,
        model: data.model,
        usage: data.usage,
      });
      if (data.savedSearchId) onSaved?.();
    } catch (err) {
      setError(err.message || "Failed to generate script.");
    } finally {
      setLoading(false);
    }
  }, [onSaved]);

  /**
   * Hydrate the output panel from a saved search — no API call, just state.
   * Used when the user clicks a row in the history sidebar.
   */
  const hydrateFromSaved = useCallback((saved) => {
    if (!saved) return;
    setError("");
    setLoading(false);
    setScript(saved.script);
    setMeta({
      wordCount: saved.wordCount,
      targetWords: saved.targetWords,
      model: saved.model,
      usage: null, // historical usage isn't stored
    });
  }, []);

  const reset = useCallback(() => {
    setScript("");
    setMeta(null);
    setError("");
  }, []);

  return { loading, script, meta, error, generate, hydrateFromSaved, reset };
}

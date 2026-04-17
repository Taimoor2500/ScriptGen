"use client";

import { useCallback, useState } from "react";

/**
 * Encapsulates the lifecycle of a single script-generation request:
 * input state, loading state, error state, response metadata.
 *
 * Keeping this in a hook makes the root page component a pure layout file.
 */
export function useScriptGenerator() {
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
    } catch (err) {
      setError(err.message || "Failed to generate script.");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setScript("");
    setMeta(null);
    setError("");
  }, []);

  return { loading, script, meta, error, generate, reset };
}

"use client";

import { useState } from "react";
import { EmptyState } from "./EmptyState.jsx";
import { LoadingSkeleton } from "./LoadingSkeleton.jsx";
import { TONES, LENGTHS } from "../constants.js";

/**
 * Right-side output card. Displays either the generated script, a loading
 * skeleton, or the empty state — plus copy/download actions.
 */
export function ScriptCard({ script, loading, meta, tone, length, prompt }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (!script) return;
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function onDownload() {
    if (!script) return;
    const safe = (prompt || "script")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);
    const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safe || "script"}-${length}min.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const toneLabel = TONES.find((t) => t.value === tone)?.label || tone;
  const lengthWords = LENGTHS.find((l) => l.value === length)?.words || 0;

  return (
    <div className="md:col-span-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md shadow-xl shadow-black/20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Your script</h2>
          <p className="text-xs text-white/50">
            {meta
              ? `${meta.wordCount} words · target ~${meta.targetWords} · ${length}-min · ${toneLabel}`
              : `Target ~${lengthWords} words · ${length}-min · ${toneLabel}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCopy}
            disabled={!script}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={onDownload}
            disabled={!script}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download .txt
          </button>
        </div>
      </div>

      <div className="min-h-[320px] rounded-xl border border-white/10 bg-black/30 p-5">
        {loading && !script && <LoadingSkeleton />}
        {!loading && !script && <EmptyState />}
        {script && (
          <article className="script-prose text-[15px] text-white/90">{script}</article>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

const TONES = [
  { value: "dramatic", label: "Dramatic", hint: "Cinematic, emotional, high-stakes" },
  { value: "neutral", label: "Neutral", hint: "Informative and balanced" },
  { value: "uplifting", label: "Uplifting", hint: "Hopeful, positive, energetic" },
];

const LENGTHS = [
  { value: 1, label: "1 min", words: 150 },
  { value: 3, label: "3 min", words: 450 },
  { value: 5, label: "5 min", words: 750 },
  { value: 10, label: "10 min", words: 1500 },
];

const EXAMPLES = [
  "The life and death of Cleopatra",
  "Why octopuses might be the smartest animals on Earth",
  "How the 2008 financial crisis actually happened",
  "A beginner's guide to making sourdough bread",
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("dramatic");
  const [length, setLength] = useState(3);
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState("");
  const [meta, setMeta] = useState(null); // { wordCount, targetWords, model }
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const targetWords = useMemo(
    () => LENGTHS.find((l) => l.value === length)?.words ?? 450,
    [length]
  );

  const wordCount = useMemo(
    () => (script ? script.trim().split(/\s+/).filter(Boolean).length : 0),
    [script]
  );

  async function onGenerate(e) {
    e?.preventDefault();
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
      if (!res.ok) throw new Error(data?.error || "Something went wrong");
      setScript(data.script);
      setMeta({
        wordCount: data.wordCount,
        targetWords: data.targetWords,
        model: data.model,
      });
    } catch (err) {
      setError(err.message || "Failed to generate script");
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    if (!script) return;
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function onDownload() {
    if (!script) return;
    const safe = (prompt || "script").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-10 md:py-16">
      <header className="mb-10 md:mb-14">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-rose-500 text-white shadow-lg shadow-fuchsia-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">ScriptGen</h1>
            <p className="text-xs text-white/50 md:text-sm">AI video script generator — idea in, script out.</p>
          </div>
        </div>
      </header>

      <section className="grid gap-8 md:grid-cols-5">
        {/* Input card */}
        <form
          onSubmit={onGenerate}
          className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md shadow-xl shadow-black/20"
        >
          <label className="block text-sm font-medium text-white/80">
            Your idea
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder={`e.g. "${EXAMPLES[0]}"`}
            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-[15px] text-white placeholder:text-white/30 outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                type="button"
                key={ex}
                onClick={() => setPrompt(ex)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white"
              >
                {ex}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium text-white/80">Tone</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {TONES.map((t) => {
                const active = tone === t.value;
                return (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={
                      "rounded-xl border px-3 py-2.5 text-left text-sm transition " +
                      (active
                        ? "border-fuchsia-400/60 bg-fuchsia-500/10 text-white shadow-inner shadow-fuchsia-500/10"
                        : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.06]")
                    }
                  >
                    <div className="font-medium">{t.label}</div>
                    <div className="mt-0.5 text-[11px] leading-tight text-white/50">{t.hint}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium text-white/80">Length</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {LENGTHS.map((l) => {
                const active = length === l.value;
                return (
                  <button
                    type="button"
                    key={l.value}
                    onClick={() => setLength(l.value)}
                    className={
                      "rounded-xl border px-2 py-2.5 text-sm transition " +
                      (active
                        ? "border-indigo-400/60 bg-indigo-500/10 text-white shadow-inner shadow-indigo-500/10"
                        : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.06]")
                    }
                  >
                    <div className="font-medium">{l.label}</div>
                    <div className="text-[11px] text-white/50">~{l.words} words</div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <Spinner />
                Writing your script…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
                Generate script
              </>
            )}
          </button>

          {error && (
            <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </div>
          )}

          <p className="mt-4 text-[11px] text-white/40">
            Powered by Claude. Your API key stays server-side.
          </p>
        </form>

        {/* Output card */}
        <div className="md:col-span-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md shadow-xl shadow-black/20">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Your script</h2>
              <p className="text-xs text-white/50">
                {meta
                  ? `${meta.wordCount} words · target ~${meta.targetWords} · ${length}-min read · ${capitalize(tone)}`
                  : `Target ~${targetWords} words · ${length}-min read · ${capitalize(tone)}`}
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

          <div className="rounded-xl border border-white/10 bg-black/30 p-5 min-h-[320px]">
            {loading && !script && <LoadingSkeleton />}
            {!loading && !script && <EmptyState />}
            {script && (
              <article className="script-prose text-[15px] text-white/90">
                {script}
              </article>
            )}
          </div>
          {meta?.model && (
            <p className="mt-3 text-[11px] text-white/30">Model: {meta.model}</p>
          )}
        </div>
      </section>
    </main>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white/50">
          <path d="M4 6h16M4 12h10M4 18h16" />
        </svg>
      </div>
      <p className="text-sm text-white/60">Your generated script will appear here.</p>
      <p className="mt-1 text-xs text-white/40">Enter an idea on the left to get started.</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-white/5"
          style={{ width: `${60 + Math.round(Math.random() * 35)}%` }}
        />
      ))}
    </div>
  );
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

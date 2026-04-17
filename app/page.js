"use client";

import { useMemo, useState } from "react";
import { Header } from "./components/Header.jsx";
import { IdeaInput } from "./components/IdeaInput.jsx";
import { OptionGrid } from "./components/OptionGrid.jsx";
import { GenerateButton } from "./components/GenerateButton.jsx";
import { ScriptCard } from "./components/ScriptCard.jsx";
import { useScriptGenerator } from "./hooks/useScriptGenerator.js";
import { DEFAULTS, TONES, LENGTHS } from "./constants.js";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState(DEFAULTS.tone);
  const [length, setLength] = useState(DEFAULTS.length);

  const { loading, script, meta, error, generate } = useScriptGenerator();

  const lastSubmission = useMemo(
    () => ({ prompt, tone, length }),
    [prompt, tone, length]
  );

  function onSubmit(e) {
    e.preventDefault();
    generate(lastSubmission);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-10 md:py-16">
      <Header />

      <section className="grid gap-8 md:grid-cols-5">
        <form
          onSubmit={onSubmit}
          className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-xl shadow-black/20 backdrop-blur-md"
        >
          <IdeaInput value={prompt} onChange={setPrompt} />

          <OptionGrid
            label="Tone"
            options={TONES}
            value={tone}
            onChange={setTone}
            cols="three"
            accent="fuchsia"
          />

          <OptionGrid
            label="Length"
            options={LENGTHS}
            value={length}
            onChange={setLength}
            cols="four"
            accent="indigo"
          />

          <GenerateButton loading={loading} />

          {error && (
            <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </div>
          )}

          <p className="mt-4 text-[11px] text-white/40">
            Powered by Claude. Your API key stays server-side.
          </p>
        </form>

        <ScriptCard
          script={script}
          loading={loading}
          meta={meta}
          tone={tone}
          length={length}
          prompt={prompt}
        />
      </section>

      <footer className="mt-10 flex flex-col items-center gap-1 text-[11px] text-white/30">
        <span>Tone skills load from /skills at boot.</span>
      </footer>
    </main>
  );
}

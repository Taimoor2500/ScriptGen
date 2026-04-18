"use client";

import { useMemo, useState } from "react";
import { Header } from "./components/Header.jsx";
import { IdeaInput } from "./components/IdeaInput.jsx";
import { OptionGrid } from "./components/OptionGrid.jsx";
import { GenerateButton } from "./components/GenerateButton.jsx";
import { ScriptCard } from "./components/ScriptCard.jsx";
import { AuthMenu } from "./components/AuthMenu.jsx";
import { HistoryList } from "./components/HistoryList.jsx";
import { useScriptGenerator } from "./hooks/useScriptGenerator.js";
import { useAuth } from "./hooks/useAuth.js";
import { useHistory } from "./hooks/useHistory.js";
import { DEFAULTS, TONES, LENGTHS } from "./constants.js";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState(DEFAULTS.tone);
  const [length, setLength] = useState(DEFAULTS.length);

  // Auth first so we can hand `user` to the history hook.
  const auth = useAuth({});
  const history = useHistory(auth.user);

  // After a successful generate we refresh the history list so the new row
  // shows up in the sidebar without the user having to reload.
  const { loading, script, meta, error, generate, hydrateFromSaved } = useScriptGenerator({
    onSaved: history.refresh,
  });

  const lastSubmission = useMemo(
    () => ({ prompt, tone, length }),
    [prompt, tone, length]
  );

  function onSubmit(e) {
    e.preventDefault();
    generate(lastSubmission);
  }

  function onSelectSaved(s) {
    setPrompt(s.prompt);
    setTone(s.tone);
    setLength(s.length);
    hydrateFromSaved(s);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-10 md:py-16">
      <Header
        right={
          <AuthMenu
            user={auth.user}
            loading={auth.loading}
            error={auth.error}
            onLogin={auth.login}
            onSignup={auth.signup}
            onLogout={auth.logout}
          />
        }
      />

      <section className="grid gap-8 md:grid-cols-5">
        <div className="md:col-span-2">
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-xl shadow-black/20 backdrop-blur-md"
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
          </form>

          <HistoryList
            user={auth.user}
            searches={history.searches}
            onSelect={onSelectSaved}
          />
        </div>

        <ScriptCard
          script={script}
          loading={loading}
          meta={meta}
          tone={tone}
          length={length}
          prompt={prompt}
        />
      </section>
    </main>
  );
}

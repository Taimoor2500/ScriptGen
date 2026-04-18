"use client";

import { useState } from "react";

/**
 * Minimal inline auth panel shown in the header dropdown. Two modes — login
 * and signup — toggled by a link. Displays the server's error message
 * verbatim (our server errors are already user-safe).
 */
export function AuthPanel({ onLogin, onSignup, error }) {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "login") await onLogin(email, password);
      else await onSignup(email, password);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-72 rounded-xl border border-white/10 bg-neutral-900/95 p-4 shadow-xl shadow-black/40">
      <p className="mb-3 text-sm font-medium text-white/80">
        {mode === "login" ? "Sign in" : "Create account"}
      </p>

      <label className="mb-2 block text-[11px] uppercase tracking-wider text-white/40">Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        className="mb-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400/50"
      />

      <label className="mb-2 block text-[11px] uppercase tracking-wider text-white/40">Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        className="mb-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400/50"
      />

      {error && (
        <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-fuchsia-500/90 px-3 py-2 text-sm font-medium text-white transition hover:bg-fuchsia-500 disabled:opacity-50"
      >
        {busy
          ? mode === "login"
            ? "Signing in…"
            : "Signing up…"
          : mode === "login"
            ? "Sign in"
            : "Sign up"}
      </button>

      <p className="mt-3 text-center text-xs text-white/50">
        {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-fuchsia-300 hover:underline"
        >
          {mode === "login" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </form>
  );
}

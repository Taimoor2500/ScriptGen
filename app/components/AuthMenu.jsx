"use client";

import { useEffect, useRef, useState } from "react";
import { AuthPanel } from "./AuthPanel.jsx";

/**
 * Header widget that either (a) shows the signed-in user's email + a logout
 * button, or (b) shows a "Sign in" button that opens the AuthPanel dropdown.
 * Anonymous usage remains supported — nothing here blocks the generate flow.
 */
export function AuthMenu({ user, loading, error, onLogin, onSignup, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (loading) {
    return <div className="h-8 w-20 animate-pulse rounded-lg bg-white/[0.06]" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-white/60 md:inline">{user.email}</span>
        <button
          onClick={onLogout}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/[0.08]"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/[0.08]"
      >
        Sign in
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2">
          <AuthPanel
            onLogin={async (e, p) => {
              const ok = await onLogin(e, p);
              if (ok) setOpen(false);
            }}
            onSignup={async (e, p) => {
              const ok = await onSignup(e, p);
              if (ok) setOpen(false);
            }}
            error={error}
          />
        </div>
      )}
    </div>
  );
}

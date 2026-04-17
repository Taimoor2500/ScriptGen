"use client";

import { EXAMPLES } from "../constants.js";

export function IdeaInput({ value, onChange }) {
  return (
    <>
      <label className="block text-sm font-medium text-white/80">Your idea</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={`e.g. "${EXAMPLES[0]}"`}
        className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-[15px] text-white placeholder:text-white/30 outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            type="button"
            key={ex}
            onClick={() => onChange(ex)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white"
          >
            {ex}
          </button>
        ))}
      </div>
    </>
  );
}

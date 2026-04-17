"use client";

/**
 * Reusable pill-style picker used by the Tone, Format, and Length selectors.
 * Extracted so the three selectors stay presentational and focused.
 *
 * Props:
 *  - label:        field label
 *  - options:      [{ value, label, hint? }]
 *  - value:        currently-selected value
 *  - onChange:     setter
 *  - cols:         tailwind grid-cols class suffix (e.g. "3" or "2 sm:grid-cols-3")
 *  - accent:       "fuchsia" | "indigo" | "emerald"
 */
const ACCENTS = {
  fuchsia: "border-fuchsia-400/60 bg-fuchsia-500/10 shadow-inner shadow-fuchsia-500/10",
  indigo: "border-indigo-400/60 bg-indigo-500/10 shadow-inner shadow-indigo-500/10",
  emerald: "border-emerald-400/60 bg-emerald-500/10 shadow-inner shadow-emerald-500/10",
};

// Predefined grid classes — Tailwind's JIT only picks up classes it can see
// literally in source, so we enumerate the ones we actually use.
const GRID_COLS = {
  two: "grid-cols-2",
  three: "grid-cols-3",
  four: "grid-cols-4",
  twoSmThree: "grid-cols-2 sm:grid-cols-3",
};

export function OptionGrid({ label, options, value, onChange, cols = "three", accent = "fuchsia" }) {
  const activeClasses = ACCENTS[accent] || ACCENTS.fuchsia;
  const gridCols = GRID_COLS[cols] || GRID_COLS.three;
  return (
    <div className="mt-5">
      <label className="block text-sm font-medium text-white/80">{label}</label>
      <div className={`mt-2 grid gap-2 ${gridCols}`}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              type="button"
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              className={
                "rounded-xl border px-3 py-2.5 text-left text-sm transition " +
                (active
                  ? `${activeClasses} text-white`
                  : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.06]")
              }
            >
              <div className="font-medium">{opt.label}</div>
              {opt.hint && (
                <div className="mt-0.5 text-[11px] leading-tight text-white/50">{opt.hint}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

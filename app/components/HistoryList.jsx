"use client";

import { TONES, LENGTHS } from "../constants.js";

/**
 * Collapsed list of the current user's last 3 searches. Clicking a row
 * hydrates the output panel via the `onSelect` callback — no new API call.
 * Hidden entirely when the user isn't logged in so it doesn't take up
 * space for anonymous visitors.
 */
export function HistoryList({ user, searches, onSelect }) {
  if (!user) return null;

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-white/80">Recent scripts</h2>
        <span className="text-[11px] text-white/40">Last 3 saved</span>
      </div>

      {searches.length === 0 ? (
        <p className="text-xs text-white/40">
          No saved scripts yet — generate one and it'll land here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {searches.map((s) => (
            <HistoryRow key={s.id} search={s} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </section>
  );
}

function HistoryRow({ search, onSelect }) {
  const toneLabel = TONES.find((t) => t.value === search.tone)?.label || search.tone;
  const lengthLabel =
    LENGTHS.find((l) => l.value === search.length)?.label || `${search.length}m`;
  const when = formatAgo(search.createdAt);

  return (
    <li>
      <button
        onClick={() => onSelect(search)}
        className="group w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left transition hover:border-white/20 hover:bg-black/40"
      >
        <p className="line-clamp-1 text-sm text-white/90 group-hover:text-white">
          {search.prompt}
        </p>
        <p className="mt-1 text-[11px] text-white/40">
          {toneLabel} · {lengthLabel} · {search.wordCount} words · {when}
        </p>
      </button>
    </li>
  );
}

function formatAgo(ts) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

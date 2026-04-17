"use client";

import { Spinner, ArrowRightIcon } from "./icons.jsx";

export function GenerateButton({ loading, onClick }) {
  return (
    <button
      type="submit"
      disabled={loading}
      onClick={onClick}
      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? (
        <>
          <Spinner />
          Writing your script…
        </>
      ) : (
        <>
          <ArrowRightIcon className="h-4 w-4" />
          Generate script
        </>
      )}
    </button>
  );
}

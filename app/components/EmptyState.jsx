import { LinesIcon } from "./icons.jsx";

export function EmptyState() {
  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
        <LinesIcon className="h-6 w-6 text-white/50" />
      </div>
      <p className="text-sm text-white/60">Your generated script will appear here.</p>
      <p className="mt-1 text-xs text-white/40">Enter an idea on the left to get started.</p>
    </div>
  );
}

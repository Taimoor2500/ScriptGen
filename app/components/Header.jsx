import { PlayIcon } from "./icons.jsx";

export function Header({ right = null }) {
  return (
    <header className="mb-10 flex items-start justify-between gap-4 md:mb-14">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-rose-500 text-white shadow-lg shadow-fuchsia-500/20">
          <PlayIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">ScriptGen</h1>
          <p className="text-xs text-white/50 md:text-sm">
            AI video script generator — idea in, script out.
          </p>
        </div>
      </div>
      {right && <div className="pt-1">{right}</div>}
    </header>
  );
}

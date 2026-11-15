import React from "react";
import { Lightbulb, Tv, Volume2, Play } from "lucide-react";

export const App: React.FC = () => {
  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex h-12 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-sm">
            LS
          </div>
          <span className="font-semibold tracking-wide text-sm text-slate-200">
            Light Stage
          </span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
            v0.1.0
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>LX: 0</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-400">
            <Tv className="h-3.5 w-3.5" />
            <span>VX: 0</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Volume2 className="h-3.5 w-3.5" />
            <span>SQ: 0</span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center max-w-md shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
            <Play className="h-6 w-6 ml-0.5" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Live Stage Coordination</h2>
          <p className="text-sm text-slate-400 mb-6">
            Dual View (Cue Rundown & Timeline Tracks) + 2D Virtual Stage Engine.
          </p>
          <div className="inline-flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ready for Show Import</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

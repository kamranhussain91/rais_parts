"use client";

import dynamic from "next/dynamic";

// The whole POS is a client SPA (browser storage, tab state, charts). Load it
// client-only so nothing touches `window` during server rendering.
const App = dynamic(() => import("@/App"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-slate-50 text-slate-800 flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-4 border-t-red-600 border-slate-200 animate-spin" />
      <span className="text-[11px] font-mono font-bold tracking-widest text-slate-500 uppercase">
        Loading…
      </span>
    </div>
  ),
});

export default function Page() {
  return <App />;
}

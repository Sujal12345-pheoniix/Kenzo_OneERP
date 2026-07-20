"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-6">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-xl p-8 text-center flex flex-col items-center">
        <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-5 shadow-sm">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Portal Workspace Sync</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Your session or portal view was updated. Please refresh your session or return to the login portal.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full mt-6">
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-sky-600/10"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reload View
          </button>
          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-200"
          >
            <Home className="h-3.5 w-3.5" /> Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

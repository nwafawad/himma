"use client";

import React, { useState } from "react";
import { WifiOff, RefreshCw, BookOpen, Clock, CloudOff } from "lucide-react";
import Link from "next/link";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const { pendingDrafts, isSyncing, syncError, syncDrafts } = useOfflineSync();

  const handleRetry = async () => {
    setIsRetrying(true);
    if (navigator.onLine) {
      await syncDrafts();
      window.location.href = "/dashboard";
    } else {
      setTimeout(() => setIsRetrying(false), 1200);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 border border-indigo-100 shadow-sm">
        <WifiOff className="w-8 h-8" />
      </div>

      <h1 className="text-4xl font-serif italic text-charcoal mb-2">You are currently offline</h1>
      <p className="text-charcoal-muted max-w-md mb-8 leading-relaxed">
        Entries captured while offline stay on this device and sync the next time Momentum reconnects.
      </p>

      {syncError && (
        <div role="alert" className="mb-6 w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {syncError}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
        <button
          onClick={handleRetry}
          disabled={isRetrying || isSyncing}
          className="inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-charcoal hover:bg-black text-white font-medium transition-all shadow-md active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying || isSyncing ? "animate-spin" : ""}`} />
          {isRetrying || isSyncing ? "Checking connection…" : "Retry connection"}
        </button>

        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-xl bg-charcoal hover:bg-black text-white font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2"
        >
          Return to journal
        </Link>
      </div>

      {pendingDrafts.length > 0 && (
        <div className="w-full max-w-lg bg-card border border-border-light rounded-2xl p-6 text-left shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Pending entries ({pendingDrafts.length})
            </h2>
            <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full inline-flex items-center gap-1">
              <CloudOff className="h-3 w-3" aria-hidden="true" />
              Waiting to sync
            </span>
          </div>

          <div className="space-y-3">
            {pendingDrafts.map((draft) => (
              <div key={draft.id} className="p-3.5 bg-card-muted/60 rounded-xl border border-border-light">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-charcoal">{draft.title || "Untitled reflection"}</h3>
                  <span className="text-xs text-charcoal-muted flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(draft.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {draft.content && <p className="text-sm text-charcoal-muted line-clamp-2">{draft.content}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

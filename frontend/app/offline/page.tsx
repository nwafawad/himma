"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw, BookOpen, Clock } from "lucide-react";
import Link from "next/link";

interface PendingDraft {
  id: string;
  topic: string;
  durationMinutes: number;
  notes: string;
  timestamp: number;
}

export default function OfflinePage() {
  const [offlineDrafts, setOfflineDrafts] = useState<PendingDraft[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("momentum_offline_drafts");
      if (stored) {
        setOfflineDrafts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load offline drafts", e);
    }
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    if (navigator.onLine) {
      window.location.reload();
    } else {
      setTimeout(() => setIsRetrying(false), 1200);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
        <WifiOff className="w-8 h-8" />
      </div>

      <h1 className="text-3xl font-serif font-bold text-white mb-2">You are currently offline</h1>
      <p className="text-zinc-400 max-w-md mb-8">
        Don&apos;t worry! Your learning progress is still safe. Any reflections or logs you create while offline are saved locally and will automatically sync when you reconnect.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
          {isRetrying ? "Checking Connection..." : "Retry Connection"}
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition border border-zinc-700/50"
        >
          Return to Dashboard
        </Link>
      </div>

      {offlineDrafts.length > 0 && (
        <div className="w-full max-w-lg bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Pending Offline Drafts ({offlineDrafts.length})
            </h2>
            <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
              Waiting for network
            </span>
          </div>

          <div className="space-y-3">
            {offlineDrafts.map((draft) => (
              <div key={draft.id} className="p-3.5 bg-zinc-800/60 rounded-xl border border-zinc-700/40">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-zinc-100">{draft.topic || "Untitled Reflection"}</h3>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {draft.durationMinutes}m
                  </span>
                </div>
                {draft.notes && <p className="text-xs text-zinc-400 line-clamp-2">{draft.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

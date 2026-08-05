"use client";

import { useEffect, useState } from "react";
import { Sparkles, Calendar, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface InsightRun {
  id: string;
  date: string;
  period: string;
  status: "ON TRACK" | "DRIFTING";
  title: string;
  synthesis: string;
  takeaways: string[];
  recommendedFocus: string;
}

export default function InsightsPage() {
  const [insightRuns, setInsightRuns] = useState<InsightRun[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadInsights() {
      try {
        const data = await fetchApi<{ data: InsightRun[] } | InsightRun[]>("/insights");
        const list = Array.isArray(data) ? data : data.data || [];
        setInsightRuns(list);
      } catch (err) {
        console.warn("Could not fetch insights from backend API:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, []);
  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-border-light pb-4">
        <h1 className="font-serif italic text-4xl sm:text-5xl text-charcoal">
          Insight History
        </h1>
        <p className="text-sm text-charcoal-muted mt-1">
          Historical log of AI-synthesized career direction runs and pattern evaluations.
        </p>
      </div>

      {/* Insight Run Cards */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-charcoal-muted gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading career insights...</span>
          </div>
        ) : insightRuns.length === 0 ? (
          <div className="p-8 rounded-2xl bg-card border border-border-light text-center text-charcoal-muted">
            No insight runs recorded yet. Log activities and run analysis from the backend to view pattern evaluations here.
          </div>
        ) : (
          insightRuns.map((run) => (
          <div
            key={run.id}
            className="p-6 sm:p-8 rounded-2xl bg-card border border-border-light shadow-sm hover:shadow transition-shadow space-y-6"
          >
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border-light">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-ai-dark text-ai-accent flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-charcoal">
                    {run.period}
                  </h3>
                  <span className="text-xs text-charcoal-muted font-mono">
                    {run.date}
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full ${
                  run.status === "ON TRACK"
                    ? "bg-badge-trackBg text-badge-trackText"
                    : "bg-badge-driftBg text-badge-driftText"
                }`}
              >
                {run.status}
              </span>
            </div>

            {/* Title & Synthesis */}
            <div className="space-y-2">
              <h2 className="font-serif italic text-2xl text-charcoal">
                {run.title}
              </h2>
              <p className="text-sm text-charcoal-muted leading-relaxed">
                {run.synthesis}
              </p>
            </div>

            {/* Key Takeaways */}
            <div className="bg-card-muted/60 rounded-xl p-4 space-y-2 border border-border-subtle">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                Key Takeaways & Pattern Analysis
              </h4>
              <ul className="space-y-1.5 text-xs text-charcoal-muted">
                {run.takeaways.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Focus */}
            <div className="flex items-center gap-2 text-xs text-charcoal pt-2">
              <span className="font-semibold uppercase tracking-wider text-indigo-600">
                Recommended Focus:
              </span>
              <span className="text-charcoal-muted">{run.recommendedFocus}</span>
            </div>
          </div>
        )))}
      </div>
    </div>
  );
}

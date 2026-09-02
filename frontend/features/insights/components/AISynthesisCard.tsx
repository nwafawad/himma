"use client";

import { useEffect, useState, useCallback } from "react";
import type { Insight } from "@himma/contracts";
import CitationHoverCard from "./CitationHoverCard";
import { Sparkles, RotateCw, Loader2, Target, AlertCircle } from "lucide-react";
import { listActivities } from "@/features/activities/api";
import { generateInsight, listInsights } from "@/features/insights/api";
import { listNotes } from "@/features/notes/api";
import { getErrorMessage } from "@/lib/errors";

interface ResolvedCitation {
  id: string;
  keyword: string;
  title: string;
  type: string;
  date: string;
  snippet: string;
  url?: string;
}

export default function AISynthesisCard() {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [citations, setCitations] = useState<ResolvedCitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const formatRelativeTime = (dateStr?: string): string => {
    if (!dateStr) return "Just synthesized";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently synthesized";

    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "Updated just now";
    if (diffSec < 3600) return `Updated ${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `Updated ${Math.floor(diffSec / 3600)}h ago`;
    return `Updated ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  };

  const loadLatestInsight = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // Fetch latest insight run and recent activities/notes for citation resolution
      const [insightsRes, activitiesRes, notesRes] = await Promise.all([
        listInsights(1).catch(() => null),
        listActivities({ limit: 20 }).catch(() => null),
        listNotes({ limit: 20 }).catch(() => null),
      ]);

      const latestRun = insightsRes?.data?.[0] || null;
      setInsight(latestRun);

      if (latestRun && latestRun.citations && latestRun.citations.length > 0) {
        const actMap = new Map((activitiesRes?.data || []).map((activity) => [activity.id, activity]));
        const noteMap = new Map((notesRes?.data || []).map((note) => [note.id, note]));

        const resolved: ResolvedCitation[] = [];
        for (const citationId of latestRun.citations) {
          if (actMap.has(citationId)) {
            const act = actMap.get(citationId)!;
            resolved.push({
              id: act.id,
              keyword: act.tags?.[0] || act.type?.toUpperCase() || "Activity",
              title: act.title,
              type: (act.type || "Activity").toUpperCase(),
              date: new Date(act.consumedAt || act.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              snippet: act.title,
              url: act.url || undefined,
            });
          } else if (noteMap.has(citationId)) {
            const note = noteMap.get(citationId)!;
            resolved.push({
              id: note.id,
              keyword: note.tags?.[0] || "NOTE",
              title: note.text ? (note.text.length > 50 ? `${note.text.slice(0, 50)}...` : note.text) : "Study Note",
              type: "NOTE",
              date: new Date(note.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              snippet: note.text || "",
            });
          }
        }

        setCitations(resolved);
      } else {
        setCitations([]);
      }
    } catch (err) {
      console.warn("Could not load AI synthesis data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerateSynthesis = async () => {
    if (generating) return;
    setGenerating(true);
    setErrorMsg("");
    try {
      const res = await generateInsight(30);

      if (res.skipped) {
        setErrorMsg(res.reason || "Insufficient learning logs in past 30 days to synthesize insights.");
      } else {
        setInsight(res.data);
        await loadLatestInsight();
      }
    } catch (err: unknown) {
      console.warn("Synthesis generation error:", err);
      setErrorMsg(getErrorMessage(err, "Failed to generate AI synthesis. Please try again."));
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadLatestInsight();

    const handleRefresh = () => {
      loadLatestInsight();
    };

    window.addEventListener("activity-logged", handleRefresh);
    window.addEventListener("insight-generated", handleRefresh);
    return () => {
      window.removeEventListener("activity-logged", handleRefresh);
      window.removeEventListener("insight-generated", handleRefresh);
    };
  }, [loadLatestInsight]);

  const rawScore = (insight?.alignmentScore || "no_stated_goal").toString().toLowerCase().replace(/_/g, " ");

  const getScoreBadge = () => {
    if (rawScore.includes("on track") || rawScore.includes("on_track")) {
      return { label: "ON TRACK", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    }
    if (rawScore.includes("drifting")) {
      return { label: "DRIFTING", bg: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
    }
    return { label: "NO STATED GOAL", bg: "bg-slate-700/60 text-slate-300 border-slate-600/40" };
  };

  const badge = getScoreBadge();
  const narrative = insight?.directionSummary?.narrative;
  const strongSkills = insight?.skillSummary?.strong || [];
  const emergingSkills = insight?.skillSummary?.emerging || [];
  const totalSessions = (insight?.inputWindow?.activitiesCount || 0) + (insight?.inputWindow?.notesCount || 0);

  return (
    <div className="w-full bg-[#181820] text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-slate-800">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative z-10">
        <div className="flex items-center space-x-2 text-[#818CF8]">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest font-mono font-medium">
            AI SYNTHESIS • LEARNING TRAJECTORY
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateSynthesis}
            disabled={generating || loading}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white text-xs font-medium transition-all hover:bg-white/20 active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#181820]"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5" />
                <span>Re-synthesize</span>
              </>
            )}
          </button>

          <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold border ${badge.bg}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Body Content */}
      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-400 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Loading AI synthesis report...</span>
        </div>
      ) : errorMsg ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={handleGenerateSynthesis}
            disabled={generating}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Try Synthesis
          </button>
        </div>
      ) : !insight || (!narrative && strongSkills.length === 0) ? (
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Target className="w-5 h-5" />
          </div>
          <h4 className="font-serif italic text-lg text-slate-200">
            No Synthesis Generated Yet
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Synthesize your imported history logs, notes, and study sessions to generate an AI evaluation of your learning momentum.
          </p>
          <button
            onClick={handleGenerateSynthesis}
            disabled={generating}
            className="inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-charcoal text-xs font-medium shadow-sm transition-all hover:bg-card-muted active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#181820]"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Synthesize Learning Insights</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          {/* Main Narrative Synthesis */}
          <blockquote className="text-base sm:text-lg font-light text-slate-200 leading-relaxed font-sans">
            "{narrative || "Learning momentum synthesized from your recent activity entries and study logs."}"
          </blockquote>

          {/* Citations & Strong Skills Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {citations.map((c) => (
              <CitationHoverCard
                key={c.id}
                keyword={c.keyword}
                title={c.title}
                type={c.type}
                date={c.date}
                snippet={c.snippet}
                url={c.url}
              />
            ))}

            {strongSkills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-mono border border-indigo-500/30"
              >
                #{skill}
              </span>
            ))}

            {emergingSkills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700"
              >
                #{skill}
              </span>
            ))}
          </div>

          {/* Footer Metadata */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              {totalSessions > 0
                ? `Synthesized from ${totalSessions} study session${totalSessions === 1 ? "" : "s"} & logs`
                : "Synthesized from active learning history"}
            </span>
            <span className="font-mono text-[11px]">{formatRelativeTime(insight.timestamp)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ThumbsUp,
  Sliders,
  FileText,
  Activity,
  Layers,
  ChevronRight,
  Info,
  Check,
  TrendingUp,
  Compass,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import FeedbackModal from "@/components/insights/FeedbackModal";

export interface SkillSummary {
  strong?: string[];
  emerging?: string[];
  developing?: string[];
}

export interface CandidatePath {
  path: string;
  rationale: string;
}

export interface DirectionSummary {
  narrative?: string;
  candidatePaths?: CandidatePath[];
}

export interface InputWindow {
  timeframeDays?: number;
  activitiesCount?: number;
  notesCount?: number;
}

export interface InsightRun {
  id: string;
  timestamp: string;
  status: "completed" | "skipped";
  statusReason?: string | null;
  alignmentScore: "on_track" | "drifting" | "no_stated_goal";
  skillSummary?: SkillSummary;
  directionSummary?: DirectionSummary;
  citations?: string[];
  inputWindow?: InputWindow;
  tokensUsed?: number;
}

export default function InsightsPage() {
  const [insightRuns, setInsightRuns] = useState<InsightRun[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"all" | "completed" | "skipped">("all");
  const [notification, setNotification] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  // Feedback Modal State
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    insightId: string;
    initialSkills: string[];
    initialTargetPath: string | null;
  }>({
    isOpen: false,
    insightId: "",
    initialSkills: [],
    initialTargetPath: "",
  });

  const [confirmedRunIds, setConfirmedRunIds] = useState<Set<string>>(new Set());

  const loadInsights = async () => {
    try {
      const res = await fetchApi<{ data: InsightRun[] } | InsightRun[]>("/insights");
      const list = Array.isArray(res) ? res : res.data || [];
      setInsightRuns(list);
    } catch (err: any) {
      console.warn("Could not fetch insights from backend API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const handleGenerateInsight = async () => {
    if (generating) return;
    setGenerating(true);
    setNotification(null);

    try {
      const res = await fetchApi<{
        skipped?: boolean;
        message?: string;
        reason?: string;
        data?: InsightRun;
      }>("/insights/generate", {
        method: "POST",
        body: JSON.stringify({ timeframeDays: 30 }),
      });

      if (res.skipped) {
        setNotification({
          type: "warning",
          message: res.message || res.reason || "Insight generation was skipped due to insufficient activity logs.",
        });
      } else if (res.data) {
        setNotification({
          type: "success",
          message: "New AI Career Insight generated successfully!",
        });
        setInsightRuns((prev) => [res.data!, ...prev]);
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to trigger AI insight generation.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirmFeedback = async (insightId: string) => {
    try {
      await fetchApi(`/insights/${insightId}/feedback`, {
        method: "POST",
        body: JSON.stringify({ action: "confirm" }),
      });
      setConfirmedRunIds((prev) => new Set(prev).add(insightId));
      setNotification({
        type: "success",
        message: "Feedback recorded! Glad this insight was accurate.",
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to submit feedback.",
      });
    }
  };

  const handleOpenCorrectionModal = (run: InsightRun) => {
    const allSkills = [
      ...(run.skillSummary?.strong || []),
      ...(run.skillSummary?.emerging || []),
      ...(run.skillSummary?.developing || []),
    ];

    setFeedbackModal({
      isOpen: true,
      insightId: run.id,
      initialSkills: Array.from(new Set(allSkills)),
      initialTargetPath: "",
    });
  };

  const filteredRuns = insightRuns.filter((run) => {
    if (activeTab === "completed") return run.status === "completed";
    if (activeTab === "skipped") return run.status === "skipped";
    return true;
  });

  const getStatusBadge = (score: InsightRun["alignmentScore"], status: string) => {
    if (status === "skipped") {
      return (
        <span className="text-[10px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full bg-charcoal-muted/10 text-charcoal-muted border border-border-light flex items-center gap-1">
          <Info className="w-3 h-3" /> SKIPPED
        </span>
      );
    }

    if (score === "on_track") {
      return (
        <span className="text-[10px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> ON TRACK
        </span>
      );
    }

    if (score === "drifting") {
      return (
        <span className="text-[10px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> DRIFTING
        </span>
      );
    }

    return (
      <span className="text-[10px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 flex items-center gap-1">
        <Compass className="w-3 h-3" /> NO STATED GOAL
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header with AI Run CTA */}
      <div className="border-b border-border-light pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif italic text-4xl sm:text-5xl text-charcoal">
            Insight Engine
          </h1>
          <p className="text-sm text-charcoal-muted mt-1">
            AI-synthesized career direction runs, skill evaluations, and pattern analysis.
          </p>
        </div>

        <button
          onClick={handleGenerateInsight}
          disabled={generating}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 active:scale-95 text-amber-950 font-semibold text-xs shadow-sm border border-amber-500/20 transition-all disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-950" />
              <span>Analyzing Context...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-900" />
              <span>Run AI Career Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              : notification.type === "warning"
              ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
              : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {notification.type === "warning" && <AlertCircle className="w-4 h-4 shrink-0" />}
            {notification.type === "error" && <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-charcoal-muted hover:text-charcoal text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border-light pb-2">
        {(["all", "completed", "skipped"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-charcoal text-white dark:bg-card-muted dark:text-charcoal"
                : "text-charcoal-muted hover:text-charcoal hover:bg-card-muted"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Insight Runs List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-charcoal-muted gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading career insights...</span>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="p-12 rounded-2xl bg-card border border-border-light text-center space-y-3">
            <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
            <h3 className="font-semibold text-charcoal text-base">No insight runs recorded</h3>
            <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
              Click &quot;Run AI Career Analysis&quot; above to synthesize your recent notes and activities into a structured direction report.
            </p>
          </div>
        ) : (
          filteredRuns.map((run) => {
            const formattedDate = new Date(run.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            const formattedTime = new Date(run.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const hasCitations = run.citations && run.citations.length > 0;
            const isConfirmed = confirmedRunIds.has(run.id);

            return (
              <div
                key={run.id}
                className="p-6 sm:p-8 rounded-2xl bg-card border border-border-light shadow-sm hover:shadow-md transition-shadow space-y-6"
              >
                {/* Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border-light">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-charcoal">
                          AI Insight Run
                        </h3>
                        <span className="text-xs text-charcoal-muted">
                          • {formattedDate} at {formattedTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-charcoal-muted mt-0.5">
                        {run.inputWindow?.timeframeDays && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {run.inputWindow.timeframeDays}-day window
                          </span>
                        )}
                        {run.inputWindow?.activitiesCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" /> {run.inputWindow.activitiesCount} activities
                          </span>
                        )}
                        {run.inputWindow?.notesCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {run.inputWindow.notesCount} notes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {getStatusBadge(run.alignmentScore, run.status)}
                </div>

                {/* Narrative / Skipped Status Reason */}
                {run.status === "skipped" ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block mb-0.5">Run Skipped</strong>
                      <span>{run.statusReason || "Insufficient activity logs recorded in the target timeframe."}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Narrative Synthesis */}
                    {run.directionSummary?.narrative && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" /> Narrative Synthesis
                        </h4>
                        <p className="text-sm text-charcoal-muted leading-relaxed">
                          {run.directionSummary.narrative}
                        </p>
                      </div>
                    )}

                    {/* Candidate Career Paths */}
                    {run.directionSummary?.candidatePaths && run.directionSummary.candidatePaths.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-indigo-600" /> Evaluated Career Paths
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {run.directionSummary.candidatePaths.map((cp, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl bg-card-muted/60 border border-border-subtle space-y-1"
                            >
                              <div className="text-xs font-bold text-charcoal flex items-center justify-between">
                                <span>{cp.path}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
                              </div>
                              <p className="text-xs text-charcoal-muted leading-snug">
                                {cp.rationale}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills Summary Matrix */}
                    {run.skillSummary && (
                      <div className="bg-card-muted/40 rounded-xl p-4 border border-border-subtle space-y-3 pt-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-600" /> Skills Evaluation Breakdown
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Strong */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                              Strong ({run.skillSummary.strong?.length || 0})
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {run.skillSummary.strong && run.skillSummary.strong.length > 0 ? (
                                run.skillSummary.strong.map((s, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium border border-emerald-500/20">
                                    {s}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-charcoal-muted italic">None detected</span>
                              )}
                            </div>
                          </div>

                          {/* Emerging */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                              Emerging ({run.skillSummary.emerging?.length || 0})
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {run.skillSummary.emerging && run.skillSummary.emerging.length > 0 ? (
                                run.skillSummary.emerging.map((s, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-500/20">
                                    {s}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-charcoal-muted italic">None detected</span>
                              )}
                            </div>
                          </div>

                          {/* Developing */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                              Developing ({run.skillSummary.developing?.length || 0})
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {run.skillSummary.developing && run.skillSummary.developing.length > 0 ? (
                                run.skillSummary.developing.map((s, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-medium border border-amber-500/20">
                                    {s}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-charcoal-muted italic">None detected</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Citations & Metadata */}
                    {hasCitations && (
                      <div className="flex items-center justify-between pt-2 text-[11px] text-charcoal-muted border-t border-border-light">
                        <span className="flex items-center gap-1.5 font-mono">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          Validated Source Citations: {run.citations!.length} entries
                        </span>
                        {run.tokensUsed ? (
                          <span className="font-mono">{run.tokensUsed} tokens used</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Feedback Actions */}
                {run.status === "completed" && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-border-light">
                    <div className="text-xs text-charcoal-muted">
                      Is this AI evaluation accurate for your career goals?
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleConfirmFeedback(run.id)}
                        disabled={isConfirmed}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isConfirmed
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                            : "border-border-light hover:bg-card-muted text-charcoal hover:border-emerald-500/40"
                        }`}
                      >
                        {isConfirmed ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirmed Accurate</span>
                          </>
                        ) : (
                          <>
                            <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Confirm Accuracy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenCorrectionModal(run)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border-light hover:bg-card-muted text-charcoal hover:border-indigo-500/40 transition-all"
                      >
                        <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Adjust Goals / Skills</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Feedback Correction Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() =>
          setFeedbackModal((prev) => ({ ...prev, isOpen: false }))
        }
        insightId={feedbackModal.insightId}
        initialSkills={feedbackModal.initialSkills}
        initialTargetPath={feedbackModal.initialTargetPath}
        onSuccess={() => {
          setNotification({
            type: "success",
            message: "Your profile was updated! Future AI insight runs will incorporate your corrections.",
          });
          loadInsights();
        }}
      />
    </div>
  );
}

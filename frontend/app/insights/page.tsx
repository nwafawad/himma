import { Sparkles, Calendar, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

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

const INSIGHT_RUNS: InsightRun[] = [
  {
    id: "run-1",
    date: "August 3, 2026",
    period: "Weekly Run #31",
    status: "ON TRACK",
    title: "Transition toward Systems Architecture & High-Throughput Engineering",
    synthesis: "Your activity across July & August shows a heavy concentration in low-level concurrency, microservice communication, and distributed event streaming. You are actively solidifying the foundation for a Senior Systems Architect role.",
    takeaways: [
      "80% of study time directed toward Go/Rust memory models and distributed log design.",
      "Consistent application of theoretical knowledge via hands-on code repository experiments.",
      "High alignment with your target Staff Systems Architect path."
    ],
    recommendedFocus: "Continue deeper exploration into consensus protocols (Raft state machine replication) and network transport optimization."
  },
  {
    id: "run-2",
    date: "July 27, 2026",
    period: "Weekly Run #30",
    status: "ON TRACK",
    title: "Solidifying Core Distributed Storage Primitives",
    synthesis: "Logged 18 hours analyzing LSM-Trees, B-Trees, and database indexing algorithms. Demonstrated strong curiosity in database storage engine internals.",
    takeaways: [
      "Focused reading on RocksDB and LevelDB architecture.",
      "Created 4 detailed summary notes evaluating write amplification."
    ],
    recommendedFocus: "Bridge database storage theory with event bus architecture."
  },
  {
    id: "run-3",
    date: "July 20, 2026",
    period: "Weekly Run #29",
    status: "DRIFTING",
    title: "Temporary Context Shift to Mobile UI Animation Frameworks",
    synthesis: "Study logs indicated a 3-day diversion into React Native gesture handlers and frontend animation tricks, momentarily straying from your primary systems engineering target.",
    takeaways: [
      "Reduced backend systems study volume by 45%.",
      "Identified minor goal drift away from primary Staff Architect milestone."
    ],
    recommendedFocus: "Re-anchor weekly schedule around core backend distributed systems reading."
  }
];

export default function InsightsPage() {
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
        {INSIGHT_RUNS.map((run) => (
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
        ))}
      </div>
    </div>
  );
}

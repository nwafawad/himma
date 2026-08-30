"use client";

import Link from "next/link";
import AISynthesisCard from "@/features/insights/components/AISynthesisCard";
import ActivityFeed from "@/features/activities/components/ActivityFeed";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Pen, Upload, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const handleOpenCapture = () => {
    window.dispatchEvent(new CustomEvent("open-quick-capture"));
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Header Title Section */}
      <ScrollReveal direction="down" delayMs={50}>
        <div className="border-b border-border-light pb-4">
          <h1 className="font-serif italic text-4xl sm:text-5xl text-charcoal tracking-tight">
            Today's Momentum
          </h1>
          <p className="text-sm text-charcoal-muted mt-1 font-sans">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </ScrollReveal>

      {/* AI Synthesis Dark Hero Block */}
      <ScrollReveal direction="up" delayMs={150}>
        <AISynthesisCard />
      </ScrollReveal>

      {/* Recent Activity Feed */}
      <ScrollReveal direction="up" delayMs={250}>
        <ActivityFeed />
      </ScrollReveal>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScrollReveal direction="up" delayMs={350}>
          <button
            type="button"
            onClick={handleOpenCapture}
            className="w-full p-6 bg-card border border-border-light rounded-2xl cursor-pointer hover:border-charcoal transition-all group shadow-sm hover:shadow-md h-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2"
          >
            <div className="w-10 h-10 rounded-full bg-card-muted flex items-center justify-center text-charcoal mb-4 group-hover:bg-charcoal group-hover:text-white transition-colors">
              <Pen className="w-5 h-5" />
            </div>
            <h3 className="font-serif italic text-xl text-charcoal mb-1 flex items-center justify-between">
              LOG ACTIVITY
              <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Record a new study session, key reflection note, or code repository link.
            </p>
          </button>
        </ScrollReveal>

        <ScrollReveal direction="up" delayMs={450}>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-import-modal"))}
            className="w-full p-6 bg-card border border-border-light rounded-2xl cursor-pointer hover:border-charcoal transition-all group shadow-sm hover:shadow-md h-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2"
          >
            <div className="w-10 h-10 rounded-full bg-card-muted flex items-center justify-center text-charcoal mb-4 group-hover:bg-charcoal group-hover:text-white transition-colors">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-serif italic text-xl text-charcoal mb-1 flex items-center justify-between">
              IMPORT HISTORY
              <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Batch upload browser reading history, Coursera progress, or Notion pages.
            </p>
          </button>
        </ScrollReveal>
      </div>
    </div>
  );
}

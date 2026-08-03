"use client";

import Link from "next/link";
import AISynthesisCard from "@/components/dashboard/AISynthesisCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
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
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-border-light pb-4 gap-2">
          <div>
            <h1 className="font-serif italic text-4xl sm:text-5xl text-charcoal tracking-tight">
              Today's Momentum
            </h1>
            <p className="text-sm text-charcoal-muted mt-1">
              Monday, August 3 • 4 Active Study Hours Logged
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-charcoal-muted bg-card-muted px-3 py-1.5 rounded-full border border-border-subtle self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SYNCHRONIZED WITH GITHUB</span>
          </div>
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
          <div
            onClick={handleOpenCapture}
            className="p-6 bg-card border border-border-light rounded-2xl cursor-pointer hover:border-charcoal transition-all group shadow-sm hover:shadow-md h-full"
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
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delayMs={450}>
          <div className="p-6 bg-card border border-border-light rounded-2xl cursor-pointer hover:border-charcoal transition-all group shadow-sm hover:shadow-md h-full">
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
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

"use client";

import CitationHoverCard from "./CitationHoverCard";
import { Sparkles } from "lucide-react";

export default function AISynthesisCard() {
  return (
    <div className="w-full bg-[#181820] text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-slate-800">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2 text-[#818CF8]">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest font-mono font-medium">
            AI SYNTHESIS • WEEKLY PATTERN
          </span>
        </div>
        <span className="px-3 py-1 rounded-full bg-[#2D2B55] text-indigo-200 text-[10px] uppercase tracking-wider font-semibold border border-indigo-500/20">
          ON TRACK
        </span>
      </div>

      {/* Quote / Synthesis */}
      <blockquote className="text-lg sm:text-xl font-light text-slate-200 leading-relaxed font-sans">
        "Your recent deep dives into high-throughput architectural trade-offs indicate a shift towards{" "}
        <CitationHoverCard
          keyword="Product Strategy"
          title="System Architecture & Scalability Notes"
          type="ENGINEERING NOTE"
          date="AUG 03, 2026"
          snippet="Evaluated distributed event bus patterns against monolith scalability limits for high concurrency."
        />{" "}
        and{" "}
        <CitationHoverCard
          keyword="R&D Leadership"
          title="Building Resilient Tech Organizations"
          type="BOOK ARTICLE"
          date="AUG 01, 2026"
          snippet="Studied structural alignment models for technical founders balancing immediate delivery with long-term R&D."
        />
        . Keep building momentum in distributed system design to solidify your target trajectory."
      </blockquote>

      {/* Footer Meta */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>Synthesized from 14 study sessions this month</span>
        <span className="font-mono text-[11px]">Updated 2h ago</span>
      </div>
    </div>
  );
}

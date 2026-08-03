import Link from "next/link";
import { Pen, Book, Lightbulb, ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-12 text-center space-y-16">
      {/* Hero Headline */}
      <ScrollReveal direction="up" delayMs={100} className="max-w-3xl space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card-muted border border-border-subtle text-xs text-charcoal-muted uppercase tracking-widest font-mono">
          <span>Editorial Learning Journal</span>
        </div>
        <h1 className="font-serif italic text-5xl sm:text-7xl font-normal text-charcoal tracking-tight leading-[1.1]">
          A quiet place to notice what you are becoming.
        </h1>
        <p className="text-base sm:text-lg text-charcoal-muted max-w-xl mx-auto leading-relaxed font-sans">
          Momentum lets self-directed engineers and creators quietly log study activity, track skill trajectories, and surface AI-synthesized career insights.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-charcoal hover:bg-black text-white px-7 py-3 text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <span>Start your journal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/timeline"
            className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-card-muted text-charcoal border border-border-light px-7 py-3 text-sm font-medium transition-all hover:border-charcoal/30 active:scale-95"
          >
            <span>See a preview</span>
          </Link>
        </div>
      </ScrollReveal>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left pt-10 border-t border-border-light">
        {/* Feature 1 */}
        <ScrollReveal direction="up" delayMs={200}>
          <div className="p-6 rounded-2xl bg-card border border-border-light space-y-3 shadow-sm hover:shadow transition-shadow h-full">
            <div className="w-10 h-10 rounded-full bg-badge-trackBg text-badge-trackText flex items-center justify-center">
              <Pen className="w-5 h-5" />
            </div>
            <h3 className="font-serif italic text-xl text-charcoal">
              Log as you learn
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Quickly capture articles, course chapters, and code repos using hotkeys without breaking deep focus.
            </p>
          </div>
        </ScrollReveal>

        {/* Feature 2 */}
        <ScrollReveal direction="up" delayMs={350}>
          <div className="p-6 rounded-2xl bg-card border border-border-light space-y-3 shadow-sm hover:shadow transition-shadow h-full">
            <div className="w-10 h-10 rounded-full bg-card-muted text-charcoal flex items-center justify-center">
              <Book className="w-5 h-5" />
            </div>
            <h3 className="font-serif italic text-xl text-charcoal">
              Import your history
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Seamlessly sync background study activity from GitHub, Notion, YouTube, and Coursera.
            </p>
          </div>
        </ScrollReveal>

        {/* Feature 3 */}
        <ScrollReveal direction="up" delayMs={500}>
          <div className="p-6 rounded-2xl bg-card border border-border-light space-y-3 shadow-sm hover:shadow transition-shadow h-full">
            <div className="w-10 h-10 rounded-full bg-[#2D2B55] text-indigo-300 flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h3 className="font-serif italic text-xl text-charcoal">
              See the pattern
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Periodic AI synthesis maps your fragmented study logs into coherent long-term career directions.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

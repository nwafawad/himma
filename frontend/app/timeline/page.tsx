"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

type FilterType = "All" | "Article" | "Course" | "Note" | "Repository" | "Video";

interface TimelineEntry {
  id: string;
  dateGroup: string;
  type: FilterType;
  title: string;
  summary: string;
  time: string;
  category: string;
  link?: string;
}

const FILTERS: FilterType[] = ["All", "Article", "Course", "Note", "Repository", "Video"];

export default function TimelinePage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadTimeline() {
      try {
        const data = await fetchApi<{ data: TimelineEntry[] } | TimelineEntry[]>("/notes");
        const list = Array.isArray(data) ? data : data.data || [];
        const formatted = list.map((item: any) => ({
          id: item.id,
          dateGroup: item.dateGroup || "RECENT",
          type: item.type || "Note",
          title: item.title,
          summary: item.summary || item.content || "",
          time: item.time || "Today",
          category: item.category || "ENGINEERING",
          link: item.link,
        }));
        setTimelineEntries(formatted);
      } catch (err) {
        console.warn("Could not fetch timeline notes from backend API:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTimeline();
  }, []);

  const filteredEntries = timelineEntries.filter(
    (item) => activeFilter === "All" || item.type === activeFilter
  );

  // Group filtered entries by dateGroup
  const groupedEntries = filteredEntries.reduce((acc, item) => {
    if (!acc[item.dateGroup]) {
      acc[item.dateGroup] = [];
    }
    acc[item.dateGroup].push(item);
    return acc;
  }, {} as Record<string, TimelineEntry[]>);

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Page Title */}
      <div className="border-b border-border-light pb-4">
        <h1 className="font-serif italic text-4xl sm:text-5xl text-charcoal">
          Activity Timeline
        </h1>
        <p className="text-sm text-charcoal-muted mt-1">
          Chronological record of self-directed study sessions, notes, and imported resources.
        </p>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2 pt-2">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`text-xs uppercase tracking-wider font-medium px-4 py-2 rounded-full border transition-all ${
                isActive
                  ? "bg-charcoal text-white border-charcoal shadow-sm"
                  : "bg-card-muted text-charcoal-muted border-transparent hover:border-border-light hover:text-charcoal"
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Timeline Feed */}
      <div className="pt-4 space-y-10">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-charcoal-muted gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading timeline activity...</span>
            </div>
          ) : Object.keys(groupedEntries).length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center text-charcoal-muted font-sans text-sm"
            >
              No timeline entries found {activeFilter !== "All" ? `for category "${activeFilter}"` : ""}.
            </motion.div>
          ) : (
            Object.entries(groupedEntries).map(([dateGroup, items]) => (
              <div key={dateGroup} className="space-y-4">
                {/* Date Header */}
                <div className="sticky top-16 z-10 bg-canvas/90 backdrop-blur-sm py-2">
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-charcoal-muted flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-charcoal/40" />
                    {dateGroup}
                  </h3>
                </div>

                {/* Vertical Timeline Container */}
                <div className="relative pl-6 border-l border-border-light space-y-4 ml-1">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="relative p-5 rounded-2xl bg-card border border-border-light shadow-sm hover:border-charcoal/20 transition-all group"
                    >
                      {/* Timeline Dot Node */}
                      <span className="absolute -left-[31px] top-6 w-2.5 h-2.5 rounded-full bg-white border-2 border-charcoal group-hover:scale-125 transition-transform" />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-card-muted text-charcoal">
                              {item.type}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">
                              {item.category}
                            </span>
                          </div>
                          <span className="font-mono text-charcoal-muted">{item.time}</span>
                        </div>

                        <h4 className="font-serif italic text-xl text-charcoal group-hover:text-black transition-colors flex items-center justify-between">
                          <span>{item.title}</span>
                          {item.link && (
                            <ExternalLink className="w-4 h-4 text-charcoal-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </h4>

                        <p className="text-sm text-charcoal-muted leading-relaxed">
                          {item.summary}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

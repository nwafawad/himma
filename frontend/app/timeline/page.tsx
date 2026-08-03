"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, FileText, Code, Video, ExternalLink } from "lucide-react";

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

const TIMELINE_DATA: TimelineEntry[] = [
  {
    id: "t1",
    dateGroup: "TODAY, AUGUST 3",
    type: "Repository",
    title: "Apache Kafka Internal Architecture & Partition Logs",
    summary: "Analyzed broker zero-copy network transmissions, page cache interaction, and consumer group rebalancing protocols.",
    time: "4:30 PM",
    category: "SYSTEMS",
    link: "https://github.com",
  },
  {
    id: "t2",
    dateGroup: "TODAY, AUGUST 3",
    type: "Note",
    title: "Monolith vs Microservice Cost Tradeoffs",
    summary: "Drafted reflection on organizational communication costs (Conway's Law) vs infrastructure overhead.",
    time: "11:15 AM",
    category: "ENGINEERING",
  },
  {
    id: "t3",
    dateGroup: "YESTERDAY, AUGUST 2",
    type: "Article",
    title: "Designing Data-Intensive Applications — Chapter 8",
    summary: "Deep dive into linearizability vs eventual consistency in partitioned consensus algorithms (Raft, Paxos).",
    time: "8:45 PM",
    category: "ENGINEERING",
  },
  {
    id: "t4",
    dateGroup: "YESTERDAY, AUGUST 2",
    type: "Course",
    title: "Stanford CS224N: Natural Language Processing with Deep Learning",
    summary: "Completed lecture on self-attention mechanisms and transformer key-query-value matrix projections.",
    time: "2:00 PM",
    category: "PRODUCT",
  },
  {
    id: "t5",
    dateGroup: "AUGUST 1, 2026",
    type: "Video",
    title: "Building Resilient Distributed Event Pipelines",
    summary: "Watched keynotes on backpressure mechanisms and dead letter queue routing strategies in high-throughput streams.",
    time: "6:20 PM",
    category: "SYSTEMS",
  },
];

const FILTERS: FilterType[] = ["All", "Article", "Course", "Note", "Repository", "Video"];

export default function TimelinePage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  const filteredEntries = TIMELINE_DATA.filter(
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
          {Object.keys(groupedEntries).length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center text-charcoal-muted font-sans text-sm"
            >
              No entries found for category "{activeFilter}".
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

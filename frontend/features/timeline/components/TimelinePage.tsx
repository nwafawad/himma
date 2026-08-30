"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Loader2, RotateCw, ChevronDown } from "lucide-react";
import { listActivities } from "@/features/activities/api";
import { listNotes } from "@/features/notes/api";
import {
  mergeTimelineEntries,
  timelineFilters,
  type TimelineEntry,
  type TimelineFilter,
} from "@/features/timeline/model";

// In-memory cache for Timeline entries to render instantly on navigation
let timelineCache: TimelineEntry[] | null = null;
let timelineHasMoreCache: boolean = false;

export default function TimelinePage() {
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>("All");
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>(timelineCache || []);
  const [loading, setLoading] = useState<boolean>(!timelineCache);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(timelineHasMoreCache);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const activityOffsetRef = useRef(0);
  const noteOffsetRef = useRef(0);
  const refreshInFlight = useRef(false);

  const loadTimeline = useCallback(async (isManual = false) => {
    if (isManual && refreshInFlight.current) return;
    if (isManual) {
      refreshInFlight.current = true;
      setRefreshing(true);
    }
    setErrorMessage("");
    try {
      // Fetch both activities and notes from the backend database with pagination metadata
      const [activitiesRes, notesRes] = await Promise.all([
        listActivities({ limit: 20, offset: 0 }),
        listNotes({ limit: 20, offset: 0 }),
      ]);

      const hasMoreFlag = activitiesRes.pagination.hasMore || notesRes.pagination.hasMore;
      const merged = mergeTimelineEntries(activitiesRes.data, notesRes.data);
      activityOffsetRef.current = activitiesRes.data.length;
      noteOffsetRef.current = notesRes.data.length;
      timelineCache = merged;
      timelineHasMoreCache = hasMoreFlag;
      setTimelineEntries(merged);
      setHasMore(hasMoreFlag);
    } catch (err) {
      console.warn("Could not fetch timeline items from backend API:", err);
      setErrorMessage(err instanceof Error ? err.message : "Unable to load the timeline.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      refreshInFlight.current = false;
    }
  }, []);

  const loadMoreTimeline = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const [activitiesRes, notesRes] = await Promise.all([
        listActivities({ limit: 20, offset: activityOffsetRef.current }),
        listNotes({ limit: 20, offset: noteOffsetRef.current }),
      ]);

      const hasMoreFlag = activitiesRes.pagination.hasMore || notesRes.pagination.hasMore;
      const newMerged = mergeTimelineEntries(activitiesRes.data, notesRes.data);
      activityOffsetRef.current += activitiesRes.data.length;
      noteOffsetRef.current += notesRes.data.length;

      setTimelineEntries((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const filteredNew = newMerged.filter((e) => !existingIds.has(e.id));
        const updated = [...prev, ...filteredNew].sort(
          (a, b) => new Date(b.consumedAt || 0).getTime() - new Date(a.consumedAt || 0).getTime(),
        );
        timelineCache = updated;
        return updated;
      });

      timelineHasMoreCache = hasMoreFlag;
      setHasMore(hasMoreFlag);
    } catch (err) {
      console.warn("Could not fetch more timeline items:", err);
      setErrorMessage(err instanceof Error ? err.message : "Unable to load more timeline entries.");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadTimeline();

    // Auto background refresh every 15 seconds to fetch remote activity updates
    const interval = setInterval(() => {
      loadTimeline();
    }, 15000);

    function handleActivityLogged() {
      // Invalidate in-memory cache and re-fetch clean timeline dataset from backend
      timelineCache = null;
      loadTimeline();
    }

    window.addEventListener("activity-logged", handleActivityLogged);
    return () => {
      clearInterval(interval);
      window.removeEventListener("activity-logged", handleActivityLogged);
    };
  }, [loadTimeline]);

  // Filter entries
  const filteredEntries = timelineEntries.filter((entry) => {
    if (activeFilter === "All") return true;
    return entry.type === activeFilter;
  });

  // Group filtered entries by dateGroup
  const groupedEntries = filteredEntries.reduce<Record<string, TimelineEntry[]>>((acc, entry) => {
    if (!acc[entry.dateGroup]) {
      acc[entry.dateGroup] = [];
    }
    acc[entry.dateGroup].push(entry);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-light">
        <div className="space-y-1">
          <h1 className="font-serif italic text-3xl sm:text-4xl text-charcoal">
            Learning Timeline
          </h1>
          <p className="text-sm text-charcoal-muted font-sans">
            A chronological trail of your study logs, course progress, notes, and imported history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadTimeline(true)}
            disabled={refreshing || loading}
            title="Refresh timeline"
            aria-label="Refresh timeline"
            className="min-h-11 min-w-11 p-2 rounded-xl border border-border-light bg-card hover:border-charcoal/20 text-charcoal-muted hover:text-charcoal transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? "animate-spin text-charcoal" : ""}`} />
          </button>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-charcoal-muted" />}
            <span className="text-xs text-charcoal-muted font-mono font-medium uppercase tracking-wider">
              {filteredEntries.length} {filteredEntries.length === 1 ? "LOG" : "LOGS"}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2" role="group" aria-label="Timeline filters">
        {timelineFilters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              type="button"
              key={filter}
              onClick={() => setActiveFilter(filter)}
              aria-pressed={isActive}
              className={`min-h-10 px-4 py-2 rounded-full text-xs font-medium transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal ${
                isActive
                  ? "bg-charcoal text-white shadow-sm"
                  : "bg-card hover:bg-card-muted border border-border-light text-charcoal-muted hover:text-charcoal"
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Timeline Stream */}
      <div className="space-y-8">
        {errorMessage && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => loadTimeline(true)} className="shrink-0 min-h-10 rounded-full border border-red-300 px-4 py-2 text-xs font-medium hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600">Retry</button>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-charcoal-muted text-sm gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-charcoal" />
              <span>Building your learning timeline...</span>
            </div>
          ) : errorMessage ? null : Object.keys(groupedEntries).length === 0 ? (
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
                <div className="relative pl-4 sm:pl-6 border-l border-border-light space-y-4 ml-2 sm:ml-1">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="relative p-4 sm:p-5 rounded-2xl bg-card border border-border-light shadow-sm hover:border-charcoal/20 transition-all group"
                    >
                      {/* Timeline Dot Node */}
                      <span className="absolute -left-[21px] sm:-left-[31px] top-6 w-2.5 h-2.5 rounded-full bg-white border-2 border-charcoal group-hover:scale-125 transition-transform" />

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
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Open ${item.title} in a new tab`}
                              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-charcoal-muted hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
                            >
                              <ExternalLink className="w-4 h-4 text-charcoal-muted opacity-60 group-hover:opacity-100 transition-opacity" />
                            </a>
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

        {/* Load More Pagination Button */}
        {hasMore && (
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={loadMoreTimeline}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card hover:bg-card-muted border border-border-light text-charcoal text-xs font-medium transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading older timeline entries...</span>
                </>
              ) : (
                <>
                  <span>Load More Timeline Entries</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

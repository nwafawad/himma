"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Loader2, RotateCw, ChevronDown } from "lucide-react";
import { fetchApi } from "@/lib/api";

export interface ActivityItem {
  id: string;
  title: string;
  summary: string;
  category: "ENGINEERING" | "SYSTEMS" | "PRODUCT";
  type?: string;
  time?: string;
  link?: string;
  consumedAt?: string;
}

// Module-level in-memory cache to guarantee zero-latency instant render on component remounts
let activityFeedCache: ActivityItem[] | null = null;
let activityFeedHasMoreCache: boolean = false;

const formatDateLabel = (dateStr?: string): string => {
  if (!dateStr) return "Today";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Today";

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today at ${timeStr}`;
  if (isYesterday) return `Yesterday at ${timeStr}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>(activityFeedCache || []);
  const [loading, setLoading] = useState<boolean>(!activityFeedCache);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(activityFeedHasMoreCache);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const refreshInFlight = useRef(false);

  const loadActivities = useCallback(async (isManual = false) => {
    if (isManual && refreshInFlight.current) return;
    if (isManual) {
      refreshInFlight.current = true;
      setRefreshing(true);
    }
    setErrorMessage("");
    try {
      const response = await fetchApi<{ data?: any[]; pagination?: { hasMore: boolean } }>("/activities?limit=15&offset=0");
      const list = Array.isArray(response) ? response : response?.data || [];
      const hasMoreFlag = Array.isArray(response) ? false : Boolean(response?.pagination?.hasMore);
      
      const mappedList: ActivityItem[] = list.map((item: any) => ({
        id: item.id,
        title: item.title,
        summary: item.summary || item.title,
        category: (item.tags?.[0]?.toUpperCase() as any) || "ENGINEERING",
        type: item.type ? item.type.toUpperCase() : "ACTIVITY",
        time: formatDateLabel(item.consumedAt),
        link: item.url,
        consumedAt: item.consumedAt,
      }));

      activityFeedCache = mappedList;
      activityFeedHasMoreCache = hasMoreFlag;
      setActivities(mappedList);
      setHasMore(hasMoreFlag);
    } catch (err) {
      console.warn("Could not fetch activities from backend API:", err);
      setErrorMessage(err instanceof Error ? err.message : "Unable to load activities.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      refreshInFlight.current = false;
    }
  }, []);

  const loadMoreActivities = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const offset = activities.length;
      const response = await fetchApi<{ data?: any[]; pagination?: { hasMore: boolean } }>(`/activities?limit=15&offset=${offset}`);
      const list = Array.isArray(response) ? response : response?.data || [];
      const hasMoreFlag = Array.isArray(response) ? false : Boolean(response?.pagination?.hasMore);

      const newMapped: ActivityItem[] = list.map((item: any) => ({
        id: item.id,
        title: item.title,
        summary: item.summary || item.title,
        category: (item.tags?.[0]?.toUpperCase() as any) || "ENGINEERING",
        type: item.type ? item.type.toUpperCase() : "ACTIVITY",
        time: formatDateLabel(item.consumedAt),
        link: item.url,
        consumedAt: item.consumedAt,
      }));

      setActivities((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const filtered = newMapped.filter((a) => !existingIds.has(a.id));
        const updated = [...prev, ...filtered];
        activityFeedCache = updated;
        return updated;
      });

      activityFeedHasMoreCache = hasMoreFlag;
      setHasMore(hasMoreFlag);
    } catch (err) {
      console.warn("Could not fetch more activities:", err);
      setErrorMessage(err instanceof Error ? err.message : "Unable to load more activities.");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadActivities();

    // Live auto-refresh background polling every 15 seconds
    const interval = setInterval(() => {
      loadActivities();
    }, 15000);

    function handleActivityLogged() {
      // Invalidate in-memory cache and re-fetch clean dataset from backend
      activityFeedCache = null;
      loadActivities();
    }

    window.addEventListener("activity-logged", handleActivityLogged);
    return () => {
      clearInterval(interval);
      window.removeEventListener("activity-logged", handleActivityLogged);
    };
  }, [loadActivities]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif italic text-2xl text-charcoal">
          Logged Learning Activity
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadActivities(true)}
            disabled={refreshing || loading}
            title="Refresh activities"
            aria-label="Refresh activities"
            className="min-h-11 min-w-11 p-2 rounded-xl border border-border-light bg-card hover:border-charcoal/20 text-charcoal-muted hover:text-charcoal transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-charcoal" : ""}`} />
          </button>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-charcoal-muted" />}
            <span className="text-xs text-charcoal-muted uppercase tracking-wider font-medium">
              {activities.length} {activities.length === 1 ? "ENTRY" : "ENTRIES"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {errorMessage && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => loadActivities(true)} className="shrink-0 min-h-10 rounded-full border border-red-300 px-4 py-2 text-xs font-medium hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600">Retry</button>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-charcoal-muted text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Fetching logged activities...</span>
            </div>
          ) : errorMessage ? null : activities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 rounded-2xl bg-card border border-border-light text-center text-sm text-charcoal-muted"
            >
              No activities recorded yet. Click <span className="font-mono bg-card-muted px-1.5 py-0.5 rounded border border-border-subtle text-xs">Import Study History</span> to batch import entries.
            </motion.div>
          ) : (
            activities.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="p-5 rounded-2xl bg-card border border-border-light hover:border-charcoal/20 transition-all shadow-sm hover:shadow group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-badge-driftBg text-badge-driftText">
                        {item.category}
                      </span>
                      <span className="text-charcoal-muted">•</span>
                      <span className="text-charcoal-muted font-mono font-medium">{item.time}</span>
                      <span className="text-charcoal-muted">•</span>
                      <span className="text-charcoal-muted capitalize">{item.type?.toLowerCase() || "activity"}</span>
                    </div>
                    <h4 className="font-serif italic text-lg text-charcoal group-hover:text-black transition-colors flex items-center gap-1.5">
                      {item.title}
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open ${item.title} in a new tab`}
                          className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg text-charcoal-muted hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
                        >
                          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity text-charcoal-muted inline" />
                        </a>
                      )}
                    </h4>
                    <p className="text-sm text-charcoal-muted leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {/* Load More Pagination Button */}
        {hasMore && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={loadMoreActivities}
              disabled={loadingMore}
              className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-full bg-card hover:bg-card-muted border border-border-light text-charcoal text-xs font-medium transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading older activities...</span>
                </>
              ) : (
                <>
                  <span>Load More History</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

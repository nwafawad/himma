"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Loader2, RotateCw, ChevronDown } from "lucide-react";
import { listActivities } from "@/features/activities/api";
import { toActivityFeedItem, type ActivityFeedItem } from "@/features/activities/presentation";
import { authClient } from "@/lib/authClient";
import { ActivityFeedSkeleton } from "@/components/ui/Skeletons";

// User-scoped in-memory cache to guarantee zero-latency instant render without cross-user pollution
const userActivityCaches = new Map<string, { items: ActivityFeedItem[]; hasMore: boolean }>();

export default function ActivityFeed() {
  const currentUserId = authClient.getUser()?.id || "anon";
  const initialCache = userActivityCaches.get(currentUserId);

  const [activities, setActivities] = useState<ActivityFeedItem[]>(initialCache?.items || []);
  const [loading, setLoading] = useState<boolean>(!initialCache);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(initialCache?.hasMore || false);
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
      const response = await listActivities({ limit: 15, offset: 0 });
      const mappedList = response.data.map(toActivityFeedItem);
      const hasMoreFlag = response.pagination.hasMore;

      const userId = authClient.getUser()?.id || "anon";
      userActivityCaches.set(userId, { items: mappedList, hasMore: hasMoreFlag });

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
      const response = await listActivities({ limit: 15, offset });
      const hasMoreFlag = response.pagination.hasMore;
      const newMapped = response.data.map(toActivityFeedItem);

      setActivities((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const filtered = newMapped.filter((a) => !existingIds.has(a.id));
        const updated = [...prev, ...filtered];
        const userId = authClient.getUser()?.id || "anon";
        userActivityCaches.set(userId, { items: updated, hasMore: hasMoreFlag });
        return updated;
      });

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

    const interval = setInterval(() => {
      loadActivities();
    }, 15000);

    function handleActivityLogged() {
      const userId = authClient.getUser()?.id || "anon";
      userActivityCaches.delete(userId);
      loadActivities();
    }

    const authSub = authClient.onAuthStateChange((user) => {
      const nextId = user?.id || "anon";
      const cached = userActivityCaches.get(nextId);
      if (cached) {
        setActivities(cached.items);
        setHasMore(cached.hasMore);
        setLoading(false);
      } else {
        setActivities([]);
        setLoading(true);
      }
      loadActivities();
    });

    window.addEventListener("activity-logged", handleActivityLogged);
    return () => {
      clearInterval(interval);
      authSub.unsubscribe();
      window.removeEventListener("activity-logged", handleActivityLogged);
    };
  }, [loadActivities]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-serif italic text-2xl text-charcoal">
          Logged Learning Activity
        </h3>
        <div className="flex items-center gap-3 self-end sm:self-auto">
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
            <span className="text-xs text-charcoal-muted uppercase tracking-wider font-medium font-mono">
              {activities.length} {activities.length === 1 ? "ENTRY" : "ENTRIES"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {errorMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => loadActivities(true)}
              className="shrink-0 min-h-10 rounded-full border border-red-300 px-4 py-2 text-xs font-medium hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            >
              Retry
            </button>
          </div>
        )}

        {loading && activities.length === 0 ? (
          <ActivityFeedSkeleton />
        ) : activities.length === 0 && !errorMessage ? (
          <div className="p-8 rounded-2xl bg-card border border-border-light text-center text-sm text-charcoal-muted space-y-2">
            <p className="font-serif italic text-lg text-charcoal">No logged activities yet.</p>
            <p className="text-xs">
              Use <span className="font-mono bg-card-muted px-1.5 py-0.5 rounded border border-border-subtle">⌘K</span> to capture a reflection or click <strong>Import History</strong> to batch load bookmarks.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {activities.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
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
                          aria-label={`Open resource for ${item.title} in a new tab`}
                          className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg text-charcoal-muted hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
                        >
                          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity text-charcoal-muted inline" />
                        </a>
                      )}
                    </h4>
                    {item.summary && (
                      <p className="text-sm text-charcoal-muted leading-relaxed">
                        {item.summary}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Load More Pagination Button */}
        {hasMore && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={loadMoreActivities}
              disabled={loadingMore}
              className="inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-card hover:bg-card-muted border border-border-light text-charcoal text-xs font-medium transition-all shadow-sm hover:shadow active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading older activities...</span>
                </>
              ) : (
                <>
                  <span>Load More Activities</span>
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

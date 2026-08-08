"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

export interface ActivityItem {
  id: string;
  title: string;
  summary: string;
  category: "ENGINEERING" | "SYSTEMS" | "PRODUCT";
  type?: string;
  time?: string;
  link?: string;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadActivities() {
      try {
        const response = await fetchApi<{ data?: any[] } | any[]>("/activities");
        const list = Array.isArray(response) ? response : response?.data || [];
        
        const mappedList: ActivityItem[] = list.map((item: any) => ({
          id: item.id,
          title: item.title,
          summary: item.summary || item.title,
          category: (item.tags?.[0]?.toUpperCase() as any) || "ENGINEERING",
          type: item.type ? item.type.toUpperCase() : "ACTIVITY",
          time: item.consumedAt ? new Date(item.consumedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today",
          link: item.url,
        }));

        setActivities(mappedList);
      } catch (err) {
        console.warn("Could not fetch activities from backend API:", err);
      } finally {
        setLoading(false);
      }
    }
    loadActivities();

    window.addEventListener("activity-logged", loadActivities);
    return () => {
      window.removeEventListener("activity-logged", loadActivities);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif italic text-2xl text-charcoal">
          Today's Logged Activity
        </h3>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-charcoal-muted" />}
          <span className="text-xs text-charcoal-muted uppercase tracking-wider font-medium">
            {activities.length} {activities.length === 1 ? "ENTRY" : "ENTRIES"} TODAY
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-charcoal-muted text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Fetching logged activities...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-6 rounded-2xl bg-card border border-border-light text-center text-sm text-charcoal-muted">
            No activities recorded yet. Press <span className="font-mono bg-card-muted px-1.5 py-0.5 rounded border border-border-subtle text-xs">⌘K</span> to capture your first entry.
          </div>
        ) : (
          activities.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-card border border-border-light hover:border-charcoal/20 transition-all shadow-sm hover:shadow group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-badge-driftBg text-badge-driftText">
                      {item.category}
                    </span>
                    <span className="text-charcoal-muted">•</span>
                    <span className="text-charcoal-muted font-mono">{item.time || "Today"}</span>
                    <span className="text-charcoal-muted">•</span>
                    <span className="text-charcoal-muted">{item.type || "Activity"}</span>
                  </div>
                  <h4 className="font-serif italic text-lg text-charcoal group-hover:text-black transition-colors flex items-center gap-1.5">
                    {item.title}
                    {item.link && (
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity text-charcoal-muted inline" />
                    )}
                  </h4>
                  <p className="text-sm text-charcoal-muted leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

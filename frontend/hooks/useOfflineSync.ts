"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";
import { authClient } from "@/lib/authClient";

export interface OfflineCaptureDraft {
  id: string;
  title: string;
  url?: string;
  type: "note" | "url";
  content: string;
  category: string;
  timestamp: number;
  activityId?: string | null;
}

export type NewOfflineCaptureDraft = Omit<
  OfflineCaptureDraft,
  "id" | "timestamp"
>;

function getStorageKey(userId?: string | null): string {
  const effectiveId = userId ?? authClient.getUser()?.id;
  return effectiveId
    ? `momentum_offline_drafts_${effectiveId}`
    : "momentum_offline_drafts_anon";
}

function readStoredDrafts(userId?: string | null): OfflineCaptureDraft[] {
  try {
    const key = getStorageKey(userId);
    let stored = localStorage.getItem(key);

    // One-time fallback migration from legacy un-scoped key
    if (!stored) {
      const legacy = localStorage.getItem("momentum_offline_drafts");
      if (legacy) {
        stored = legacy;
        try {
          localStorage.setItem(key, legacy);
          localStorage.removeItem("momentum_offline_drafts");
        } catch {
          // ignore storage error
        }
      }
    }

    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((draft): OfflineCaptureDraft | null => {
        if (typeof draft?.title === "string") {
          return {
            id: String(draft.id),
            title: draft.title,
            url: typeof draft.url === "string" ? draft.url : undefined,
            type: draft.type === "url" ? "url" : "note",
            content: typeof draft.content === "string" ? draft.content : "",
            category:
              typeof draft.category === "string"
                ? draft.category
                : "ENGINEERING",
            timestamp:
              typeof draft.timestamp === "number" ? draft.timestamp : Date.now(),
            activityId:
              "activityId" in draft
                ? typeof draft.activityId === "string"
                  ? draft.activityId
                  : null
                : undefined,
          };
        }

        if (typeof draft?.topic === "string") {
          return {
            id: String(draft.id),
            title: draft.topic,
            type: "note",
            content: typeof draft.notes === "string" ? draft.notes : "",
            category: "ENGINEERING",
            timestamp:
              typeof draft.timestamp === "number" ? draft.timestamp : Date.now(),
          };
        }

        return null;
      })
      .filter((draft): draft is OfflineCaptureDraft => Boolean(draft));
  } catch (error) {
    console.error("Failed to parse offline drafts:", error);
    return [];
  }
}

function persistDrafts(drafts: OfflineCaptureDraft[], userId?: string | null) {
  const key = getStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(drafts));
}

export function useOfflineSync(explicitUserId?: string | null) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingDrafts, setPendingDrafts] = useState<OfflineCaptureDraft[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncInFlight = useRef(false);

  const loadDrafts = useCallback(() => {
    const drafts = readStoredDrafts(explicitUserId);
    setPendingDrafts(drafts);
    return drafts;
  }, [explicitUserId]);

  const saveOfflineDraft = useCallback(
    (draft: NewOfflineCaptureDraft) => {
      const newDraft: OfflineCaptureDraft = {
        ...draft,
        id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
      };

      try {
        const current = readStoredDrafts(explicitUserId);
        const updated = [newDraft, ...current];
        persistDrafts(updated, explicitUserId);
        setPendingDrafts(updated);
        setSyncError(null);
        return newDraft;
      } catch (error) {
        console.error("Failed to save offline draft:", error);
        setSyncError("This entry could not be saved on this device.");
        return null;
      }
    },
    [explicitUserId]
  );

  const syncDrafts = useCallback(async () => {
    if (syncInFlight.current || !navigator.onLine) return 0;

    const drafts = readStoredDrafts(explicitUserId);
    if (drafts.length === 0) {
      setPendingDrafts([]);
      return 0;
    }

    syncInFlight.current = true;
    setIsSyncing(true);
    setSyncError(null);

    const successfulIds = new Set<string>();

    for (const draft of drafts) {
      try {
        let activityId = draft.activityId;

        if (activityId === undefined) {
          const actType = draft.type === "url" ? "article" : "other";
          const resolvedUrl =
            draft.url ||
            (draft.type === "url" && draft.title.startsWith("http")
              ? draft.title
              : undefined);

          const activity = await fetchApi<{ data?: { id?: string } }>(
            "/activities",
            {
              method: "POST",
              body: JSON.stringify({
                title: draft.title.trim(),
                type: actType,
                source: "manual",
                url: resolvedUrl,
                tags: [draft.category.toLowerCase()],
              }),
            }
          );

          activityId = activity?.data?.id || null;
          draft.activityId = activityId;

          persistDrafts(drafts, explicitUserId);
          setPendingDrafts([...drafts]);
        }

        if (draft.content.trim()) {
          await fetchApi("/notes", {
            method: "POST",
            body: JSON.stringify({
              text: draft.content.trim(),
              tags: [draft.category.toLowerCase()],
              linkedActivityId: activityId,
            }),
          });
        }

        successfulIds.add(draft.id);
      } catch (error) {
        console.warn("Offline draft is still pending:", draft.id, error);
      }
    }

    const remaining = drafts.filter((draft) => !successfulIds.has(draft.id));

    try {
      persistDrafts(remaining, explicitUserId);
      setPendingDrafts(remaining);
      if (successfulIds.size > 0) {
        window.dispatchEvent(new CustomEvent("activity-logged"));
        window.dispatchEvent(
          new CustomEvent("offline-sync-completed", {
            detail: { count: successfulIds.size },
          })
        );
      }
      if (remaining.length > 0) {
        setSyncError(
          `${remaining.length} ${remaining.length === 1 ? "entry is" : "entries are"} still waiting to sync.`
        );
      }
    } finally {
      syncInFlight.current = false;
      setIsSyncing(false);
    }

    return successfulIds.size;
  }, [explicitUserId]);

  useEffect(() => {
    const onlineNow = typeof navigator !== "undefined" ? navigator.onLine : true;
    setIsOnline(onlineNow);
    loadDrafts();

    if (onlineNow) {
      void syncDrafts();
    }

    const handleOnline = () => {
      setIsOnline(true);
      void syncDrafts();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const unsubscribe = authClient.onAuthStateChange(() => {
      loadDrafts();
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe.unsubscribe();
    };
  }, [loadDrafts, syncDrafts]);

  return {
    isOnline,
    pendingDrafts,
    isSyncing,
    syncError,
    saveOfflineDraft,
    syncDrafts,
  };
}

"use client";

import { useEffect, useState, useCallback } from "react";

export interface StudyLogDraft {
  id: string;
  topic: string;
  durationMinutes: number;
  notes?: string;
  timestamp: number;
}

const STORAGE_KEY = "momentum_offline_drafts";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingDrafts, setPendingDrafts] = useState<StudyLogDraft[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Load existing drafts from LocalStorage
  const loadDrafts = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPendingDrafts(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to parse offline drafts:", err);
    }
  }, []);

  // Save new draft when offline
  const saveOfflineDraft = useCallback((draft: Omit<StudyLogDraft, "id" | "timestamp">) => {
    const newDraft: StudyLogDraft = {
      ...draft,
      id: "offline_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const current: StudyLogDraft[] = stored ? JSON.parse(stored) : [];
      const updated = [newDraft, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setPendingDrafts(updated);
      return newDraft;
    } catch (err) {
      console.error("Failed to save offline draft:", err);
      return null;
    }
  }, []);

  // Sync pending drafts with backend
  const syncDrafts = useCallback(async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const drafts: StudyLogDraft[] = JSON.parse(stored);
      if (drafts.length === 0) return;

      setIsSyncing(true);
      console.log(`[PWA Offline Sync] Attempting sync of ${drafts.length} drafts...`);

      // Attempt sending drafts to API endpoint if available
      const successfulIds: string[] = [];

      for (const draft of drafts) {
        try {
          const res = await fetch("/api/study-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(draft),
          });

          if (res.ok || res.status === 201) {
            successfulIds.push(draft.id);
          }
        } catch (e) {
          console.warn("[PWA Offline Sync] Failed to sync individual draft:", draft.id, e);
        }
      }

      // Filter out successfully synced drafts
      const remaining = drafts.filter((d) => !successfulIds.includes(d.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      setPendingDrafts(remaining);
    } catch (err) {
      console.error("[PWA Offline Sync] Error during draft synchronization:", err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    loadDrafts();

    const handleOnline = () => {
      setIsOnline(true);
      syncDrafts();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadDrafts, syncDrafts]);

  return {
    isOnline,
    pendingDrafts,
    isSyncing,
    saveOfflineDraft,
    syncDrafts,
  };
}

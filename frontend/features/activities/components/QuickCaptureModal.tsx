"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Check, Loader2, AlertCircle, Link as LinkIcon, Trash2 } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { authClient } from "@/lib/authClient";
import { useToast } from "@/components/ui/Toast";

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getDraftStorageKey(userId?: string | null): string {
  const effectiveId = userId ?? authClient.getUser()?.id;
  return effectiveId
    ? `momentum_qc_draft_${effectiveId}`
    : "momentum_qc_draft_anon";
}

export default function QuickCaptureModal() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"note" | "url">("note");
  const [title, setTitle] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("ENGINEERING");
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { isOnline, saveOfflineDraft } = useOfflineSync();
  const toast = useToast();

  const activeUserIdRef = useRef<string | null>(authClient.getUser()?.id || null);

  // Load user-scoped draft from sessionStorage
  const restoreDraft = useCallback((userId?: string | null) => {
    try {
      const key = getDraftStorageKey(userId);
      const savedDraft = sessionStorage.getItem(key);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === "object") {
          setType(parsed.type === "url" ? "url" : "note");
          setTitle(parsed.title || "");
          setUrlInput(parsed.urlInput || "");
          setContent(parsed.content || "");
          setCategory(parsed.category || "ENGINEERING");
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const persistCurrentDraft = useCallback(() => {
    try {
      const key = getDraftStorageKey(activeUserIdRef.current);
      const isDirty = Boolean(title.trim() || urlInput.trim() || content.trim());
      if (isDirty) {
        sessionStorage.setItem(
          key,
          JSON.stringify({ type, title, urlInput, content, category })
        );
      } else {
        sessionStorage.removeItem(key);
      }
    } catch {
      // ignore storage errors
    }
  }, [type, title, urlInput, content, category]);

  const clearDraft = useCallback(() => {
    try {
      const key = getDraftStorageKey(activeUserIdRef.current);
      sessionStorage.removeItem(key);
    } catch {
      // ignore storage errors
    }
    setTitle("");
    setUrlInput("");
    setContent("");
    setCategory("ENGINEERING");
    setType("note");
    setShowDiscardConfirm(false);
    setErrorMessage("");
    setWarningMessage("");
  }, []);

  // Sync draft to sessionStorage on state changes
  useEffect(() => {
    persistCurrentDraft();
  }, [persistCurrentDraft]);

  // Auth & Hotkey listener
  useEffect(() => {
    restoreDraft(activeUserIdRef.current);

    const authListener = authClient.onAuthStateChange((user) => {
      const nextId = user?.id || null;
      if (nextId !== activeUserIdRef.current) {
        activeUserIdRef.current = nextId;
        restoreDraft(nextId);
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => {
      setErrorMessage("");
      setWarningMessage("");
      setShowDiscardConfirm(false);
      setOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-quick-capture", handleCustomOpen);

    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "log") {
      handleCustomOpen();
      params.delete("action");
      const nextSearch = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`
      );
    }

    return () => {
      authListener.unsubscribe();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-quick-capture", handleCustomOpen);
    };
  }, [restoreDraft]);

  const isDirty = Boolean(title.trim() || urlInput.trim() || content.trim());
  const normalizedUrl = normalizeUrl(urlInput);
  const urlIsValid = !urlInput.trim() || isValidHttpUrl(normalizedUrl);

  const resetCapture = (delayMs: number) => {
    window.setTimeout(() => {
      setSaved(false);
      setOpen(false);
      clearDraft();
    }, delayMs);
  };

  const queueCurrentEntry = (message: string) => {
    const finalUrl = type === "url" ? normalizedUrl : undefined;
    const finalTitle =
      type === "url"
        ? title.trim() || (normalizedUrl ? new URL(normalizedUrl).hostname : "Link Entry")
        : title.trim();

    const queued = saveOfflineDraft({
      title: finalTitle,
      url: finalUrl,
      type,
      content: content.trim(),
      category,
    });

    if (!queued) return false;

    setWarningMessage(message);
    setSaved(true);
    toast.info("Offline Draft Saved", "Will sync automatically when you reconnect.");
    resetCapture(1600);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || saved) return;

    if (type === "url" && !urlInput.trim()) {
      setErrorMessage("Please enter a URL to save.");
      return;
    }

    if (type === "url" && !urlIsValid) {
      setErrorMessage("Please enter a valid HTTP or HTTPS URL.");
      return;
    }

    if (type === "note" && !title.trim()) {
      setErrorMessage("Please provide a title or topic summary.");
      return;
    }

    setErrorMessage("");
    setWarningMessage("");

    if (!isOnline || (typeof navigator !== "undefined" && !navigator.onLine)) {
      if (
        !queueCurrentEntry(
          "Saved on this device. Momentum will sync it when you reconnect."
        )
      ) {
        setErrorMessage("This entry could not be saved on this device.");
      }
      return;
    }

    setSubmitting(true);
    let partialFailure = false;
    let queuedAfterNetworkFailure = false;

    try {
      const actType = type === "url" ? "article" : "other";
      const finalUrl = type === "url" ? normalizedUrl : undefined;
      const finalTitle =
        type === "url"
          ? title.trim() || (normalizedUrl ? new URL(normalizedUrl).hostname : "Saved Resource")
          : title.trim();

      const activityRes = await fetchApi<{ data?: { id?: string } }>("/activities", {
        method: "POST",
        body: JSON.stringify({
          title: finalTitle,
          type: actType,
          source: "manual",
          url: finalUrl,
          tags: [category.toLowerCase()],
        }),
      });

      if (content.trim()) {
        try {
          await fetchApi("/notes", {
            method: "POST",
            body: JSON.stringify({
              text: content.trim(),
              tags: [category.toLowerCase()],
              linkedActivityId: activityRes?.data?.id || null,
            }),
          });
        } catch {
          partialFailure = true;
          setWarningMessage("The activity was saved, but its takeaways could not be attached.");
        }
      }

      window.dispatchEvent(new CustomEvent("activity-logged", { detail: activityRes?.data }));
      setSaved(true);
      toast.success("Activity Logged", `"${finalTitle}" was recorded.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save this entry.";
      if (message.includes("Unable to connect")) {
        queuedAfterNetworkFailure = queueCurrentEntry(
          "The server could not be reached, so this entry was saved on your device and will retry automatically."
        );
      }

      if (!queuedAfterNetworkFailure) {
        setErrorMessage(message);
        return;
      }
    } finally {
      setSubmitting(false);
    }

    if (!queuedAfterNetworkFailure) {
      resetCapture(partialFailure ? 2400 : 700);
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSubmit(e);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && submitting) return;
        setOpen(nextOpen);
        if (nextOpen) {
          setErrorMessage("");
          setWarningMessage("");
          setShowDiscardConfirm(false);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content
          onPointerDownOutside={(e) => {
            if (submitting) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (submitting) e.preventDefault();
          }}
          className="fixed bottom-0 inset-x-0 sm:bottom-auto sm:top-[15%] sm:left-[50%] sm:-translate-x-1/2 w-full max-w-lg bg-card rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-border-light z-50 focus:outline-none max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
        >
          {/* Mobile Bottom Sheet Grab Handle */}
          <div className="w-12 h-1 bg-border-light rounded-full mx-auto mb-3 sm:hidden" />

          <div className="flex items-center justify-between pb-3 border-b border-border-light">
            <div className="flex items-center space-x-2">
              <Dialog.Title className="font-serif italic text-xl text-charcoal">
                Quick Capture
              </Dialog.Title>
              <span className="text-[10px] font-mono bg-card-muted text-charcoal-muted px-1.5 py-0.5 rounded border border-border-subtle hidden sm:inline-block">
                ⌘K
              </span>
            </div>
            <Dialog.Close
              aria-label="Close quick capture dialog"
              className="text-charcoal-muted hover:text-charcoal p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
            >
              <X className="w-5 h-5 sm:w-4 sm:h-4" />
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-xs text-charcoal-muted mt-1 font-sans">
            Record study sessions, link resources, or write key insights without losing momentum.
          </Dialog.Description>

          <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="mt-4 space-y-4">
            {errorMessage && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Entry was not saved</p>
                  <p className="mt-0.5 text-xs leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {warningMessage && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
              >
                {warningMessage}
              </div>
            )}

            {/* Type selector tablist */}
            <div
              className="flex gap-2 p-1 bg-card-muted rounded-xl text-xs"
              role="tablist"
              aria-label="Entry type"
            >
              <button
                type="button"
                role="tab"
                id="tab-note"
                aria-selected={type === "note"}
                aria-controls="panel-note"
                onClick={() => setType("note")}
                className={`flex-1 min-h-10 py-1.5 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal ${
                  type === "note"
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                Reflection / Note
              </button>
              <button
                type="button"
                role="tab"
                id="tab-url"
                aria-selected={type === "url"}
                aria-controls="panel-url"
                onClick={() => setType("url")}
                className={`flex-1 min-h-10 py-1.5 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal ${
                  type === "url"
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                URL / Resource
              </button>
            </div>

            {/* Inputs based on type */}
            {type === "note" ? (
              <div id="panel-note" role="tabpanel" aria-labelledby="tab-note">
                <label
                  htmlFor="capture-title"
                  className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-1"
                >
                  Topic / Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="capture-title"
                  name="capture-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What did you study or focus on?"
                  className="w-full min-h-11 px-3.5 py-2 text-base sm:text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal placeholder-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-1 transition-colors"
                  autoFocus
                />
              </div>
            ) : (
              <div id="panel-url" role="tabpanel" aria-labelledby="tab-url" className="space-y-3">
                <div>
                  <label
                    htmlFor="capture-url"
                    className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-1"
                  >
                    URL Link <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="capture-url"
                      name="capture-url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="github.com/org/repo or https://..."
                      className={`w-full min-h-11 pl-9 pr-3 py-2 text-base sm:text-sm bg-card-muted/50 border rounded-xl text-charcoal placeholder-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-1 transition-colors ${
                        !urlIsValid ? "border-red-400 bg-red-50/20" : "border-border-light"
                      }`}
                      autoFocus
                    />
                    <LinkIcon className="w-4 h-4 text-charcoal-muted absolute left-3 top-3.5" />
                  </div>
                  {!urlIsValid && (
                    <p className="text-[11px] text-red-600 mt-1">
                      Please enter a valid URL (e.g. https://example.com or example.com)
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="capture-url-title"
                    className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-1"
                  >
                    Display Title <span className="text-[11px] text-charcoal-muted/70 lowercase font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="capture-url-title"
                    name="capture-url-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Distributed Systems Paper or leave empty for domain name"
                    className="w-full min-h-11 px-3.5 py-2 text-base sm:text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal placeholder-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-1 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Category Selector */}
            <div>
              <span className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-1">
                Category
              </span>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Category selector">
                {["ENGINEERING", "SYSTEMS", "PRODUCT"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    aria-pressed={category === cat}
                    className={`min-h-10 text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal ${
                      category === cat
                        ? "bg-charcoal text-white border-charcoal"
                        : "bg-badge-driftBg text-badge-driftText border-transparent hover:border-border-light"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes textarea */}
            <div>
              <label
                htmlFor="capture-notes"
                className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-1"
              >
                Key Insights & Takeaways <span className="text-[11px] text-charcoal-muted/70 lowercase font-normal">(optional)</span>
              </label>
              <textarea
                value={content}
                id="capture-notes"
                name="capture-notes"
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                placeholder="Add contextual thoughts, notes, or learnings... (Press ⌘+Enter to save)"
                className="w-full px-3.5 py-2 text-base sm:text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal placeholder-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-1 transition-colors resize-none"
              />
            </div>

            {/* Submit & Discard Toolbar */}
            <div className="flex items-center justify-between pt-2 border-t border-border-light/60">
              {isDirty && !saved ? (
                showDiscardConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 font-medium">Discard draft?</span>
                    <button
                      type="button"
                      onClick={clearDraft}
                      className="text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-md transition-colors"
                    >
                      Yes, discard
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDiscardConfirm(false)}
                      className="text-xs text-charcoal-muted hover:text-charcoal px-2 py-1"
                    >
                      Keep
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDiscardConfirm(true)}
                    className="inline-flex items-center gap-1 text-xs text-charcoal-muted hover:text-red-600 px-2 py-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Discard Draft</span>
                  </button>
                )
              ) : (
                <span className="text-[11px] text-charcoal-muted font-mono hidden sm:inline-block">
                  ⌘+Enter to save
                </span>
              )}

              <button
                type="submit"
                disabled={submitting || saved || (type === "note" ? !title.trim() : !urlInput.trim())}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-charcoal hover:bg-black text-white px-5 py-2 text-sm font-medium transition-all shadow active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 ml-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Saving...</span>
                  </>
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Captured!</span>
                  </>
                ) : (
                  <span>Save Entry</span>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

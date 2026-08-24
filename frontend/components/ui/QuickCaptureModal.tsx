"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Check, Loader2, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function QuickCaptureModal() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"note" | "url">("note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("ENGINEERING");
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-quick-capture", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-quick-capture", handleCustomOpen);
    };
  }, []);

  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || saved || !title.trim()) return;

    setSubmitting(true);
    setErrorMessage("");
    setWarningMessage("");
    let partialFailure = false;

    try {
      const actType = type === "url" ? "article" : "other";
      const validUrl = type === "url" && title.startsWith("http") ? title : undefined;

      const activityRes = await fetchApi<{ data?: { id?: string } }>("/activities", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          type: actType,
          source: "manual",
          url: validUrl,
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

      // Notify ActivityFeed & Timeline to refresh live entries with optimistic item detail
      window.dispatchEvent(new CustomEvent("activity-logged", { detail: activityRes?.data }));
      setSaved(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save this entry.";
      setErrorMessage(message);
      return;
    } finally {
      setSubmitting(false);
    }

    setTimeout(() => {
      setSaved(false);
      setOpen(false);
      setTitle("");
      setContent("");
    }, partialFailure ? 2400 : 800);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed bottom-0 inset-x-0 sm:bottom-auto sm:top-[15%] sm:left-[50%] sm:-translate-x-1/2 w-full max-w-lg bg-card rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-border-light z-50 focus:outline-none max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-border-light">
            <div className="flex items-center space-x-2">
              <Dialog.Title className="font-serif italic text-xl text-charcoal">
                Quick Capture
              </Dialog.Title>
              <span className="text-[10px] font-mono bg-card-muted text-charcoal-muted px-1.5 py-0.5 rounded border border-border-subtle hidden sm:inline-block">
                ⌘K
              </span>
            </div>
            <Dialog.Close aria-label="Close quick capture" className="text-charcoal-muted hover:text-charcoal p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal">
              <X className="w-5 h-5 sm:w-4 sm:h-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {errorMessage && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Entry was not saved</p>
                  <p className="mt-0.5 text-xs leading-relaxed">{errorMessage} Your input is still here—check your connection and try again.</p>
                </div>
              </div>
            )}
            {warningMessage && (
              <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                {warningMessage}
              </div>
            )}
            {/* Type selector */}
            <div className="flex gap-2 p-1 bg-card-muted rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setType("note")}
                className={`flex-1 py-2 sm:py-1.5 rounded-md font-medium transition-all ${
                  type === "note"
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                Reflection / Note
              </button>
              <button
                type="button"
                onClick={() => setType("url")}
                className={`flex-1 py-2 sm:py-1.5 rounded-md font-medium transition-all ${
                  type === "url"
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                URL / Resource
              </button>
            </div>

            {/* Title / Input */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-1">
                {type === "note" ? "Title / Summary" : "URL Link"}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === "note"
                    ? "What did you focus on today?"
                    : "https://github.com/..."
                }
                className="w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal placeholder-charcoal-muted/60 focus:outline-none focus:border-charcoal transition-colors"
                autoFocus
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-1">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {["ENGINEERING", "SYSTEMS", "PRODUCT"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`text-[11px] uppercase tracking-wider px-3.5 py-1.5 rounded-full border transition-all ${
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
              <label className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-1">
                Key Insights & Takeaways
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                placeholder="Add contextual thoughts or key observations..."
                className="w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal placeholder-charcoal-muted/60 focus:outline-none focus:border-charcoal transition-colors resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || saved || !title.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-charcoal hover:bg-black text-white px-5 py-2 text-sm font-medium transition-all shadow active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
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

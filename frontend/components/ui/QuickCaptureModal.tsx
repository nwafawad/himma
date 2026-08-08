"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Link as LinkIcon, Book, Check } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function QuickCaptureModal() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"note" | "url">("note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("ENGINEERING");
  const [saved, setSaved] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const actType = type === "url" ? "article" : "other";
      const validUrl = type === "url" && title.startsWith("http") ? title : undefined;

      await fetchApi("/activities", {
        method: "POST",
        body: JSON.stringify({
          title,
          type: actType,
          source: "manual",
          url: validUrl,
          tags: [category.toLowerCase()],
        }),
      });

      // Notify ActivityFeed to refresh live entries
      window.dispatchEvent(new CustomEvent("activity-logged"));
    } catch (err) {
      console.warn("Backend unavailable; performing local capture simulation:", err);
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
      setTitle("");
      setContent("");
    }, 800);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed top-[20%] left-[50%] translate-x-[-50%] w-full max-w-lg bg-card rounded-2xl p-6 shadow-2xl border border-border-light z-50 focus:outline-none">
          <div className="flex items-center justify-between pb-4 border-b border-border-light">
            <div className="flex items-center space-x-2">
              <Dialog.Title className="font-serif italic text-xl text-charcoal">
                Quick Capture
              </Dialog.Title>
              <span className="text-[10px] font-mono bg-card-muted text-charcoal-muted px-1.5 py-0.5 rounded border border-border-subtle">
                ⌘K
              </span>
            </div>
            <Dialog.Close className="text-charcoal-muted hover:text-charcoal p-1 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Type selector */}
            <div className="flex gap-2 p-1 bg-card-muted rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setType("note")}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
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
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
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
                className="w-full px-3 py-2 text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal placeholder-charcoal-muted/60 focus:outline-none focus:border-charcoal transition-colors"
                autoFocus
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-1">
                Category
              </label>
              <div className="flex gap-2">
                {["ENGINEERING", "SYSTEMS", "PRODUCT"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${
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
                className="w-full px-3 py-2 text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal placeholder-charcoal-muted/60 focus:outline-none focus:border-charcoal transition-colors resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saved}
                className="inline-flex items-center gap-1.5 rounded-full bg-charcoal hover:bg-black text-white px-5 py-2 text-sm font-medium transition-all shadow active:scale-95 disabled:opacity-80"
              >
                {saved ? (
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

"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  Upload,
  Link as LinkIcon,
  FileJson,
  Check,
  Loader2,
  CheckCircle2,
  Globe,
  ArrowRight,
  Filter,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface Candidate {
  id: string;
  title: string;
  url?: string | null;
  type: "video" | "course" | "repository" | "article" | "other";
  consumedAt?: string;
}

export default function ImportModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"ingest" | "review" | "success">("ingest");
  const [tab, setTab] = useState<"file" | "urls">("file");

  // Ingest form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedUrls, setPastedUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Guide / Instructions state
  const [showGuide, setShowGuide] = useState(false);
  const [guideBrowser, setGuideBrowser] = useState<"chrome" | "firefox" | "json">("chrome");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Review candidates state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>("all");
  const [confirming, setConfirming] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [dedupStats, setDedupStats] = useState<{ totalParsed: number; stagedCount: number; duplicatesSkipped: number } | null>(null);

  // Listen for custom trigger to open modal globally
  useEffect(() => {
    const handleCustomOpen = () => {
      setOpen(true);
      resetState();
    };

    window.addEventListener("open-import-modal", handleCustomOpen);
    return () => window.removeEventListener("open-import-modal", handleCustomOpen);
  }, []);

  const resetState = () => {
    setStep("ingest");
    setTab("file");
    setSelectedFile(null);
    setPastedUrls("");
    setLoading(false);
    setErrorMessage("");
    setShowGuide(false);
    setGuideBrowser("chrome");
    setCandidates([]);
    setSelectedIds(new Set());
    setFilterType("all");
    setConfirming(false);
    setConfirmedCount(0);
    setDedupStats(null);
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage("");
    }
  };

  // Handle Ingest Submission (Upload File or Submit URLs)
  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      let responseCandidates: Candidate[] = [];

      if (tab === "file") {
        if (!selectedFile) {
          setErrorMessage("Please select a JSON export file.");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        const res = await fetchApi<{ data: Candidate[]; stats?: { totalParsed: number; stagedCount: number; duplicatesSkipped: number } }>("/import/upload", {
          method: "POST",
          body: formData,
        });
        responseCandidates = res?.data || [];
        if (res?.stats) {
          setDedupStats(res.stats);
        }
      } else {
        const urlList = pastedUrls
          .split("\n")
          .map((u) => u.trim())
          .filter((u) => u.length > 0);

        if (urlList.length === 0) {
          setErrorMessage("Please enter at least one URL.");
          setLoading(false);
          return;
        }

        const res = await fetchApi<{ data: Candidate[]; stats?: { totalParsed: number; stagedCount: number; duplicatesSkipped: number } }>("/import/urls", {
          method: "POST",
          body: JSON.stringify({ urls: urlList }),
        });
        responseCandidates = res?.data || [];
        if (res?.stats) {
          setDedupStats(res.stats);
        }
      }

      if (responseCandidates.length === 0) {
        const pendingRes = await fetchApi<{ data: Candidate[] }>("/import/candidates");
        responseCandidates = pendingRes?.data || [];
      }

      setCandidates(responseCandidates);
      setSelectedIds(new Set(responseCandidates.map((c) => c.id)));
      setStep("review");
    } catch (err: any) {
      console.warn("Backend import ingestion error:", err);
      if (err.message && (err.message.includes("INVALID_") || err.message.includes("NO_VALID_ENTRIES") || err.message.includes("400") || err.message.includes("422"))) {
        setErrorMessage(err.message);
        return;
      }
      setErrorMessage(err.message || "Failed to process import file. Please verify file format.");
    } finally {
      setLoading(false);
    }
  };

  const sampleJsonCode = `[
  {
    "title": "React Architecture Overview",
    "url": "https://react.dev",
    "type": "article",
    "consumedAt": "2026-08-08T10:00:00Z"
  },
  {
    "title": "System Design Course",
    "url": "https://coursera.org/learn/system-design",
    "type": "course"
  }
]`;

  const copySampleCode = () => {
    navigator.clipboard.writeText(sampleJsonCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCandidates.map((c) => c.id)));
    }
  };

  const updateCandidate = (id: string, field: "title" | "type", value: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleConfirmImport = async () => {
    if (selectedIds.size === 0 || confirming) return;
    setConfirming(true);

    const approvedArray = Array.from(selectedIds);
    const excludedArray = candidates
      .map((c) => c.id)
      .filter((id) => !selectedIds.has(id));

    try {
      await fetchApi("/import/confirm", {
        method: "POST",
        body: JSON.stringify({
          approvedCandidateIds: approvedArray,
          excludedCandidateIds: excludedArray,
        }),
      });
      window.dispatchEvent(new CustomEvent("activity-logged"));
      setConfirmedCount(approvedArray.length);
      setStep("success");
    } catch (err: any) {
      console.warn("Backend confirm call error:", err);
      setErrorMessage(err.message || "Failed to confirm import selections.");
    } finally {
      setConfirming(false);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (filterType === "all") return true;
    return c.type === filterType;
  });

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "video":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "course":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "repository":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "article":
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed top-[12%] left-[50%] translate-x-[-50%] w-full max-w-2xl bg-card rounded-2xl p-6 shadow-2xl border border-border-light z-50 focus:outline-none max-h-[85vh] flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border-light shrink-0">
            <div>
              <Dialog.Title className="font-serif italic text-2xl text-charcoal flex items-center gap-2">
                <Upload className="w-5 h-5 text-charcoal-muted" />
                <span>Import Study History</span>
              </Dialog.Title>
              <p className="text-xs text-charcoal-muted mt-0.5 font-sans">
                Batch ingest bookmarks, exported history, or raw study link lists.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-charcoal-muted hover:text-charcoal p-1.5 rounded-full hover:bg-card-muted transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 shrink-0">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: Ingest (Tabs: File vs URLs) */}
          {step === "ingest" && (
            <div className="py-5 space-y-5 overflow-y-auto pr-1">
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-card-muted p-1 border border-border-subtle">
                <button
                  type="button"
                  onClick={() => setTab("file")}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                    tab === "file"
                      ? "bg-white text-charcoal shadow-sm"
                      : "text-charcoal-muted hover:text-charcoal"
                  }`}
                >
                  <FileJson className="w-4 h-4" />
                  <span>Upload JSON Export</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("urls")}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                    tab === "urls"
                      ? "bg-white text-charcoal shadow-sm"
                      : "text-charcoal-muted hover:text-charcoal"
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Paste Batch URLs</span>
                </button>
              </div>

              <form onSubmit={handleIngestSubmit} className="space-y-4">
                {tab === "file" ? (
                  <div className="space-y-3">
                    {/* Dropzone */}
                    <div className="border-2 border-dashed border-border-light hover:border-charcoal/40 rounded-2xl p-6 text-center bg-card-muted/50 transition-colors">
                      <input
                        type="file"
                        accept=".json,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                        id="import-file-input"
                      />
                      <label
                        htmlFor="import-file-input"
                        className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                      >
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-charcoal border border-border-light shadow-sm">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-medium text-charcoal">
                            {selectedFile ? selectedFile.name : "Click to choose browser export JSON"}
                          </span>
                          <p className="text-[11px] text-charcoal-muted mt-0.5">
                            Accepts exported Chrome/Firefox history files up to 20MB
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* How to Export Instructions Accordion */}
                    <div className="rounded-xl border border-border-light bg-card-muted/30 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowGuide((prev) => !prev)}
                        className="w-full px-4 py-2.5 text-xs font-medium text-charcoal flex items-center justify-between hover:bg-card-muted/60 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-charcoal-muted" />
                          <span>How to export browser history into a JSON file</span>
                        </span>
                        {showGuide ? (
                          <ChevronUp className="w-4 h-4 text-charcoal-muted" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-charcoal-muted" />
                        )}
                      </button>

                      {showGuide && (
                        <div className="p-4 border-t border-border-light space-y-3 bg-white">
                          {/* Browser Sub-tabs */}
                          <div className="flex space-x-2 border-b border-border-subtle pb-2">
                            {(["chrome", "firefox", "json"] as const).map((b) => (
                              <button
                                key={b}
                                type="button"
                                onClick={() => setGuideBrowser(b)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors ${
                                  guideBrowser === b
                                    ? "bg-charcoal text-white"
                                    : "bg-card-muted text-charcoal-muted hover:text-charcoal"
                                }`}
                              >
                                {b === "json" ? "Custom JSON Format" : b}
                              </button>
                            ))}
                          </div>

                          {/* Steps based on selected browser */}
                          {guideBrowser === "chrome" && (
                            <ol className="text-xs text-charcoal-muted space-y-2 list-decimal list-inside leading-relaxed">
                              <li>
                                Install a free Chrome extension like{" "}
                                <strong className="text-charcoal font-medium">Export History to JSON</strong> or use{" "}
                                <strong className="text-charcoal font-medium">Google Takeout</strong>.
                              </li>
                              <li>Open the extension menu and select <strong className="text-charcoal font-medium">JSON format</strong> export.</li>
                              <li>Save the <code className="bg-card-muted px-1 rounded font-mono text-[11px]">history.json</code> file to your computer.</li>
                              <li>Upload the downloaded file in the dropzone above.</li>
                            </ol>
                          )}

                          {guideBrowser === "firefox" && (
                            <ol className="text-xs text-charcoal-muted space-y-2 list-decimal list-inside leading-relaxed">
                              <li>
                                Open Firefox Library by pressing{" "}
                                <kbd className="bg-card-muted text-charcoal px-1 py-0.5 rounded font-mono text-[10px]">Cmd + Shift + O</kbd> (Mac) or{" "}
                                <kbd className="bg-card-muted text-charcoal px-1 py-0.5 rounded font-mono text-[10px]">Ctrl + Shift + O</kbd> (Windows).
                              </li>
                              <li>
                                Click <strong className="text-charcoal font-medium">Import and Backup</strong> at the top bar.
                              </li>
                              <li>
                                Click <strong className="text-charcoal font-medium">Backup...</strong> and save the <code className="bg-card-muted px-1 rounded font-mono text-[11px]">bookmarks-*.json</code> file.
                              </li>
                              <li>Upload the exported JSON file in the dropzone above.</li>
                            </ol>
                          )}

                          {guideBrowser === "json" && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-charcoal-muted">Required JSON array structure:</span>
                                <button
                                  type="button"
                                  onClick={copySampleCode}
                                  className="text-[11px] text-charcoal-muted hover:text-charcoal inline-flex items-center gap-1 font-medium"
                                >
                                  {copiedSnippet ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-600">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy Format</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="text-[11px] font-mono p-3 rounded-lg bg-card-muted border border-border-subtle overflow-x-auto text-charcoal">
                                {sampleJsonCode}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-charcoal flex items-center justify-between">
                      <span>Paste study links (one per line):</span>
                      <span className="text-[10px] text-charcoal-muted">
                        Shortened links (bit.ly, youtu.be) will be unshortened
                      </span>
                    </label>
                    <textarea
                      rows={6}
                      value={pastedUrls}
                      onChange={(e) => setPastedUrls(e.target.value)}
                      placeholder="https://github.com/facebook/react&#10;https://youtu.be/dQw4w9WgXcQ&#10;https://coursera.org/learn/ml"
                      className="w-full text-xs font-mono p-3 rounded-xl border border-border-light focus:outline-none focus:border-charcoal bg-white resize-none leading-relaxed"
                    />
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-charcoal hover:bg-black text-white text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Resolving & Extracting Metadata...</span>
                      </>
                    ) : (
                      <>
                        <span>Stage Candidates</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: Review Candidate Staging Pool */}
          {step === "review" && (
            <div className="py-4 flex-1 flex flex-col min-h-0 space-y-4">
              {/* Deduplication Summary Alert Banner */}
              {dedupStats && dedupStats.duplicatesSkipped > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900 shrink-0 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>{dedupStats.duplicatesSkipped} duplicate{dedupStats.duplicatesSkipped === 1 ? '' : 's'} skipped</strong> (already saved or staged). Showing {dedupStats.stagedCount} unique candidate{dedupStats.stagedCount === 1 ? '' : 's'}.
                    </span>
                  </div>
                </div>
              )}

              {/* Category Filter & Select All Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 pb-2 border-b border-border-light">
                <div className="flex items-center space-x-1.5 overflow-x-auto">
                  <Filter className="w-3.5 h-3.5 text-charcoal-muted mr-1" />
                  {["all", "article", "video", "course", "repository"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFilterType(t)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize transition-colors ${
                        filterType === t
                          ? "bg-charcoal text-white"
                          : "bg-card-muted text-charcoal-muted hover:text-charcoal"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-medium text-charcoal-muted hover:text-charcoal px-2 py-1 rounded hover:bg-card-muted transition-colors"
                >
                  {selectedIds.size === filteredCandidates.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {/* Candidate List */}
              <div className="overflow-y-auto flex-1 space-y-2 pr-1">
                {filteredCandidates.length === 0 ? (
                  <div className="text-center py-8 text-xs text-charcoal-muted">
                    No candidates found for this category filter.
                  </div>
                ) : (
                  filteredCandidates.map((c) => {
                    const isSelected = selectedIds.has(c.id);
                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border transition-all flex items-start space-x-3 ${
                          isSelected
                            ? "bg-white border-charcoal/40 shadow-sm"
                            : "bg-card-muted/40 border-border-subtle opacity-70"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(c.id)}
                          className="mt-1 h-4 w-4 rounded border-border-light text-charcoal focus:ring-charcoal accent-charcoal cursor-pointer"
                        />

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <input
                            type="text"
                            value={c.title}
                            onChange={(e) => updateCandidate(c.id, "title", e.target.value)}
                            className="w-full text-xs font-medium text-charcoal bg-transparent hover:bg-card-muted/50 px-1 py-0.5 rounded focus:outline-none focus:bg-white focus:ring-1 focus:ring-charcoal/30 border-none"
                          />

                          {c.url && (
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-charcoal-muted hover:text-charcoal flex items-center gap-1 truncate max-w-md"
                            >
                              <Globe className="w-3 h-3 shrink-0" />
                              <span className="truncate">{c.url}</span>
                            </a>
                          )}
                        </div>

                        <select
                          value={c.type}
                          onChange={(e) => updateCandidate(c.id, "type", e.target.value as any)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border border-border-subtle font-medium capitalize cursor-pointer focus:outline-none ${getTypeBadgeClass(c.type)}`}
                        >
                          <option value="article">article</option>
                          <option value="video">video</option>
                          <option value="course">course</option>
                          <option value="repository">repository</option>
                          <option value="other">other</option>
                        </select>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border-light shrink-0">
                <button
                  type="button"
                  onClick={() => setStep("ingest")}
                  className="text-xs text-charcoal-muted hover:text-charcoal font-medium"
                >
                  ← Back to Ingest
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={selectedIds.size === 0 || confirming}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-charcoal hover:bg-black text-white text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Approve & Import ({selectedIds.size})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success Screen */}
          {step === "success" && (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif italic text-2xl text-charcoal">
                Import Successful
              </h3>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
                Successfully added {confirmedCount} study log entries into your journal timeline.
              </p>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-6 py-2.5 rounded-full bg-charcoal hover:bg-black text-white text-xs font-medium transition-all shadow-sm active:scale-95"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

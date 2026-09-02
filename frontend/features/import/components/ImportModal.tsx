"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { ImportCandidate, ImportStats, CandidateOverride } from "@himma/contracts";
import {
  confirmImport,
  listPendingCandidates,
  stageUrls,
  uploadHistory,
} from "@/features/import/api";
import { getErrorMessage } from "@/lib/errors";
import { useToast } from "@/components/ui/Toast";
import ImportGuide from "./ImportGuide";

const MAX_IMPORT_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const CANDIDATES_PER_PAGE = 12;

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

export default function ImportModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"ingest" | "review" | "success">("ingest");
  const [tab, setTab] = useState<"file" | "urls">("file");

  // Ingest state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedUrls, setPastedUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Review state
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dirtyOverrides, setDirtyOverrides] = useState<Map<string, CandidateOverride>>(new Map());
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [dedupStats, setDedupStats] = useState<ImportStats | null>(null);

  const toast = useToast();

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
    setCandidates([]);
    setSelectedIds(new Set());
    setDirtyOverrides(new Map());
    setFilterType("all");
    setSearchQuery("");
    setCurrentPage(1);
    setConfirming(false);
    setConfirmedCount(0);
    setDedupStats(null);
  };

  // Shared file verification
  const processFile = (file: File) => {
    if (!file.name.endsWith(".json") && !file.name.endsWith(".txt")) {
      setErrorMessage("Please select a valid .json or .txt export file.");
      return;
    }
    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      setErrorMessage("The selected file exceeds the 20MB maximum size limit.");
      return;
    }
    setSelectedFile(file);
    setErrorMessage("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Live URL analysis
  const urlStats = useMemo(() => {
    const rawLines = pastedUrls.split("\n").map((u) => u.trim()).filter(Boolean);
    const normalized = rawLines.map(normalizeUrl);
    const valid = normalized.filter(isValidHttpUrl);
    const invalid = normalized.filter((u) => !isValidHttpUrl(u));
    const unique = new Set(valid);
    const duplicates = valid.length - unique.size;
    return {
      total: rawLines.length,
      validCount: unique.size,
      invalidCount: invalid.length,
      duplicateCount: duplicates,
    };
  }, [pastedUrls]);

  // Ingest submission
  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      let responseCandidates: ImportCandidate[] = [];

      if (tab === "file") {
        if (!selectedFile) {
          setErrorMessage("Please select or drop a JSON export file.");
          setLoading(false);
          return;
        }

        const res = await uploadHistory(selectedFile);
        responseCandidates = res.data;
        if (res.stats) {
          setDedupStats(res.stats);
        }
      } else {
        const rawLines = pastedUrls.split("\n").map((u) => u.trim()).filter(Boolean);
        const urlList = Array.from(new Set(rawLines.map(normalizeUrl).filter(isValidHttpUrl)));

        if (urlList.length === 0) {
          setErrorMessage("Please enter at least one valid HTTP or HTTPS URL.");
          setLoading(false);
          return;
        }

        const res = await stageUrls(urlList);
        responseCandidates = res.data;
        if (res.stats) {
          setDedupStats(res.stats);
        }
      }

      if (responseCandidates.length === 0) {
        const pendingRes = await listPendingCandidates();
        responseCandidates = pendingRes.data;
      }

      setCandidates(responseCandidates);
      setSelectedIds(new Set(responseCandidates.map((c) => c.id)));
      setDirtyOverrides(new Map());
      setCurrentPage(1);
      setStep("review");
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to process import. Please verify data format.");
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  // Selection toggles
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (filterType !== "all" && c.type !== filterType) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(query);
        const matchesUrl = c.url ? c.url.toLowerCase().includes(query) : false;
        if (!matchesTitle && !matchesUrl) return false;
      }
      return true;
    });
  }, [candidates, filterType, searchQuery]);

  const toggleSelectVisible = () => {
    const visibleIds = filteredCandidates.map((c) => c.id);
    const allVisibleSelected = visibleIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map((c) => c.id)));
    }
  };

  // Candidate updates & dirty overrides tracking
  const updateCandidate = (id: string, field: "title" | "type", value: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (field === "title") return { ...c, title: value };
        return { ...c, type: value as ImportCandidate["type"] };
      })
    );

    setDirtyOverrides((prev) => {
      const next = new Map(prev);
      const existing = next.get(id) || { id };
      if (field === "title") existing.title = value;
      if (field === "type") existing.type = value as ImportCandidate["type"];
      next.set(id, existing);
      return next;
    });
  };

  // Bulk type changes for selected candidates
  const handleBulkTypeChange = (newType: ImportCandidate["type"]) => {
    if (selectedIds.size === 0) return;

    setCandidates((prev) =>
      prev.map((c) => {
        if (selectedIds.has(c.id)) {
          return { ...c, type: newType };
        }
        return c;
      })
    );

    setDirtyOverrides((prev) => {
      const next = new Map(prev);
      selectedIds.forEach((id) => {
        const existing = next.get(id) || { id };
        existing.type = newType;
        next.set(id, existing);
      });
      return next;
    });
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / CANDIDATES_PER_PAGE));
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * CANDIDATES_PER_PAGE;
    return filteredCandidates.slice(start, start + CANDIDATES_PER_PAGE);
  }, [filteredCandidates, currentPage]);

  // Confirmation with dirty overrides
  const handleConfirmImport = async () => {
    if (selectedIds.size === 0 || confirming) return;
    setConfirming(true);
    setErrorMessage("");

    const approvedArray = Array.from(selectedIds);
    const excludedArray = candidates
      .map((c) => c.id)
      .filter((id) => !selectedIds.has(id));

    // Send overrides only for approved candidates
    const overridesToSend = approvedArray
      .map((id) => dirtyOverrides.get(id))
      .filter((o): o is CandidateOverride => Boolean(o));

    try {
      await confirmImport({
        approvedCandidateIds: approvedArray,
        excludedCandidateIds: excludedArray,
        overrides: overridesToSend,
      });

      window.dispatchEvent(new CustomEvent("activity-logged"));
      setConfirmedCount(approvedArray.length);
      toast.success("Import Completed", `Successfully imported ${approvedArray.length} learning logs.`);
      setStep("success");
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, "Failed to confirm import selections."));
    } finally {
      setConfirming(false);
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "video":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "course":
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "repository":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "article":
      default:
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && confirming) return;
        setOpen(nextOpen);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content
          onPointerDownOutside={(e) => {
            if (confirming) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (confirming) e.preventDefault();
          }}
          className="fixed bottom-0 inset-x-0 sm:bottom-auto sm:top-[8%] sm:left-1/2 sm:-translate-x-1/2 w-full max-w-2xl bg-card rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-border-light z-50 focus:outline-none max-h-[92vh] sm:max-h-[85vh] flex flex-col pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
        >
          {/* Mobile Sheet Indicator */}
          <div className="w-12 h-1 bg-border-light rounded-full mx-auto mb-3 sm:hidden" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border-light shrink-0">
            <div>
              <Dialog.Title className="font-serif italic text-2xl text-charcoal flex items-center gap-2">
                <Upload className="w-5 h-5 text-charcoal-muted" />
                <span>Import Study History</span>
              </Dialog.Title>
              <Dialog.Description className="text-xs text-charcoal-muted mt-0.5 font-sans">
                Batch ingest bookmarks, browser exported history, or raw link lists into your journal.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close import dialog"
              className="text-charcoal-muted hover:text-charcoal p-1.5 rounded-full hover:bg-card-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
            >
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 shrink-0"
            >
              {errorMessage}
            </div>
          )}

          {/* STEP 1: Ingest (File vs URLs) */}
          {step === "ingest" && (
            <div className="py-4 space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Tab Selector */}
              <div
                role="tablist"
                aria-label="Import methods"
                className="flex rounded-xl bg-card-muted p-1 border border-border-subtle"
              >
                <button
                  type="button"
                  role="tab"
                  id="import-tab-file"
                  aria-selected={tab === "file"}
                  aria-controls="import-panel-file"
                  onClick={() => setTab("file")}
                  className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal ${
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
                  role="tab"
                  id="import-tab-urls"
                  aria-selected={tab === "urls"}
                  aria-controls="import-panel-urls"
                  onClick={() => setTab("urls")}
                  className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal ${
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
                  <div id="import-panel-file" role="tabpanel" aria-labelledby="import-tab-file" className="space-y-3">
                    {/* Native Drag & Drop Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                      }}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        isDragging
                          ? "border-charcoal bg-card-muted"
                          : "border-border-light hover:border-charcoal/40 bg-card-muted/40"
                      }`}
                    >
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
                        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-charcoal border border-border-light shadow-sm">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-charcoal">
                            {selectedFile ? selectedFile.name : "Choose or drag browser history JSON here"}
                          </span>
                          <p className="text-[11px] text-charcoal-muted mt-0.5">
                            Chrome, Firefox, or custom JSON export up to 20MB
                          </p>
                        </div>
                      </label>
                    </div>

                    <ImportGuide />
                  </div>
                ) : (
                  <div id="import-panel-urls" role="tabpanel" aria-labelledby="import-tab-urls" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="pasted-urls-textarea" className="text-xs font-medium text-charcoal">
                        Paste links (one per line):
                      </label>
                      {urlStats.total > 0 && (
                        <span className="text-[11px] text-charcoal-muted font-mono">
                          {urlStats.validCount} valid
                          {urlStats.invalidCount > 0 && ` • ${urlStats.invalidCount} invalid`}
                          {urlStats.duplicateCount > 0 && ` • ${urlStats.duplicateCount} duplicate`}
                        </span>
                      )}
                    </div>
                    <textarea
                      id="pasted-urls-textarea"
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
                    disabled={loading || (tab === "file" ? !selectedFile : urlStats.validCount === 0)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-charcoal px-6 py-2.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-black active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Resolving & Staging Candidates...</span>
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

          {/* STEP 2: Review Candidates Pool */}
          {step === "review" && (
            <div className="py-3 flex-1 flex flex-col min-h-0 space-y-3">
              {/* Dedup Summary Banner */}
              {dedupStats && dedupStats.duplicatesSkipped > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 shrink-0 flex items-center justify-between">
                  <span>
                    <strong>{dedupStats.duplicatesSkipped} duplicate(s) skipped</strong> (already saved). Showing {dedupStats.stagedCount} unique candidate(s).
                  </span>
                </div>
              )}

              {/* Filter Bar & Search */}
              <div className="flex flex-col gap-2.5 shrink-0 pb-2 border-b border-border-light">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5 overflow-x-auto">
                    <Filter className="w-3.5 h-3.5 text-charcoal-muted mr-1" />
                    {["all", "article", "video", "course", "repository", "other"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setFilterType(t);
                          setCurrentPage(1);
                        }}
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

                  {/* Selection Action Controls */}
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={toggleSelectVisible}
                      className="text-charcoal-muted hover:text-charcoal px-2 py-1 rounded hover:bg-card-muted font-medium transition-colors"
                    >
                      Toggle Visible
                    </button>
                    <span className="text-border-light">|</span>
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-charcoal-muted hover:text-charcoal px-2 py-1 rounded hover:bg-card-muted font-medium transition-colors"
                    >
                      {selectedIds.size === candidates.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                </div>

                {/* Search & Bulk Type Changer */}
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-3.5 h-3.5 text-charcoal-muted absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Filter candidates by title or URL..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border-light bg-card-muted/30 focus:outline-none focus:border-charcoal transition-colors"
                    />
                  </div>

                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-1.5 shrink-0 text-xs">
                      <span className="text-charcoal-muted text-[11px]">Set selected ({selectedIds.size}) to:</span>
                      <select
                        aria-label="Bulk set category type for selected candidates"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleBulkTypeChange(e.target.value as ImportCandidate["type"]);
                            e.target.value = "";
                          }
                        }}
                        className="text-[11px] font-mono px-2 py-1 rounded-lg border border-border-subtle bg-white font-medium capitalize cursor-pointer focus:outline-none"
                      >
                        <option value="">Choose type...</option>
                        <option value="article">article</option>
                        <option value="video">video</option>
                        <option value="course">course</option>
                        <option value="repository">repository</option>
                        <option value="other">other</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Candidates List with Pagination */}
              <div className="overflow-y-auto flex-1 space-y-2 pr-1 min-h-[220px]">
                {paginatedCandidates.length === 0 ? (
                  <div className="text-center py-10 text-xs text-charcoal-muted">
                    No candidates match the filter or search query.
                  </div>
                ) : (
                  paginatedCandidates.map((c) => {
                    const isSelected = selectedIds.has(c.id);
                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border transition-all flex items-start space-x-3 ${
                          isSelected
                            ? "bg-white border-charcoal/30 shadow-sm"
                            : "bg-card-muted/30 border-border-subtle opacity-70"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(c.id)}
                          aria-label={`Select candidate ${c.title}`}
                          className="mt-1 h-4 w-4 rounded border-border-light text-charcoal focus:ring-charcoal accent-charcoal cursor-pointer"
                        />

                        <div className="flex-1 min-w-0 space-y-1">
                          <input
                            type="text"
                            value={c.title}
                            onChange={(e) => updateCandidate(c.id, "title", e.target.value)}
                            aria-label={`Edit title for ${c.title}`}
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
                          onChange={(e) => updateCandidate(c.id, "type", e.target.value)}
                          aria-label={`Edit type for ${c.title}`}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border border-border-subtle font-medium capitalize cursor-pointer focus:outline-none ${getTypeBadgeClass(
                            c.type
                          )}`}
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-charcoal-muted border-t border-border-light/60 pt-2 shrink-0">
                  <span>
                    Showing {Math.min(filteredCandidates.length, (currentPage - 1) * CANDIDATES_PER_PAGE + 1)}–
                    {Math.min(filteredCandidates.length, currentPage * CANDIDATES_PER_PAGE)} of {filteredCandidates.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      aria-label="Previous page"
                      className="p-1 rounded hover:bg-card-muted disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-[11px]">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      aria-label="Next page"
                      className="p-1 rounded hover:bg-card-muted disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-border-light pt-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setStep("ingest")}
                  className="inline-flex min-h-10 items-center self-start rounded-full px-3 py-2 text-xs font-medium text-charcoal-muted transition-colors hover:bg-card-muted hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
                >
                  ← Back to Ingest
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={selectedIds.size === 0 || confirming}
                  className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-full bg-charcoal px-6 py-2.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-black active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming with Overrides...</span>
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
            <div className="py-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif italic text-2xl text-charcoal">
                Import Successful
              </h3>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
                Successfully recorded {confirmedCount} study activities and applied your customized edits.
              </p>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-charcoal px-6 py-2.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-black active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2"
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

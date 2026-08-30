"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, HelpCircle } from "lucide-react";

type GuideBrowser = "chrome" | "firefox" | "json";

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

export default function ImportGuide() {
  const [open, setOpen] = useState(false);
  const [browser, setBrowser] = useState<GuideBrowser>("chrome");
  const [copied, setCopied] = useState(false);

  const copySample = async () => {
    await navigator.clipboard.writeText(sampleJsonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border-light bg-card-muted/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full px-4 py-2.5 text-xs font-medium text-charcoal flex items-center justify-between hover:bg-card-muted/60 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-charcoal-muted" />
          <span>How to export browser history into a JSON file</span>
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-charcoal-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-charcoal-muted" />
        )}
      </button>

      {open && (
        <div className="p-4 border-t border-border-light space-y-3 bg-white">
          <div className="flex space-x-2 border-b border-border-subtle pb-2">
            {(["chrome", "firefox", "json"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBrowser(option)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors ${
                  browser === option
                    ? "bg-charcoal text-white"
                    : "bg-card-muted text-charcoal-muted hover:text-charcoal"
                }`}
              >
                {option === "json" ? "Custom JSON Format" : option}
              </button>
            ))}
          </div>

          {browser === "chrome" && (
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

          {browser === "firefox" && (
            <ol className="text-xs text-charcoal-muted space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                Open Firefox Library with{" "}
                <kbd className="bg-card-muted text-charcoal px-1 py-0.5 rounded font-mono text-[10px]">Cmd + Shift + O</kbd> on Mac or{" "}
                <kbd className="bg-card-muted text-charcoal px-1 py-0.5 rounded font-mono text-[10px]">Ctrl + Shift + O</kbd> on Windows.
              </li>
              <li>Click <strong className="text-charcoal font-medium">Import and Backup</strong>.</li>
              <li>Choose <strong className="text-charcoal font-medium">Backup...</strong> and save the generated JSON file.</li>
              <li>Upload the exported JSON file in the dropzone above.</li>
            </ol>
          )}

          {browser === "json" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-charcoal-muted">Required JSON array structure:</span>
                <button
                  type="button"
                  onClick={copySample}
                  className="text-[11px] text-charcoal-muted hover:text-charcoal inline-flex items-center gap-1 font-medium"
                >
                  {copied ? (
                    <><Check className="w-3 h-3 text-emerald-600" /><span className="text-emerald-600">Copied!</span></>
                  ) : (
                    <><Copy className="w-3 h-3" /><span>Copy Format</span></>
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
  );
}

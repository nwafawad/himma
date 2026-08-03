"use client";

import { useState } from "react";
import { Check, GitBranch, BookOpen, FileText, Play, Download, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [targetPath, setTargetPath] = useState("Staff Systems Architect");
  const [skills, setSkills] = useState("Go, Distributed Systems, Kafka, Rust, PostgreSQL");
  const [interests, setInterests] = useState("High-throughput microservices, Consensus algorithms, Event Sourcing");

  const [integrations, setIntegrations] = useState({
    github: true,
    coursera: true,
    notion: false,
    youtube: true,
  });

  const toggleIntegration = (key: keyof typeof integrations) => {
    setIntegrations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-10 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-border-light pb-4">
        <h1 className="font-serif italic text-4xl sm:text-5xl text-charcoal">
          Settings & Preferences
        </h1>
        <p className="text-sm text-charcoal-muted mt-1">
          Configure your career trajectory goals, sync integrations, and manage data.
        </p>
      </div>

      {/* Section 1: Skills & Goals */}
      <div className="bg-card border border-border-light rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-border-light pb-3">
          <h2 className="font-serif italic text-2xl text-charcoal">
            Skills & Target Trajectory
          </h2>
          <p className="text-xs text-charcoal-muted mt-0.5">
            The AI synthesis engine uses these goals to evaluate whether your study logs remain on track.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal mb-1">
              Target Career Path / Role
            </label>
            <input
              type="text"
              value={targetPath}
              onChange={(e) => setTargetPath(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal focus:outline-none focus:border-charcoal transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal mb-1">
              Current Core Skills (Comma Separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal focus:outline-none focus:border-charcoal transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal mb-1">
              Learning Focus & Technical Interests
            </label>
            <textarea
              rows={3}
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal focus:outline-none focus:border-charcoal transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button className="rounded-full bg-charcoal hover:bg-black text-white px-5 py-2 text-xs font-medium transition-all shadow active:scale-95">
              Save Goal Settings
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Integrations & Connections */}
      <div className="bg-card border border-border-light rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-border-light pb-3">
          <h2 className="font-serif italic text-2xl text-charcoal">
            Connected Integration Sources
          </h2>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Automatically pull background learning activity and commit logs into your timeline.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* GitHub */}
          <div className="p-4 rounded-xl border border-border-light bg-card-muted/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-charcoal text-white">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-charcoal">GitHub</h4>
                <p className="text-xs text-charcoal-muted">Commits & Starred Repos</p>
              </div>
            </div>
            <button
              onClick={() => toggleIntegration("github")}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                integrations.github
                  ? "bg-badge-trackBg text-badge-trackText border border-indigo-200"
                  : "bg-card-muted text-charcoal-muted border border-border-light"
              }`}
            >
              {integrations.github ? "Connected" : "Connect"}
            </button>
          </div>

          {/* Coursera / Udemy */}
          <div className="p-4 rounded-xl border border-border-light bg-card-muted/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-charcoal">Coursera & Udemy</h4>
                <p className="text-xs text-charcoal-muted">Course Completion Logs</p>
              </div>
            </div>
            <button
              onClick={() => toggleIntegration("coursera")}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                integrations.coursera
                  ? "bg-badge-trackBg text-badge-trackText border border-indigo-200"
                  : "bg-card-muted text-charcoal-muted border border-border-light"
              }`}
            >
              {integrations.coursera ? "Connected" : "Connect"}
            </button>
          </div>

          {/* Notion */}
          <div className="p-4 rounded-xl border border-border-light bg-card-muted/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emerald-600 text-white">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-charcoal">Notion Workspace</h4>
                <p className="text-xs text-charcoal-muted">Study Notes & Reading Lists</p>
              </div>
            </div>
            <button
              onClick={() => toggleIntegration("notion")}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                integrations.notion
                  ? "bg-badge-trackBg text-badge-trackText border border-indigo-200"
                  : "bg-card-muted text-charcoal-muted border border-border-light"
              }`}
            >
              {integrations.notion ? "Connected" : "Connect"}
            </button>
          </div>

          {/* YouTube */}
          <div className="p-4 rounded-xl border border-border-light bg-card-muted/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-red-600 text-white">
                <Play className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-charcoal">YouTube Learning</h4>
                <p className="text-xs text-charcoal-muted">Tech Keynotes & Tutorials</p>
              </div>
            </div>
            <button
              onClick={() => toggleIntegration("youtube")}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                integrations.youtube
                  ? "bg-badge-trackBg text-badge-trackText border border-indigo-200"
                  : "bg-card-muted text-charcoal-muted border border-border-light"
              }`}
            >
              {integrations.youtube ? "Connected" : "Connect"}
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Account & Data Control */}
      <div className="bg-card border border-border-light rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-border-light pb-3">
          <h2 className="font-serif italic text-2xl text-charcoal">
            Account & Data Export
          </h2>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Export your complete study journal trajectory or manage account privacy settings.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border-light bg-white hover:bg-card-muted text-charcoal px-5 py-2 text-xs font-medium transition-all">
            <Download className="w-4 h-4 text-charcoal-muted" />
            <span>Export Journal Data (JSON/CSV)</span>
          </button>

          <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-5 py-2 text-xs font-medium transition-all">
            <Trash2 className="w-4 h-4" />
            <span>Delete Account & Erase Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}

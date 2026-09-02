"use client";

import React from "react";

export function ActivityFeedSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading logged activities"
      className="space-y-3"
    >
      <span className="sr-only">Loading logged activities...</span>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-card border border-border-light shadow-sm animate-pulse space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-20 rounded-full bg-border-light" />
            <div className="h-3 w-3 rounded-full bg-border-subtle" />
            <div className="h-3 w-16 rounded bg-border-light" />
          </div>
          <div className="h-5 w-2/3 rounded-lg bg-border-light" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-full rounded bg-border-subtle/70" />
            <div className="h-3.5 w-4/5 rounded bg-border-subtle/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading learning timeline"
      className="space-y-8"
    >
      <span className="sr-only">Building your learning timeline...</span>
      <div className="space-y-4">
        <div className="h-4 w-24 rounded bg-border-light animate-pulse" />
        <div className="relative pl-4 sm:pl-6 border-l border-border-light space-y-4 ml-2 sm:ml-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="relative p-4 sm:p-5 rounded-2xl bg-card border border-border-light shadow-sm animate-pulse space-y-3"
            >
              <span className="absolute -left-[21px] sm:-left-[31px] top-6 w-2.5 h-2.5 rounded-full bg-border-light border-2 border-white" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-16 rounded bg-border-light" />
                  <div className="h-3.5 w-14 rounded bg-border-subtle" />
                </div>
                <div className="h-3 w-12 rounded bg-border-subtle" />
              </div>
              <div className="h-5 w-3/5 rounded bg-border-light" />
              <div className="h-3.5 w-5/6 rounded bg-border-subtle/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AISynthesisSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading AI synthesis"
      className="w-full bg-[#181820] text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-slate-800 animate-pulse space-y-6"
    >
      <span className="sr-only">Loading AI career insights...</span>
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-48 rounded bg-slate-700/80" />
        <div className="h-6 w-24 rounded-full bg-slate-700/60" />
      </div>
      <div className="space-y-2 py-2">
        <div className="h-4 w-full rounded bg-slate-700/60" />
        <div className="h-4 w-5/6 rounded bg-slate-700/60" />
        <div className="h-4 w-3/4 rounded bg-slate-700/60" />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <div className="h-6 w-20 rounded-md bg-indigo-500/20" />
        <div className="h-6 w-24 rounded-md bg-indigo-500/20" />
        <div className="h-6 w-16 rounded-md bg-slate-800" />
      </div>
    </div>
  );
}

"use client";

import * as HoverCard from "@radix-ui/react-hover-card";
import { Book, ArrowRight } from "lucide-react";

interface CitationProps {
  keyword: string;
  title: string;
  type: string;
  date: string;
  snippet: string;
  url?: string;
}

export default function CitationHoverCard({
  keyword,
  title,
  type,
  date,
  snippet,
  url,
}: CitationProps) {
  return (
    <HoverCard.Root openDelay={120} closeDelay={180}>
      <HoverCard.Trigger asChild>
        <button
          type="button"
          aria-label={`View citation details for ${keyword}`}
          className="inline-block text-[#A5B4FC] underline decoration-indigo-400/50 underline-offset-4 hover:decoration-indigo-300 hover:text-white cursor-pointer font-medium transition-colors px-1.5 py-0.5 rounded bg-[#2D2B55]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 text-xs"
        >
          {keyword}
        </button>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          className="w-[min(20rem,calc(100vw-2rem))] bg-card p-4 rounded-xl shadow-2xl border border-border-light z-50 animate-fade-in focus:outline-none"
          sideOffset={6}
        >
          <div className="flex items-center justify-between text-[10px] text-charcoal-muted uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1 font-semibold text-indigo-600">
              <Book className="w-3 h-3" />
              {type}
            </span>
            <span>{date}</span>
          </div>
          <h4 className="font-serif italic text-base text-charcoal leading-snug mb-1.5">
            {title}
          </h4>
          <p className="text-xs text-charcoal-muted leading-relaxed line-clamp-2">
            "{snippet}"
          </p>
          <div className="mt-3 pt-2 border-t border-border-subtle flex justify-end">
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="min-h-8 text-xs font-medium text-charcoal flex items-center gap-1 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal rounded-md"
              >
                View Resource <ArrowRight className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-[11px] font-medium text-charcoal-muted flex items-center gap-1">
                Activity Verified
              </span>
            )}
          </div>
          <HoverCard.Arrow className="fill-white" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}

import { Book, Code, Sparkles, ExternalLink } from "lucide-react";

export interface ActivityItem {
  id: string;
  title: string;
  summary: string;
  category: "ENGINEERING" | "SYSTEMS" | "PRODUCT";
  type: string;
  time: string;
  link?: string;
}

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    title: "Designing Event-Driven Microservices with Kafka & Go",
    summary: "Reviewed distributed log partitions, consumer offset commits, and idempotency guarantees in high-concurrency event pipelines.",
    category: "ENGINEERING",
    type: "Course Chapter",
    time: "2:45 PM",
    link: "https://github.com",
  },
  {
    id: "2",
    title: "The Product Mindset in Systems Engineering",
    summary: "Annotated key chapters on bridging technical architectural decisions with user-facing latency requirements.",
    category: "PRODUCT",
    type: "Article Note",
    time: "11:15 AM",
  },
  {
    id: "3",
    title: "Rust Memory Management & Concurrency Primitives",
    summary: "Implemented custom mutex implementations and explored memory safety guarantees without garbage collection overhead.",
    category: "SYSTEMS",
    type: "Repository Lab",
    time: "09:30 AM",
    link: "https://github.com",
  },
];

export default function ActivityFeed() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif italic text-2xl text-charcoal">
          Today's Logged Activity
        </h3>
        <span className="text-xs text-charcoal-muted uppercase tracking-wider font-medium">
          3 ENTRIES TODAY
        </span>
      </div>

      <div className="space-y-3">
        {SAMPLE_ACTIVITIES.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-card border border-border-light hover:border-charcoal/20 transition-all shadow-sm hover:shadow group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-badge-driftBg text-badge-driftText">
                    {item.category}
                  </span>
                  <span className="text-charcoal-muted">•</span>
                  <span className="text-charcoal-muted font-mono">{item.time}</span>
                  <span className="text-charcoal-muted">•</span>
                  <span className="text-charcoal-muted">{item.type}</span>
                </div>
                <h4 className="font-serif italic text-lg text-charcoal group-hover:text-black transition-colors flex items-center gap-1.5">
                  {item.title}
                  {item.link && (
                    <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity text-charcoal-muted inline" />
                  )}
                </h4>
                <p className="text-sm text-charcoal-muted leading-relaxed">
                  {item.summary}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

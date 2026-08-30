import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Download,
  FileText,
  GitBranch,
  Play,
  UserRound,
} from "lucide-react";

const INTEGRATIONS = [
  {
    name: "GitHub",
    description: "Commits and starred repositories",
    icon: GitBranch,
    iconClassName: "bg-charcoal text-white",
  },
  {
    name: "Coursera & Udemy",
    description: "Course completion history",
    icon: BookOpen,
    iconClassName: "bg-blue-600 text-white",
  },
  {
    name: "Notion Workspace",
    description: "Study notes and reading lists",
    icon: FileText,
    iconClassName: "bg-emerald-600 text-white",
  },
  {
    name: "YouTube Learning",
    description: "Technical talks and tutorials",
    icon: Play,
    iconClassName: "bg-red-600 text-white",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-10 pb-16 max-w-4xl mx-auto">
      <div className="border-b border-border-light pb-4">
        <h1 className="font-serif italic text-4xl sm:text-5xl text-charcoal">
          Settings & Preferences
        </h1>
        <p className="text-sm text-charcoal-muted mt-1">
          Manage your learning profile and review upcoming integrations.
        </p>
      </div>

      <section className="bg-card border border-border-light rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-card-muted text-charcoal flex items-center justify-center shrink-0">
              <UserRound className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif italic text-2xl text-charcoal">
                Profile & learning direction
              </h2>
              <p className="text-sm text-charcoal-muted mt-1 max-w-xl leading-relaxed">
                Your name, career target, skills, interests, avatar, and data export now live together on your profile.
              </p>
            </div>
          </div>
          <Link
            href="/profile"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-charcoal hover:bg-black text-white px-5 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 shrink-0"
          >
            Open profile
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="bg-card border border-border-light rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-border-light pb-3">
          <h2 className="font-serif italic text-2xl text-charcoal">
            Learning integrations
          </h2>
          <p className="text-sm text-charcoal-muted mt-1">
            These connectors are planned but are not available in this build yet.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {INTEGRATIONS.map((integration) => {
            const Icon = integration.icon;
            return (
              <div
                key={integration.name}
                className="p-4 rounded-xl border border-border-light bg-card-muted/30 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${integration.iconClassName}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-charcoal truncate">
                      {integration.name}
                    </h3>
                    <p className="text-sm text-charcoal-muted leading-snug">
                      {integration.description}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-border-light bg-card px-2.5 py-1 text-xs font-medium text-charcoal-muted shrink-0">
                  <Clock3 className="w-3 h-3" aria-hidden="true" />
                  Planned
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-card border border-border-light rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif italic text-2xl text-charcoal">
              Data export
            </h2>
            <p className="text-sm text-charcoal-muted mt-1">
              Download your journal data from the profile page.
            </p>
          </div>
          <Link
            href="/profile"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border-light bg-white hover:bg-card-muted text-charcoal px-5 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2"
          >
            <Download className="w-4 h-4 text-charcoal-muted" aria-hidden="true" />
            Go to data export
          </Link>
        </div>
      </section>
    </div>
  );
}

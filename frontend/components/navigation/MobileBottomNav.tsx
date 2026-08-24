"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, Sparkles, Plus } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Timeline", href: "/timeline", icon: Clock },
  { label: "Insights", href: "/insights", icon: Sparkles },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  const handleOpenCapture = () => {
    window.dispatchEvent(new CustomEvent("open-quick-capture"));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-canvas/95 backdrop-blur-lg border-t border-border-light sm:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors ${
                isActive
                  ? "text-charcoal font-semibold"
                  : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? "bg-card-muted text-charcoal shadow-sm" : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* Quick Capture Floating Action Trigger in Mobile Bottom Nav */}
        <button
          type="button"
          aria-label="Log a learning activity"
          onClick={handleOpenCapture}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 active:scale-95 transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-charcoal text-white flex items-center justify-center shadow-md">
            <Plus className="w-5 h-5" />
          </div>
          <span className="mt-0.5 text-charcoal font-semibold">Log</span>
        </button>
      </div>
    </nav>
  );
}

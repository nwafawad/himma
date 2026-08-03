"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pen } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Timeline", href: "/timeline" },
  { label: "Insights", href: "/insights" },
  { label: "Settings", href: "/settings" },
];

export default function Header() {
  const pathname = usePathname();

  const handleOpenCapture = () => {
    window.dispatchEvent(new CustomEvent("open-quick-capture"));
  };

  return (
    <header className="w-full border-b border-[#E5E7EB] bg-canvas/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="font-serif italic text-2xl font-normal text-charcoal hover:opacity-80 transition-opacity">
          Momentum
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-6 text-sm">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors relative py-1 ${
                  isActive
                    ? "font-semibold text-charcoal"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-charcoal rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Button */}
        <button
          onClick={handleOpenCapture}
          className="inline-flex items-center gap-1.5 rounded-full bg-charcoal hover:bg-black text-white px-5 py-1.5 text-sm font-medium transition-all shadow-sm hover:shadow active:scale-95"
        >
          <Pen className="w-3.5 h-3.5" />
          <span>Log</span>
        </button>
      </div>
    </header>
  );
}

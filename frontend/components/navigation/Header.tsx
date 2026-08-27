"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import UserMenu from "./UserMenu";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Timeline", href: "/timeline" },
  { label: "Insights", href: "/insights" },
];

interface HeaderProps {
  showAppNavigation?: boolean;
}

export default function Header({ showAppNavigation = false }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-[#E5E7EB] bg-canvas/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <Link href="/" className="font-serif italic text-2xl font-normal text-charcoal hover:opacity-80 transition-opacity shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 rounded-md">
          Momentum
        </Link>

        {/* Desktop Navigation Links with Shared Layout Animated Active Pill */}
        {showAppNavigation && <nav aria-label="Primary navigation" className="hidden sm:flex items-center space-x-1 sm:space-x-2 text-sm bg-card-muted/60 p-1 rounded-full border border-border-subtle">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative px-3.5 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal ${
                  isActive
                    ? "text-charcoal"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeNavPill"
                    className="absolute inset-0 bg-white rounded-full shadow-sm border border-border-light z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>}

        {/* User Profile Menu / Sign In */}
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

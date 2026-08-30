"use client";

import { MotionConfig } from "framer-motion";
import Header from "@/components/navigation/Header";
import PageTransition from "@/components/ui/PageTransition";

interface PublicShellProps {
  children: React.ReactNode;
}

export default function PublicShell({ children }: PublicShellProps) {
  return (
    <MotionConfig reducedMotion="user">
      <Header showAppNavigation={false} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-8">
        <PageTransition>{children}</PageTransition>
      </main>
    </MotionConfig>
  );
}

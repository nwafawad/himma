"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MotionConfig } from "framer-motion";
import Header from "@/components/navigation/Header";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import InstallPromptBanner from "@/components/pwa/InstallPromptBanner";
import FloatingLogButton from "@/components/ui/FloatingLogButton";
import ImportModal from "@/components/ui/ImportModal";
import PageTransition from "@/components/ui/PageTransition";
import QuickCaptureModal from "@/components/ui/QuickCaptureModal";
import { authClient, type AuthUser } from "@/lib/authClient";

const PUBLIC_ROUTES = new Set(["/", "/login", "/auth/callback", "/offline"]);

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const isProtectedRoute = useMemo(
    () => !PUBLIC_ROUTES.has(pathname),
    [pathname],
  );

  useEffect(() => {
    setUser(authClient.getUser());
    setAuthReady(true);

    const listener = authClient.onAuthStateChange((updatedUser) => {
      setUser(updatedUser);
      setAuthReady(true);
    });

    return () => listener.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !isProtectedRoute || user) return;

    const requestedPath = `${pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(requestedPath)}`);
  }, [authReady, isProtectedRoute, pathname, router, user]);

  const showAuthenticatedShell = isProtectedRoute && Boolean(user);
  const isResolvingProtectedRoute = isProtectedRoute && (!authReady || !user);

  return (
    <MotionConfig reducedMotion="user">
      <Header showAppNavigation={showAuthenticatedShell} />
      <main
        className={`flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${
          showAuthenticatedShell ? "pb-24 sm:pb-8" : "pb-8"
        }`}
      >
        {isResolvingProtectedRoute ? (
          <div
            className="min-h-[60vh] flex items-center justify-center gap-2 text-sm text-charcoal-muted"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Opening your journal…</span>
          </div>
        ) : (
          <PageTransition>{children}</PageTransition>
        )}
      </main>

      {showAuthenticatedShell && (
        <>
          <QuickCaptureModal />
          <ImportModal />
          <FloatingLogButton />
          <InstallPromptBanner />
          <MobileBottomNav />
        </>
      )}
    </MotionConfig>
  );
}

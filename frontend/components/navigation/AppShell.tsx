"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MotionConfig } from "framer-motion";
import Header from "@/components/navigation/Header";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import InstallPromptBanner from "@/components/pwa/InstallPromptBanner";
import FloatingLogButton from "@/features/activities/components/FloatingLogButton";
import ImportModal from "@/features/import/components/ImportModal";
import PageTransition from "@/components/ui/PageTransition";
import QuickCaptureModal from "@/features/activities/components/QuickCaptureModal";
import { authClient, type AuthUser } from "@/lib/authClient";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { useOfflineSync } from "@/hooks/useOfflineSync";

interface AppShellProps {
  children: React.ReactNode;
}

function OfflineSyncHandler({ userId }: { userId: string | null }) {
  const { syncDrafts } = useOfflineSync(userId);
  const toast = useToast();

  useEffect(() => {
    const handleSyncEvent = (e: Event) => {
      const custom = e as CustomEvent<{ count: number }>;
      const count = custom.detail?.count || 1;
      toast.success(
        "Offline Sync Completed",
        `Uploaded ${count} pending learning log${count === 1 ? "" : "s"} to your account.`
      );
    };

    window.addEventListener("offline-sync-completed", handleSyncEvent);
    return () => {
      window.removeEventListener("offline-sync-completed", handleSyncEvent);
    };
  }, [toast]);

  return null;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

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
    if (!authReady || user) return;

    const requestedPath = `${pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(requestedPath)}`);
  }, [authReady, pathname, router, user]);

  const showAuthenticatedShell = Boolean(user);
  const isResolvingProtectedRoute = !authReady || !user;

  return (
    <ToastProvider>
      <MotionConfig reducedMotion="user">
        <Header showAppNavigation={showAuthenticatedShell} />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 sm:pb-8">
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
            <OfflineSyncHandler userId={user?.id || null} />
            <QuickCaptureModal />
            <ImportModal />
            <FloatingLogButton />
            <InstallPromptBanner />
            <MobileBottomNav />
          </>
        )}
      </MotionConfig>
    </ToastProvider>
  );
}

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const COOLDOWN_KEY = "momentum_pwa_cooldown";
const COOLDOWN_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  const isCoolingDown = useCallback(() => {
    try {
      const cooldownUntil = localStorage.getItem(COOLDOWN_KEY);
      if (!cooldownUntil) return false;
      return Date.now() < Number(cooldownUntil);
    } catch {
      return false;
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      localStorage.setItem(COOLDOWN_KEY, String(Date.now() + COOLDOWN_DURATION_MS));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // Check if running in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIphoneOrIpad = /iphone|ipad|ipod/.test(userAgent);
    if (isIphoneOrIpad) {
      setIsIOS(true);
      if (!isCoolingDown()) {
        setShowBanner(true);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (!isCoolingDown()) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    const handleManualTrigger = () => {
      if (deferredPrompt) {
        handleInstallClick();
      } else {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("trigger-pwa-install", handleManualTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("trigger-pwa-install", handleManualTrigger);
    };
  }, [isCoolingDown, deferredPrompt]);

  if (!showBanner || installed) return null;

  return (
    <div className="fixed top-16 sm:top-auto sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-30 animate-fade-in">
      <div className="bg-card border border-border-light p-3.5 rounded-2xl shadow-xl text-charcoal flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-card-muted text-charcoal flex items-center justify-center shrink-0 border border-border-subtle">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-xs text-charcoal leading-tight truncate">
              Install Momentum App
            </h4>
            <p className="text-[11px] text-charcoal-muted leading-tight truncate">
              {isIOS
                ? "Tap Share -> 'Add to Home Screen'"
                : "Add to home screen for offline access"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="inline-flex min-h-8 items-center justify-center gap-1 rounded-full bg-charcoal px-3 py-1 text-[11px] font-medium text-white shadow-sm transition-all hover:bg-black active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
            >
              <Download className="w-3 h-3" />
              <span>Install</span>
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-charcoal-muted hover:text-charcoal hover:bg-card-muted transition"
            aria-label="Close install banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

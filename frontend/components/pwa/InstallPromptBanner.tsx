"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Smartphone, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIphoneOrIpad = /iphone|ipad|ipod/.test(userAgent);
    if (isIphoneOrIpad) {
      setIsIOS(true);
      const dismissed = localStorage.getItem("momentum_pwa_banner_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      const dismissed = localStorage.getItem("momentum_pwa_banner_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
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
    localStorage.setItem("momentum_pwa_banner_dismissed", "true");
  };

  if (!showBanner || installed) return null;

  return (
    <div className="fixed bottom-5 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-indigo-500/30 p-4 rounded-2xl shadow-2xl shadow-indigo-950/50 text-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 flex-shrink-0 shadow-md">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-indigo-400">
              <Smartphone className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-zinc-100 flex items-center gap-1.5">
              Install Momentum App
            </h4>
            <p className="text-xs text-zinc-400">
              {isIOS
                ? "Tap Share -> 'Add to Home Screen' for offline access"
                : "Add to your home screen for quick offline access"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            aria-label="Close install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, description, durationMs = 4000 }: Omit<ToastItem, "id">) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newToast: ToastItem = { id, type, title, description, durationMs };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // max 5 concurrent

      if (durationMs > 0) {
        window.setTimeout(() => {
          removeToast(id);
        }, durationMs);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => showToast({ type: "success", title, description }),
    [showToast]
  );

  const error = useCallback(
    (title: string, description?: string) => showToast({ type: "error", title, description, durationMs: 5000 }),
    [showToast]
  );

  const info = useCallback(
    (title: string, description?: string) => showToast({ type: "info", title, description }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {/* Toast viewport */}
      <div
        role="region"
        aria-label="Notifications"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              role="status"
              aria-live="polite"
              className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border-light shadow-xl text-charcoal backdrop-blur-md"
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === "success" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                {toast.type === "error" && (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                {toast.type === "info" && (
                  <Info className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-charcoal leading-tight">
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="text-[11px] text-charcoal-muted mt-0.5 leading-normal">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 p-1 text-charcoal-muted hover:text-charcoal rounded-lg hover:bg-card-muted transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return context;
}

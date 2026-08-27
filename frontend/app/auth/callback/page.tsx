"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/authClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const user = authClient.getUser();
    if (user) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-sm bg-card border border-border-light rounded-2xl p-8 shadow-xl text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-charcoal mx-auto" />
        <h2 className="font-serif italic text-2xl text-charcoal">Redirecting...</h2>
        <p className="text-xs text-charcoal-muted">
          Establishing your workspace session.
        </p>
      </div>
    </div>
  );
}

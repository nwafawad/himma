"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { fetchApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session) {
          localStorage.setItem("momentum_token", data.session.access_token);

          // Check if DB profile avatar exists before syncing Google picture
          try {
            const profileRes = await fetchApi<{ data?: { avatarUrl?: string } }>("/profile");
            const googleAvatar = data.session.user.user_metadata?.avatar_url || data.session.user.user_metadata?.picture;
            
            // Only populate Google avatar if DB avatarUrl is currently empty
            if (!profileRes?.data?.avatarUrl && googleAvatar) {
              await fetchApi("/profile", {
                method: "PUT",
                body: JSON.stringify({ avatarUrl: googleAvatar }),
              });
            }
          } catch (err) {
            console.warn("Avatar sync check error:", err);
          }

          router.replace("/dashboard");
        } else {
          // Listen for auth state changes if session is establishing asynchronously
          const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
              if (session) {
                localStorage.setItem("momentum_token", session.access_token);
                router.replace("/dashboard");
              }
            }
          );

          return () => {
            authListener.subscription.unsubscribe();
          };
        }
      } catch (err: any) {
        console.error("Error processing OAuth callback:", err.message);
        setErrorMsg(err.message || "Failed to complete Google Sign In.");
        setTimeout(() => {
          router.replace("/login");
        }, 2500);
      }
    }

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-sm bg-card border border-border-light rounded-2xl p-8 shadow-xl text-center space-y-4">
        {errorMsg ? (
          <>
            <div className="text-red-500 font-medium text-sm">{errorMsg}</div>
            <p className="text-xs text-charcoal-muted">Redirecting back to login...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-charcoal mx-auto" />
            <h2 className="font-serif italic text-2xl text-charcoal">Completing Sign In...</h2>
            <p className="text-xs text-charcoal-muted">
              Authenticating with Google and establishing secure session.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

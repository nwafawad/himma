"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fetchApi } from "@/lib/api";

export default function UserMenu() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserEmail(session.user.email || "");
          setUserName(
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "Scholar"
          );

          // Fetch database profile avatar first to ensure custom uploads take priority
          const profileRes = await fetchApi<{ data?: { avatarUrl?: string } }>("/profile").catch(() => null);
          const dbAvatar = profileRes?.data?.avatarUrl;
          const oauthAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;

          setUserAvatar(dbAvatar || oauthAvatar || null);
        } else {
          // Check local token fallback if mock authentication is present
          const localToken = typeof window !== "undefined" ? localStorage.getItem("momentum_token") : null;
          if (localToken) {
            setUserEmail("scholar@momentum.app");
            setUserName("Scholar");
          }
        }
      } catch (err) {
        console.warn("Session retrieval warning:", err);
      } finally {
        setLoading(false);
      }
    }

    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          if (session.access_token) {
            localStorage.setItem("momentum_token", session.access_token);
          }
          setUserEmail(session.user.email || "");
          setUserName(
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "Scholar"
          );
          setUserAvatar(session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null);
        } else if (!localStorage.getItem("momentum_token")) {
          setUserEmail("");
          setUserName("");
          setUserAvatar(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Sign out warning:", err);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("momentum_token");
      }
      setUserEmail("");
      setUserName("");
      setUserAvatar(null);
      router.push("/login");
    }
  };

  // If no user is logged in, show the Sign In button
  if (!loading && !userEmail && typeof window !== "undefined" && !localStorage.getItem("momentum_token")) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-charcoal-muted hover:text-charcoal transition-colors"
      >
        Sign In
      </Link>
    );
  }

  const initials = (userName || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 p-1 rounded-full hover:bg-card-muted transition-colors focus:outline-none group border border-transparent hover:border-border-light"
          aria-label="User profile menu"
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform border border-border-light"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-charcoal text-white text-xs font-semibold flex items-center justify-center tracking-wider shadow-sm group-hover:scale-105 transition-transform">
              {initials}
            </div>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-charcoal-muted group-hover:text-charcoal transition-colors hidden sm:block" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="w-56 bg-card border border-border-light rounded-2xl p-2 shadow-xl z-50 animate-fade-in focus:outline-none"
        >
          {/* User Email & Name Summary Header */}
          <div className="px-3 py-2.5 border-b border-border-light mb-1">
            <p className="text-xs font-semibold text-charcoal truncate">{userName || "Scholar"}</p>
            <p className="text-[11px] text-charcoal-muted truncate font-mono">{userEmail || "user@momentum.app"}</p>
          </div>

          <div className="space-y-0.5 text-xs">
            {/* Go to Profile */}
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-charcoal hover:bg-card-muted transition-colors font-medium"
            >
              <User className="w-4 h-4 text-charcoal-muted" />
              <span>Profile</span>
            </Link>

            {/* Go to Settings */}
            <Link
              href="/settings"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-charcoal hover:bg-card-muted transition-colors font-medium"
            >
              <Settings className="w-4 h-4 text-charcoal-muted" />
              <span>Settings</span>
            </Link>

            <div className="border-t border-border-light my-1" />

            {/* Logout */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

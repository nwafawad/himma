"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { authClient, AuthUser } from "@/lib/authClient";
import { getProfile } from "@/features/profile/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api(?:\/v1)?\/?$/, "");

export default function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initUserSession() {
      try {
        const currentUser = authClient.getUser();
        setUser(currentUser);

        if (currentUser) {
          // Fetch database profile avatar
          const profileRes = await getProfile().catch(() => null);
          const dbAvatar = profileRes?.data?.avatarUrl;
          if (dbAvatar) {
            const resolvedAvatar = dbAvatar.startsWith("/uploads")
              ? `${BACKEND_BASE_URL}${dbAvatar}`
              : dbAvatar;
            setUserAvatar(resolvedAvatar);
          }
        }
      } catch (err) {
        console.warn("Session retrieval warning:", err);
      } finally {
        setLoading(false);
      }
    }

    initUserSession();

    const listener = authClient.onAuthStateChange((updatedUser) => {
      setUser(updatedUser);
      if (!updatedUser) {
        setUserAvatar(null);
      }
    });

    return () => {
      listener.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.warn("Sign out warning:", err);
    } finally {
      setUser(null);
      setUserAvatar(null);
      router.push("/login");
    }
  };

  // If no user is logged in, show the Sign In button
  if (!loading && !user) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-charcoal-muted hover:text-charcoal transition-colors"
      >
        Sign In
      </Link>
    );
  }

  const userName = user?.name || user?.email?.split("@")[0] || "Scholar";
  const userEmail = user?.email || "";

  const initials = userName
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
            <p className="text-xs font-semibold text-charcoal truncate">{userName}</p>
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

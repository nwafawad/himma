"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Mail, Lock, User as UserIcon, AlertCircle } from "lucide-react";
import { authClient } from "@/lib/authClient";
import { getErrorMessage } from "@/lib/errors";

export default function AuthCard() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsSignUp(params.get("mode") === "signup");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        await authClient.signUp({
          name: name.trim(),
          email: email.trim(),
          password,
        });
      } else {
        await authClient.signIn({
          email: email.trim(),
          password,
        });
      }

      const params = new URLSearchParams(window.location.search);
      const nextPath = params.get("next");
      const safeNextPath =
        nextPath?.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/dashboard";
      router.push(safeNextPath);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "Authentication failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card border border-border-light rounded-2xl p-8 shadow-xl space-y-6">
      {/* Brand & Subtitle */}
      <div className="text-center space-y-2">
        <h2 className="font-serif italic text-3xl text-charcoal">
          {isSignUp ? "Begin your journey" : "Welcome back"}
        </h2>
        <p className="text-xs text-charcoal-muted font-sans">
          {isSignUp
            ? "Create a local account to start quietly logging your study trajectory."
            : "Sign in to access your dashboard and AI career insights."}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex p-1 bg-card-muted rounded-xl text-xs font-medium" role="group" aria-label="Authentication mode">
        <button
          type="button"
          aria-pressed={!isSignUp}
          onClick={() => {
            setIsSignUp(false);
            setErrorMsg(null);
          }}
          className={`flex-1 min-h-11 py-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal ${
            !isSignUp
              ? "bg-white text-charcoal shadow-sm font-semibold"
              : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          aria-pressed={isSignUp}
          onClick={() => {
            setIsSignUp(true);
            setErrorMsg(null);
          }}
          className={`flex-1 min-h-11 py-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal ${
            isSignUp
              ? "bg-white text-charcoal shadow-sm font-semibold"
              : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Error Feedback */}
      {errorMsg && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Auth Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="auth-name" className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-1">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-3 text-charcoal-muted" />
              <input
                type="text"
                id="auth-name"
                name="name"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full min-h-11 pl-9 pr-3 py-2 text-base sm:text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-1 transition-colors"
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="auth-email" className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-charcoal-muted" />
            <input
              type="email"
              id="auth-email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full min-h-11 pl-9 pr-3 py-2 text-base sm:text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-1 transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="auth-password" className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-charcoal-muted" />
            <input
              type={showPassword ? "text" : "password"}
              id="auth-password"
              name="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full min-h-11 pl-9 pr-12 py-2 text-base sm:text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-1 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-charcoal-muted hover:text-charcoal hover:bg-card-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-full bg-charcoal hover:bg-black text-white py-2.5 text-sm font-medium transition-all shadow active:scale-95 disabled:opacity-70 disabled:pointer-events-none mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2"
        >
          <span>
            {loading
              ? "Processing..."
              : isSignUp
              ? "Create Account"
              : "Sign In"}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

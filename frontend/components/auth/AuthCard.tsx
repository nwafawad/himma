"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, GitBranch, Mail, Lock, User as UserIcon } from "lucide-react";

export default function AuthCard() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 800);
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
            ? "Create an account to start quietly logging your study trajectory."
            : "Sign in to access your dashboard and AI career insights."}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex p-1 bg-card-muted rounded-xl text-xs font-medium">
        <button
          type="button"
          onClick={() => setIsSignUp(false)}
          className={`flex-1 py-2 rounded-lg transition-all ${
            !isSignUp
              ? "bg-white text-charcoal shadow-sm font-semibold"
              : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setIsSignUp(true)}
          className={`flex-1 py-2 rounded-lg transition-all ${
            isSignUp
              ? "bg-white text-charcoal shadow-sm font-semibold"
              : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Auth Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-1">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-3 text-charcoal-muted" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full pl-9 pr-3 py-2 text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal focus:outline-none focus:border-charcoal transition-colors"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-charcoal-muted" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full pl-9 pr-3 py-2 text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal focus:outline-none focus:border-charcoal transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-charcoal-muted" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2 text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal focus:outline-none focus:border-charcoal transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-charcoal-muted hover:text-charcoal transition-colors"
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
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-charcoal hover:bg-black text-white py-2.5 text-sm font-medium transition-all shadow active:scale-95 disabled:opacity-80 mt-2"
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

      {/* Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-border-light w-full" />
        <span className="bg-card px-3 text-[10px] uppercase tracking-widest text-charcoal-muted absolute font-mono">
          OR CONTINUE WITH
        </span>
      </div>

      {/* OAuth Social Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-border-light bg-white hover:bg-card-muted text-xs font-medium text-charcoal transition-colors"
        >
          <GitBranch className="w-4 h-4" />
          <span>GitHub</span>
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-border-light bg-white hover:bg-card-muted text-xs font-medium text-charcoal transition-colors"
        >
          <span>Google</span>
        </button>
      </div>
    </div>
  );
}

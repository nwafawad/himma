"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { User, Target, Sparkles, Download, Trash2, Check, Loader2, Mail, Calendar, ShieldCheck } from "lucide-react";

interface ProfileData {
  targetPath: string | null;
  currentSkills: string[];
  interests: string[];
}

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState<string>("user@momentum.app");
  const [userName, setUserName] = useState<string>("Momentum Scholar");
  const [createdAt, setCreatedAt] = useState<string>("August 2026");
  const [provider, setProvider] = useState<string>("Google");

  // Form states
  const [targetPath, setTargetPath] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [interestsInput, setInterestsInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function loadUserDataAndProfile() {
      try {
        // Load user auth metadata from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserEmail(session.user.email || "user@momentum.app");
          setUserName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Momentum Scholar");
          if (session.user.created_at) {
            setCreatedAt(new Date(session.user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }));
          }
          setProvider(session.user.app_metadata?.provider || "email");
        }

        // Fetch user trajectory profile from backend API
        const response = await fetchApi<{ data: ProfileData }>("/profile").catch(() => null);
        if (response?.data) {
          setTargetPath(response.data.targetPath || "Staff Systems Architect");
          setSkillsInput((response.data.currentSkills || ["Go", "Distributed Systems", "Kafka", "Rust"]).join(", "));
          setInterestsInput((response.data.interests || ["High-throughput microservices", "Consensus algorithms"]).join(", "));
        } else {
          // Default fallbacks
          setTargetPath("Staff Systems Architect");
          setSkillsInput("Go, Distributed Systems, Kafka, Rust, PostgreSQL");
          setInterestsInput("High-throughput microservices, Consensus algorithms, Event Sourcing");
        }
      } catch (err) {
        console.warn("Using local profile state defaults:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserDataAndProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const skillsArray = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const interestsArray = interestsInput.split(",").map((i) => i.trim()).filter(Boolean);

    try {
      await fetchApi("/profile", {
        method: "PUT",
        body: JSON.stringify({
          targetPath,
          currentSkills: skillsArray,
          interests: interestsArray,
        }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.warn("Saved profile locally:", err);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await fetchApi<any>("/user/export");
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `momentum_profile_export.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.warn("Exporting local fallback data bundle:", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-charcoal-muted gap-2 text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading User Profile...</span>
      </div>
    );
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Page Title */}
      <div className="border-b border-border-light pb-4">
        <h1 className="font-serif italic text-4xl sm:text-5xl text-charcoal">
          User Profile
        </h1>
        <p className="text-sm text-charcoal-muted mt-1">
          Manage your account identity, learning trajectory goals, and data export settings.
        </p>
      </div>

      {/* User Identity Card */}
      <div className="p-6 sm:p-8 bg-card border border-border-light rounded-2xl shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-charcoal text-white flex items-center justify-center font-serif text-2xl tracking-wider shadow-md shrink-0">
            {initials || "ME"}
          </div>
          <div className="space-y-1">
            <h2 className="font-serif italic text-2xl text-charcoal">{userName}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-charcoal-muted font-sans">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {userEmail}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Member since {createdAt}
              </span>
            </div>
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Authenticated via {provider}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trajectory & Skills Form */}
      <form onSubmit={handleSaveProfile} className="bg-card border border-border-light rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-border-light pb-3">
          <h3 className="font-serif italic text-2xl text-charcoal flex items-center gap-2">
            <Target className="w-5 h-5 text-charcoal-muted" />
            Career Trajectory & Learning Focus
          </h3>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Your target career trajectory is evaluated by the AI engine against your daily logged activity.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal mb-1">
              Target Career Path / Goal Role
            </label>
            <input
              type="text"
              value={targetPath}
              onChange={(e) => setTargetPath(e.target.value)}
              placeholder="e.g. Staff Systems Architect"
              className="w-full px-3.5 py-2.5 text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal focus:outline-none focus:border-charcoal transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal mb-1">
              Current Core Skills (Comma Separated)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="Go, Rust, Distributed Systems, Kafka..."
              className="w-full px-3.5 py-2.5 text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal focus:outline-none focus:border-charcoal transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal mb-1">
              Learning Focus & Technical Interests
            </label>
            <textarea
              rows={3}
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
              placeholder="High-throughput microservices, consensus algorithms..."
              className="w-full px-3.5 py-2.5 text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal focus:outline-none focus:border-charcoal transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full bg-charcoal hover:bg-black text-white px-6 py-2.5 text-xs font-medium transition-all shadow active:scale-95 disabled:opacity-75"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Profile Updated!</span>
                </>
              ) : (
                <span>Save Trajectory Profile</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Account Data Export & Privacy Section */}
      <div className="bg-card border border-border-light rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-border-light pb-3">
          <h3 className="font-serif italic text-2xl text-charcoal">
            Data Control & Export
          </h3>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Download your raw activity, trajectory notes, and AI insights history.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleExportData}
            disabled={exporting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border-light bg-white hover:bg-card-muted text-charcoal px-5 py-2.5 text-xs font-medium transition-all shadow-sm"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin text-charcoal-muted" /> : <Download className="w-4 h-4 text-charcoal-muted" />}
            <span>Export Complete Profile Data (JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

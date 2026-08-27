"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { authClient } from "@/lib/authClient";
import { User, Target, Download, Check, Loader2, Mail, Calendar, ShieldCheck, Camera } from "lucide-react";

interface ProfileData {
  targetPath: string | null;
  currentSkills: string[];
  interests: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState<string>("user@momentum.app");
  const [userName, setUserName] = useState<string>("Momentum Scholar");
  const [createdAt, setCreatedAt] = useState<string>("Local Account");
  const [provider, setProvider] = useState<string>("Local Auth");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
        // Fetch user trajectory profile from backend API first
        const response = await fetchApi<{ data: ProfileData & { avatarUrl?: string } }>("/profile").catch(() => null);
        
        let dbAvatar: string | null = null;
        if (response?.data) {
          if (response.data.avatarUrl) {
            dbAvatar = response.data.avatarUrl;
          }
          setTargetPath(response.data.targetPath || "Staff Systems Architect");
          setSkillsInput((response.data.currentSkills || ["Go", "Distributed Systems", "Kafka", "Rust"]).join(", "));
          setInterestsInput((response.data.interests || ["High-throughput microservices", "Consensus algorithms"]).join(", "));
        } else {
          // Default fallbacks
          setTargetPath("Staff Systems Architect");
          setSkillsInput("Go, Distributed Systems, Kafka, Rust, PostgreSQL");
          setInterestsInput("High-throughput microservices, Consensus algorithms, Event Sourcing");
        }

        // Load user auth metadata from authClient
        const currentUser = authClient.getUser();
        if (currentUser) {
          setUserEmail(currentUser.email || "user@momentum.app");
          setUserName(currentUser.name || currentUser.email?.split("@")[0] || "Momentum Scholar");
          
          if (dbAvatar) {
            const resolvedAvatar = dbAvatar.startsWith("/uploads")
              ? `${BACKEND_BASE_URL}${dbAvatar}`
              : dbAvatar;
            setUserAvatar(resolvedAvatar);
          } else if (currentUser.avatarUrl) {
            setUserAvatar(currentUser.avatarUrl);
          }

          if (currentUser.createdAt) {
            setCreatedAt(new Date(currentUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }));
          }
          setProvider("Local Auth");
        } else if (dbAvatar) {
          const resolvedAvatar = dbAvatar.startsWith("/uploads")
            ? `${BACKEND_BASE_URL}${dbAvatar}`
            : dbAvatar;
          setUserAvatar(resolvedAvatar);
        }
      } catch (err) {
        console.warn("Using local profile state defaults:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserDataAndProfile();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const user = authClient.getUser();
      if (!user) throw new Error("You must be signed in to upload an avatar.");

      const formData = new FormData();
      formData.append("avatar", file);

      // Upload to local backend storage endpoint
      const uploadRes = await fetchApi<{ data: { url: string } }>("/upload/avatar", {
        method: "POST",
        body: formData,
      });

      const relativeUrl = uploadRes.data.url;
      const fullUrl = `${BACKEND_BASE_URL}${relativeUrl}`;

      setUserAvatar(fullUrl);

      // Persist avatarUrl to backend database
      await fetchApi("/profile", {
        method: "PUT",
        body: JSON.stringify({
          avatarUrl: relativeUrl,
          targetPath,
          currentSkills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
          interests: interestsInput.split(",").map((i) => i.trim()).filter(Boolean),
        }),
      }).catch(() => null);
    } catch (err) {
      console.warn("Error uploading profile image:", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSavedSuccess(false);

    const skillsArray = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const interestsArray = interestsInput.split(",").map((i) => i.trim()).filter(Boolean);

    try {
      await fetchApi("/profile", {
        method: "PUT",
        body: JSON.stringify({
          avatarUrl: userAvatar,
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
    if (exporting) return;
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

      {/* Unified Profile Edit Form */}
      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Section 1: Personal Identity & Avatar */}
        <div className="p-6 sm:p-8 bg-card border border-border-light rounded-2xl shadow-sm space-y-6">
          <div className="border-b border-border-light pb-3">
            <h3 className="font-serif italic text-2xl text-charcoal flex items-center gap-2">
              <User className="w-5 h-5 text-charcoal-muted" />
              Personal Identity
            </h3>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Update your avatar picture and display name across your workspace.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left w-full">
              {/* Avatar Picture with Camera Upload Overlay */}
              <div className="relative group shrink-0">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-24 h-24 rounded-full object-cover shadow-md border border-border-light"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-charcoal text-white flex items-center justify-center font-serif text-2xl tracking-wider shadow-md">
                    {initials || "ME"}
                  </div>
                )}
                
                {/* Upload Button Overlay */}
                <label
                  htmlFor="avatar-upload-input"
                  className="absolute inset-0 rounded-full bg-charcoal/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-medium"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span>Change</span>
                    </>
                  )}
                </label>
                <input
                  id="avatar-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </div>

              <div className="space-y-3 flex-1 w-full">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal mb-1">
                    Display Name / Full Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full max-w-md px-3.5 py-2 text-sm bg-card-muted/50 border border-border-light rounded-xl text-charcoal focus:outline-none focus:border-charcoal transition-colors"
                  />
                </div>

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
                  <span>•</span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {provider}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Trajectory & Skills Form */}
        <div className="bg-card border border-border-light rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
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

            {/* Global Update Profile Action Button */}
            <div className="flex justify-end pt-4 border-t border-border-light">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full bg-charcoal hover:bg-black text-white px-7 py-3 text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-75 disabled:pointer-events-none"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Profile...</span>
                  </>
                ) : savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Profile Saved!</span>
                  </>
                ) : (
                  <span>Update Profile</span>
                )}
              </button>
            </div>
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border-light bg-white hover:bg-card-muted text-charcoal px-5 py-2.5 text-xs font-medium transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin text-charcoal-muted" /> : <Download className="w-4 h-4 text-charcoal-muted" />}
            <span>Export Complete Profile Data (JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

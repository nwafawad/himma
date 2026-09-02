"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/authClient";
import {
  User,
  Target,
  Download,
  Check,
  Loader2,
  Mail,
  Calendar,
  ShieldCheck,
  Camera,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import {
  exportUserData,
  getProfile,
  uploadAvatar as uploadProfileAvatar,
  upsertProfile,
} from "@/features/profile/api";
import { getErrorMessage } from "@/lib/errors";
import { useToast } from "@/components/ui/Toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api(?:\/v1)?\/?$/, "");

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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const toast = useToast();

  useEffect(() => {
    async function loadUserDataAndProfile() {
      try {
        const response = await getProfile().catch(() => null);

        let dbAvatar: string | null = null;
        if (response?.data) {
          if (response.data.avatarUrl) {
            dbAvatar = response.data.avatarUrl;
          }
          setTargetPath(response.data.targetPath || "Staff Systems Architect");
          setSkillsInput(
            (response.data.currentSkills || ["Go", "Distributed Systems", "Kafka", "Rust"]).join(", ")
          );
          setInterestsInput(
            (response.data.interests || ["High-throughput microservices", "Consensus algorithms"]).join(", ")
          );
        } else {
          setTargetPath("Staff Systems Architect");
          setSkillsInput("Go, Distributed Systems, Kafka, Rust, PostgreSQL");
          setInterestsInput("High-throughput microservices, Consensus algorithms, Event Sourcing");
        }

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
            setCreatedAt(
              new Date(currentUser.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })
            );
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

      const uploadRes = await uploadProfileAvatar(file);
      const relativeUrl = uploadRes.data.url;
      const fullUrl = `${BACKEND_BASE_URL}${relativeUrl}`;

      setUserAvatar(fullUrl);

      await upsertProfile({
        avatarUrl: relativeUrl,
        targetPath,
        currentSkills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
        interests: interestsInput.split(",").map((i) => i.trim()).filter(Boolean),
      }).catch(() => null);

      toast.success("Avatar Updated", "Your profile photo has been refreshed.");
    } catch (err) {
      console.warn("Error uploading profile image:", err);
      toast.error("Avatar Upload Failed", "Unable to save image file.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSavedSuccess(false);
    setSaveError(null);

    const skillsArray = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const interestsArray = interestsInput.split(",").map((i) => i.trim()).filter(Boolean);

    try {
      await upsertProfile({
        avatarUrl: userAvatar,
        targetPath,
        currentSkills: skillsArray,
        interests: interestsArray,
      });
      setSavedSuccess(true);
      toast.success("Profile Saved", "Your learning goals and skills have been updated.");
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: unknown) {
      console.error("Profile save error:", err);
      const msg = getErrorMessage(err, "Failed to save profile. Please check your connection.");
      setSaveError(msg);
      toast.error("Save Failed", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await exportUserData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `momentum_profile_export.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Export Complete", "Journal data downloaded as JSON.");
    } catch (err) {
      console.warn("Export error:", err);
      toast.error("Export Failed", "Could not download profile data.");
    } finally {
      setExporting(false);
    }
  };

  const handleTriggerInstall = () => {
    window.dispatchEvent(new CustomEvent("trigger-pwa-install"));
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center gap-2 text-charcoal-muted text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-charcoal" />
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

      {saveError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

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
              Review your account details and update your workspace avatar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left w-full">
              {/* Avatar with Camera Upload Overlay */}
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
                  <label
                    htmlFor="profile-display-name"
                    className="block text-xs uppercase tracking-wider font-semibold text-charcoal mb-1"
                  >
                    Display Name / Full Name
                  </label>
                  <div className="max-w-md space-y-1">
                    <input
                      id="profile-display-name"
                      type="text"
                      value={userName}
                      readOnly
                      aria-readonly="true"
                      className="w-full px-3.5 py-2 text-sm bg-card-muted/80 border border-border-light rounded-xl text-charcoal cursor-not-allowed select-none focus:outline-none"
                    />
                    <p className="text-[11px] text-charcoal-muted">
                      Display name is set during account registration and cannot be modified directly.
                    </p>
                  </div>
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
              Specify your target technical role and current skill domains to anchor AI synthesis.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="profile-target-path"
                className="block text-xs uppercase tracking-wider font-semibold text-charcoal mb-1"
              >
                Target Career Path / Role Goal
              </label>
              <input
                id="profile-target-path"
                type="text"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                placeholder="e.g. Senior Backend Architect, AI Systems Engineer..."
                className="w-full px-3.5 py-2.5 text-sm bg-card-muted/40 border border-border-light rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="profile-skills-input"
                className="block text-xs uppercase tracking-wider font-semibold text-charcoal mb-1"
              >
                Current Technical Skills (comma-separated)
              </label>
              <input
                id="profile-skills-input"
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="Go, Distributed Systems, Kafka, Rust, PostgreSQL"
                className="w-full px-3.5 py-2.5 text-sm bg-card-muted/40 border border-border-light rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal transition-colors font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="profile-interests-input"
                className="block text-xs uppercase tracking-wider font-semibold text-charcoal mb-1"
              >
                Topics & Domain Interests (comma-separated)
              </label>
              <input
                id="profile-interests-input"
                type="text"
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                placeholder="High-throughput microservices, Consensus algorithms, Event Sourcing"
                className="w-full px-3.5 py-2.5 text-sm bg-card-muted/40 border border-border-light rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal transition-colors font-mono"
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-charcoal hover:bg-black text-white px-7 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-75 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2"
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

      {/* Account Data Export & App Install Section */}
      <div className="bg-card border border-border-light rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-border-light pb-3">
          <h3 className="font-serif italic text-2xl text-charcoal">
            Data Control & PWA Access
          </h3>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Download your raw activity history or install Momentum as a standalone application.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleExportData}
            disabled={exporting}
            className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border-light bg-white hover:bg-card-muted text-charcoal px-5 py-2.5 text-xs font-medium transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-charcoal-muted" />
            ) : (
              <Download className="w-4 h-4 text-charcoal-muted" />
            )}
            <span>Export Complete Profile Data (JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerInstall}
            className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-card-muted hover:bg-border-light text-charcoal px-5 py-2.5 text-xs font-medium transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
          >
            <Smartphone className="w-4 h-4 text-charcoal" />
            <span>Install Standalone App</span>
          </button>
        </div>
      </div>
    </div>
  );
}

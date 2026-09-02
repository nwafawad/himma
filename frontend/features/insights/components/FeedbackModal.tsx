"use client";

import { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Check, Loader2, Edit3, Target, Code2, AlertCircle } from "lucide-react";
import { submitInsightFeedback } from "@/features/insights/api";
import { getProfile } from "@/features/profile/api";
import { getErrorMessage } from "@/lib/errors";
import { useToast } from "@/components/ui/Toast";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  insightId: string;
  initialSkills?: string[];
  initialTargetPath?: string | null;
  onSuccess?: () => void;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  insightId,
  initialSkills,
  initialTargetPath,
  onSuccess,
}: FeedbackModalProps) {
  const [targetPath, setTargetPath] = useState<string>("");
  const [skillsInput, setSkillsInput] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [baselineProfile, setBaselineProfile] = useState<{
    targetPath: string;
    skills: string[];
  } | null>(null);

  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();

  const loadProfileBaseline = useCallback(async () => {
    setLoadingProfile(true);
    setError(null);
    try {
      const res = await getProfile().catch(() => null);
      const profileData = res?.data;

      const profileTarget = profileData?.targetPath ?? "";
      const profileSkills = profileData?.currentSkills ?? [];

      setBaselineProfile({
        targetPath: profileTarget,
        skills: profileSkills,
      });

      // Use explicit initial values if provided and non-empty, otherwise use profile
      setTargetPath(
        initialTargetPath !== undefined && initialTargetPath !== null && initialTargetPath !== ""
          ? initialTargetPath
          : profileTarget
      );

      setSkills(
        initialSkills && initialSkills.length > 0
          ? initialSkills
          : profileSkills
      );
      setSkillsInput("");
    } catch {
      // Fallback
      setTargetPath(initialTargetPath || "");
      setSkills(initialSkills || []);
    } finally {
      setLoadingProfile(false);
    }
  }, [initialTargetPath, initialSkills]);

  useEffect(() => {
    if (isOpen) {
      loadProfileBaseline();
    }
  }, [isOpen, loadProfileBaseline]);

  const handleAddSkill = () => {
    const trimmed = skillsInput.trim().replace(/^,+|,+$/g, "");
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setSkillsInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleKeyDownSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      const trimmed = skillsInput.trim();
      if (trimmed) {
        e.preventDefault();
        handleAddSkill();
      } else if (e.key === ",") {
        e.preventDefault();
      }
      // If Enter is pressed and input is empty, allow default form submit!
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || loadingProfile) return;

    setError(null);

    // Determine what actually changed relative to the baseline profile
    const normalizedTarget = targetPath.trim();
    const baselineTarget = (baselineProfile?.targetPath || "").trim();
    const targetChanged = baselineProfile ? normalizedTarget !== baselineTarget : true;

    const baselineSkillsSet = new Set(baselineProfile?.skills || []);
    const skillsChanged =
      !baselineProfile ||
      skills.length !== baselineProfile.skills.length ||
      skills.some((s) => !baselineSkillsSet.has(s));

    if (!targetChanged && !skillsChanged) {
      toast.info("No Changes Detected", "Your profile already matches these values.");
      onClose();
      return;
    }

    setSubmitting(true);

    try {
      const payload: {
        action: "correct";
        correctedSkills?: string[];
        correctedTargetPath?: string | null;
      } = { action: "correct" };

      if (skillsChanged) {
        payload.correctedSkills = skills;
      }

      // Only pass correctedTargetPath if it was intentionally altered
      if (targetChanged) {
        payload.correctedTargetPath = normalizedTarget || null;
      }

      await submitInsightFeedback(insightId, payload);

      toast.success("Profile Updated", "Learning focus and skills saved for future insights.");
      window.dispatchEvent(new CustomEvent("profile-updated"));

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to submit profile correction."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(openState) => {
        if (!openState && submitting) return;
        if (!openState) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content
          onPointerDownOutside={(e) => {
            if (submitting) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (submitting) e.preventDefault();
          }}
          className="fixed bottom-0 inset-x-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full max-w-lg bg-card rounded-t-3xl sm:rounded-2xl border border-border-light shadow-xl p-6 sm:p-8 z-50 space-y-6 focus:outline-none max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-light pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-card-muted text-charcoal border border-border-light flex items-center justify-center shrink-0">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-charcoal">
                  Adjust Career Goals & Skills
                </Dialog.Title>
                <Dialog.Description className="text-xs text-charcoal-muted">
                  Correcting your profile ensures future AI insight runs reflect your true direction.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close
              onClick={onClose}
              aria-label="Close feedback dialog"
              className="p-2 rounded-full hover:bg-card-muted text-charcoal-muted hover:text-charcoal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
            >
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loadingProfile ? (
            <div className="flex items-center justify-center py-10 text-charcoal-muted text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-charcoal" />
              <span>Loading current profile goals...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Target Path Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="feedback-target-path"
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-charcoal"
                >
                  <Target className="w-3.5 h-3.5 text-charcoal-muted" />
                  <span>Target Path / Role</span>
                </label>
                <input
                  id="feedback-target-path"
                  type="text"
                  value={targetPath}
                  onChange={(e) => setTargetPath(e.target.value)}
                  placeholder="e.g. Senior Backend Architect, AI Engineering Lead..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-light bg-card-muted/30 focus:outline-none focus:ring-2 focus:ring-charcoal text-base sm:text-sm text-charcoal placeholder:text-charcoal-muted/60 transition-colors"
                />
              </div>

              {/* Skills Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="feedback-skills-input"
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-charcoal"
                >
                  <Code2 className="w-3.5 h-3.5 text-charcoal-muted" />
                  <span>Current Skills</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="feedback-skills-input"
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    onKeyDown={handleKeyDownSkill}
                    placeholder="Type a skill & press Enter or comma..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-border-light bg-card-muted/30 focus:outline-none focus:ring-2 focus:ring-charcoal text-base sm:text-sm text-charcoal placeholder:text-charcoal-muted/60 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    disabled={!skillsInput.trim()}
                    className="inline-flex min-h-10 items-center justify-center rounded-full bg-card hover:bg-card-muted border border-border-light px-4 py-2 text-xs font-medium text-charcoal transition-all disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
                  >
                    Add
                  </button>
                </div>

                {/* Skills Tags */}
                <div className="flex flex-wrap gap-2 pt-2 min-h-[40px]">
                  {skills.length === 0 ? (
                    <span className="text-xs italic text-charcoal-muted">No skills added yet.</span>
                  ) : (
                    skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-badge-trackBg text-badge-trackText text-xs font-medium border border-border-subtle"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          aria-label={`Remove skill ${skill}`}
                          className="hover:text-charcoal p-0.5 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-light">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-border-light bg-white px-4 py-2 text-xs font-medium text-charcoal transition-all hover:bg-card-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-charcoal px-5 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-black active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Profile...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save & Update Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

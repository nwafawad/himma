"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Check, Loader2, Edit3, Target, Code2 } from "lucide-react";
import { submitInsightFeedback } from "@/features/insights/api";
import { getErrorMessage } from "@/lib/errors";

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
  initialSkills = [],
  initialTargetPath = "",
  onSuccess,
}: FeedbackModalProps) {
  const [targetPath, setTargetPath] = useState<string>("");
  const [skillsInput, setSkillsInput] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTargetPath(initialTargetPath || "");
      setSkills(initialSkills || []);
      setSkillsInput("");
      setError(null);
    }
  }, [isOpen, initialTargetPath, initialSkills]);

  const handleAddSkill = () => {
    const trimmed = skillsInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillsInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleKeyDownSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await submitInsightFeedback(insightId, {
        action: "correct",
        correctedSkills: skills,
        correctedTargetPath: targetPath.trim() || null,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to submit profile correction."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed bottom-0 inset-x-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full max-w-lg bg-card rounded-t-3xl sm:rounded-2xl border border-border-light shadow-xl p-6 sm:p-8 z-50 space-y-6 focus:outline-none max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-light pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
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
            <Dialog.Close className="p-2 rounded-full hover:bg-card-muted text-charcoal-muted hover:text-charcoal transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Target Path Field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-charcoal">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>Target Path / Role</span>
              </label>
              <input
                type="text"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                placeholder="e.g. Senior Backend Architect, AI Engineering Lead..."
                className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-card focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm text-charcoal placeholder:text-charcoal-muted"
              />
            </div>

            {/* Skills Field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-charcoal">
                <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Current Skills</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyDown={handleKeyDownSkill}
                  placeholder="Type a skill & press Enter..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border-light bg-card focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm text-charcoal placeholder:text-charcoal-muted"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-xs font-medium border border-indigo-100 dark:border-indigo-900"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-red-500 transition-colors"
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
                className="px-4 py-2.5 rounded-xl border border-border-light text-xs font-semibold text-charcoal hover:bg-card-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

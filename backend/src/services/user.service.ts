/**
 * @file user.service.ts
 * @description Service handling GDPR user data export bundles and account deletion cleanup across database and Supabase Auth.
 */

import { prisma } from '../config/prisma.js';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Aggregates all user-owned data (profile, activities, notes, insights, import candidates, profile digests)
 * into a single GDPR export bundle object.
 *
 * @param userId - Unique identifier of the user exporting their data.
 * @returns Comprehensive JSON data export bundle with ISO export timestamp.
 */
export const exportUserDataBundle = async (userId: string) => {
  const [profile, activities, notes, insights, candidates, digests] = await Promise.all([
    prisma.skillsGoalsProfile.findUnique({ where: { userId } }),
    prisma.activityEntry.findMany({ where: { userId }, orderBy: { consumedAt: 'desc' } }),
    prisma.noteEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.insightRun.findMany({ where: { userId }, orderBy: { timestamp: 'desc' } }),
    prisma.importCandidate.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.profileDigest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    userId,
    profile: profile || null,
    activities,
    notes,
    insights,
    importCandidates: candidates,
    profileDigests: digests,
  };
};

/**
 * Deletes a user account completely: removes PostgreSQL record (cascading to all child records)
 * and deletes the account from Supabase Auth admin service.
 *
 * @param userId - Unique identifier of the user account to delete.
 * @returns Always returns true upon completion.
 */
export const deleteUserAccount = async (userId: string) => {
  // 1. Delete user record in PostgreSQL (cascades to all profiles, notes, activities, insights)
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
  } catch (err: any) {
    console.warn('User record not found in public.users, proceeding with Supabase Auth cleanup:', err.message);
  }

  // 2. Trigger Supabase Auth admin user deletion
  try {
    await supabaseAdmin.auth.admin.deleteUser(userId);
  } catch (err: any) {
    console.error('Warning: Failed to delete Supabase Auth admin user:', err.message);
  }

  return true;
};


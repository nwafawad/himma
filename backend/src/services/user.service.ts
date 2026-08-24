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
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    const failure = new Error('Account deletion could not be completed. No success was recorded.');
    Object.assign(failure, { code: 'ACCOUNT_DELETION_FAILED', statusCode: 502, cause: error });
    throw failure;
  }

  // The auth.users foreign key is ON DELETE CASCADE. Verify that the public row is gone.
  const remainingUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (remainingUser) {
    const failure = new Error('Authentication was deleted, but associated application data still exists.');
    Object.assign(failure, { code: 'ACCOUNT_DELETION_INCOMPLETE', statusCode: 500 });
    throw failure;
  }
};

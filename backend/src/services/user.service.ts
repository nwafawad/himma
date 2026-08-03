import { prisma } from '../config/prisma.js';
import { supabaseAdmin } from '../config/supabase.js';

export const exportUserDataBundle = async (userId: string) => {
  const [profile, activities, notes, insights] = await Promise.all([
    prisma.skillsGoalsProfile.findUnique({ where: { userId } }),
    prisma.activityEntry.findMany({ where: { userId }, orderBy: { consumedAt: 'desc' } }),
    prisma.noteEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.insightRun.findMany({ where: { userId }, orderBy: { timestamp: 'desc' } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    userId,
    profile: profile || null,
    activities,
    notes,
    insights,
  };
};

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

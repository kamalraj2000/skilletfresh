import { redirect } from 'next/navigation';
import { auth } from '@/auth';

/**
 * The per-profile scoping seam: every page and server action goes through
 * this, and every query filters by the returned profileId.
 */
export async function requireProfile(): Promise<{ userId: string; profileId: string }> {
  const session = await auth();
  if (!session?.profileId) redirect('/signin');
  return { userId: session.userId, profileId: session.profileId };
}

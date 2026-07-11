'use client';

import { useRouter } from 'next/navigation';
import { TodayView } from '@/components/TodayView';
import { useAppState } from '@/lib/app-state';

export default function TodayPage() {
  const router = useRouter();
  const { days, logged, replanPending, logTonight, confirmReplan } = useAppState();
  return (
    <TodayView
      days={days}
      logged={logged}
      replanPending={replanPending}
      onLog={logTonight}
      onConfirmReplan={confirmReplan}
      onOpenRecipe={() => router.push('/today/recipe')}
    />
  );
}

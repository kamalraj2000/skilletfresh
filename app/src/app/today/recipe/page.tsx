'use client';

import { useRouter } from 'next/navigation';
import { RecipeDetail } from '@/components/TodayView';
import { TODAY_INDEX } from '@/lib/data';
import { useAppState } from '@/lib/app-state';

export default function RecipePage() {
  const router = useRouter();
  const { days } = useAppState();
  return <RecipeDetail meal={days[TODAY_INDEX]} onBack={() => router.push('/today')} />;
}

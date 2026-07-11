'use client';

import { useRouter } from 'next/navigation';
import { SundayReview } from '@/components/SundayReview';
import { useAppState } from '@/lib/app-state';

export default function PlanPage() {
  const router = useRouter();
  const { days, locked, swapMeal, lockPlan } = useAppState();
  return (
    <SundayReview
      days={days}
      locked={locked}
      onSwap={swapMeal}
      onLock={() => {
        lockPlan();
        router.push('/list');
      }}
      onViewList={() => router.push('/list')}
    />
  );
}

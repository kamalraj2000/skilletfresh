'use client';

import { useRouter } from 'next/navigation';
import { ShoppingList } from '@/components/ShoppingList';
import { useAppState } from '@/lib/app-state';

export default function ListPage() {
  const router = useRouter();
  const { aisles, receiptDone, toggleItem, closeReceipt } = useAppState();
  return (
    <ShoppingList
      aisles={aisles}
      onToggleItem={toggleItem}
      receiptDone={receiptDone}
      onReceiptClose={closeReceipt}
      onContinueToToday={() => router.push('/today')}
    />
  );
}

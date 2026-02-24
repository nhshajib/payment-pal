import { useState, useCallback } from 'react';

export interface ReceiptData {
  confirmationNumber?: string;
  receiptImage?: string; // base64 data URL
}

const STORAGE_KEY = 'paytrack_receipts';

function getStored(): Record<string, ReceiptData> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

export function useReceiptStash() {
  const [receipts, setReceipts] = useState<Record<string, ReceiptData>>(getStored);

  const saveReceipt = useCallback((paymentId: string, data: ReceiptData) => {
    setReceipts(prev => {
      const next = { ...prev, [paymentId]: data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getReceipt = useCallback((paymentId: string): ReceiptData | undefined => {
    return receipts[paymentId];
  }, [receipts]);

  return { receipts, saveReceipt, getReceipt };
}

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Payment } from '@/hooks/usePayments';
import { getCategoryById } from '@/lib/categories';

interface Props {
  payment: Payment | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (payment: Payment, confirmationNumber?: string, receiptImage?: string) => void;
}

export default function MarkPaidDrawer({ payment, open, onClose, onConfirm }: Props) {
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!payment) return null;

  const cat = getCategoryById(payment.category || 'other');
  const Icon = cat.icon;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File too large. Max 2MB.');
      return;
    }
    setReceiptName(file.name);
    const reader = new FileReader();
    reader.onload = () => setReceiptImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    onConfirm(payment, confirmationNumber || undefined, receiptImage || undefined);
    setConfirmationNumber('');
    setReceiptImage(null);
    setReceiptName('');
    onClose();
  };

  const handleClose = () => {
    setConfirmationNumber('');
    setReceiptImage(null);
    setReceiptName('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-[60] max-w-md mx-auto"
          >
            <div className="bg-card rounded-t-3xl border-t border-border/50 shadow-2xl">
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
              </div>

              <div className="px-6 pb-8 pt-2 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: cat.color }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Marking as Paid</p>
                      <h3 className="text-lg font-bold text-card-foreground">{payment.name}</h3>
                    </div>
                  </div>
                  <button onClick={handleClose} className="p-1.5 rounded-full bg-secondary">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Confirmation Number */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block ml-1">
                    Confirmation Number (optional)
                  </label>
                  <div className="relative">
                    <Receipt className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input
                      value={confirmationNumber}
                      onChange={e => setConfirmationNumber(e.target.value)}
                      placeholder="e.g. TXN-123456"
                      className="h-12 bg-secondary/50 border-0 rounded-xl pl-10 text-sm focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                {/* Receipt Upload */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block ml-1">
                    Receipt (optional)
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {receiptImage ? (
                    <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3">
                      <img src={receiptImage} alt="Receipt" className="w-10 h-10 rounded-lg object-cover" />
                      <span className="text-sm text-card-foreground truncate flex-1">{receiptName}</span>
                      <button
                        type="button"
                        onClick={() => { setReceiptImage(null); setReceiptName(''); }}
                        className="p-1 rounded-full bg-secondary"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-card-foreground hover:border-muted-foreground/40 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Attach Screenshot / Receipt
                    </button>
                  )}
                </div>

                {/* Confirm Button */}
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    onClick={handleConfirm}
                    className="w-full h-[52px] rounded-2xl text-base font-semibold shadow-lg shadow-primary/20"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Confirm Payment
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

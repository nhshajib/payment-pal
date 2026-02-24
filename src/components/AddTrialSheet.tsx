import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays, Link2, StickyNote, Globe, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; expires_on: string; cancel_url?: string; notes?: string }) => void;
}

const REMINDER_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '1 week' },
];

export default function AddTrialSheet({ open, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [expiresOn, setExpiresOn] = useState<Date>(new Date());
  const [cancelUrl, setCancelUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderDays, setReminderDays] = useState(3);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    // Store reminder_days and website in notes as JSON
    const meta = JSON.stringify({
      reminder_days: reminderDays,
      website_url: websiteUrl.trim() || undefined,
    });
    onSubmit({
      name: name.trim(),
      expires_on: format(expiresOn, 'yyyy-MM-dd'),
      cancel_url: cancelUrl.trim() || undefined,
      notes: notes.trim() ? `${meta}\n${notes.trim()}` : meta,
    });
    setName('');
    setCancelUrl('');
    setWebsiteUrl('');
    setNotes('');
    setReminderDays(3);
    setExpiresOn(new Date());
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[70]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-md mx-auto"
          >
            <div className="bg-card rounded-t-3xl border-t border-border/50 shadow-2xl overflow-hidden">
              <div className="flex justify-center pt-3 pb-3">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex items-center justify-between px-6 pb-4 pt-2">
                <h2 className="text-xl font-bold text-card-foreground tracking-tight">Add Free Trial</h2>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>
              <div className="h-px bg-border/50 mx-6" />
              <form onSubmit={handleSubmit} className="px-6 pb-10 pt-5 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Trial Name */}
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Trial name (e.g. Netflix)"
                  required
                  className="h-14 text-lg font-medium bg-secondary/50 border-0 rounded-2xl px-5 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary"
                />

                {/* Expiration Date */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block ml-1">Expiration Date</label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "w-full h-12 bg-secondary/50 border-0 rounded-xl pl-10 pr-4 text-sm text-left relative flex items-center focus:outline-none focus:ring-1 focus:ring-primary",
                        )}
                      >
                        <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <span className="text-card-foreground font-medium">{format(expiresOn, 'EEEE, MMM d, yyyy')}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border z-[200]" align="start" side="top">
                      <Calendar
                        mode="single"
                        selected={expiresOn}
                        onSelect={(date) => { if (date) setExpiresOn(date); setCalendarOpen(false); }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Remind Me */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block ml-1 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />
                    Remind me before expiry
                  </label>
                  <div className="flex gap-2">
                    {REMINDER_OPTIONS.map(opt => (
                      <motion.button
                        key={opt.value}
                        type="button"
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setReminderDays(opt.value)}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                          reminderDays === opt.value
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "bg-secondary/50 text-muted-foreground"
                        )}
                      >
                        {opt.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Website URL */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block ml-1">Website / Service URL (optional)</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input
                      type="url"
                      value={websiteUrl}
                      onChange={e => setWebsiteUrl(e.target.value)}
                      placeholder="https://netflix.com"
                      className="h-12 bg-secondary/50 border-0 rounded-xl pl-10 text-sm focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                {/* Cancel URL */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block ml-1">Cancel URL (optional)</label>
                  <div className="relative">
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input
                      type="url"
                      value={cancelUrl}
                      onChange={e => setCancelUrl(e.target.value)}
                      placeholder="https://cancel.example.com"
                      className="h-12 bg-secondary/50 border-0 rounded-xl pl-10 text-sm focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block ml-1">Notes (optional)</label>
                  <div className="relative">
                    <StickyNote className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground/50" />
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Any details..."
                      rows={2}
                      className="w-full bg-secondary/50 border-0 rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none text-card-foreground"
                    />
                  </div>
                </div>

                <motion.div whileTap={{ scale: 0.96 }}>
                  <Button type="submit" className="w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/25 mt-2" style={{ height: '52px' }}>
                    Add Trial
                  </Button>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

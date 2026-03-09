import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, ChevronRight, Trash2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useCurrency } from '@/hooks/useCurrency';
import { useSplitGroups } from '@/hooks/useSplitGroups';
import { useSplitGroupDetail } from '@/hooks/useSplitGroups';
import PageTransition from '@/components/PageTransition';
import SplitGroupDetail from '@/components/split/SplitGroupDetail';
import AddGroupSheet from '@/components/split/AddGroupSheet';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';

export default function Split() {
  const { userId, userName } = useUser();
  const { format: formatCurrency } = useCurrency();
  const { groups, loading, createGroup, deleteGroup, fetchGroups } = useSplitGroups(userId);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  if (selectedGroup) {
    return (
      <SplitGroupDetail
        group={selectedGroup}
        onBack={() => { setSelectedGroupId(null); fetchGroups(); }}
      />
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen pb-28 px-5 pt-8 max-w-md mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-[13px] font-medium text-muted-foreground/50 uppercase tracking-[1.5px] mb-1">
            Bill Splitting
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-none">
            Split
          </h1>
        </motion.header>

        {/* Groups List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="rounded-2xl mono-card p-5 animate-pulse">
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-4 w-20 bg-muted rounded mt-2" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mono-card mb-4">
              <Users className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-foreground font-semibold text-base">No groups yet</p>
            <p className="text-muted-foreground/50 text-sm mt-1.5 max-w-[240px] mx-auto">
              Create a group to start splitting bills with friends
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {groups.map((group, i) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  index={i}
                  onSelect={() => { haptic(15); setSelectedGroupId(group.id); }}
                  onDelete={() => {
                    haptic(20);
                    deleteGroup(group.id);
                    toast.success('Group deleted');
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* FAB */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { haptic(15); setShowAddGroup(true); }}
          className="fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </motion.button>

        <AddGroupSheet
          open={showAddGroup}
          onClose={() => setShowAddGroup(false)}
          onCreate={async (name, emoji, members) => {
            await createGroup(name, emoji, members, userName || 'Me');
            setShowAddGroup(false);
            toast.success('Group created!');
          }}
        />
      </div>
    </PageTransition>
  );
}

function GroupCard({ group, index, onSelect, onDelete }: {
  group: any; index: number; onSelect: () => void; onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl mono-card overflow-hidden"
    >
      <button
        onClick={onSelect}
        className="w-full text-left px-5 py-4 flex items-center gap-4 active:bg-secondary/30 transition-colors"
      >
        <div className="w-12 h-12 rounded-2xl mono-card-solid flex items-center justify-center flex-shrink-0 text-2xl">
          {group.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-semibold text-foreground truncate tracking-tight">
            {group.name}
          </h3>
          <p className="text-[13px] text-muted-foreground/50 mt-0.5">
            Tap to view details
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
      </button>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, ChevronRight, Crown, Trash2, Bell } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useCurrency } from '@/hooks/useCurrency';
import { usePremium } from '@/hooks/usePremium';
import { useSplitGroups } from '@/hooks/useSplitGroups';
import PageTransition from '@/components/PageTransition';
import SplitGroupDetail from '@/components/split/SplitGroupDetail';
import AddGroupSheet from '@/components/split/AddGroupSheet';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getUnseenCount } from '@/lib/groupActivity';

const FREE_GROUP_LIMIT = 3;

export default function Split() {
  const { userId, userName } = useUser();
  const { isPremium } = usePremium();
  const { format: formatCurrency } = useCurrency();
  const { groups, loading, createGroup, deleteGroup, fetchGroups } = useSplitGroups(userId);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const navigate = useNavigate();

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  if (selectedGroup) {
    return (
      <SplitGroupDetail
        group={selectedGroup}
        onBack={() => { setSelectedGroupId(null); fetchGroups(); }}
      />
    );
  }

  const canCreateGroup = isPremium || groups.length < FREE_GROUP_LIMIT;

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
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-none">
              Split
            </h1>
            {!isPremium && groups.length > 0 && (
              <span className="text-[11px] font-semibold text-muted-foreground/50 bg-muted px-2.5 py-1 rounded-full">
                {groups.length}/{FREE_GROUP_LIMIT} groups
              </span>
            )}
          </div>
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

            {/* Premium upsell banner when at limit */}
            {!isPremium && groups.length >= FREE_GROUP_LIMIT && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl mono-card p-4 mt-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Want more groups?</p>
                    <p className="text-[12px] text-muted-foreground/50 mt-0.5">
                      Upgrade to Premium for unlimited groups & members
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/premium')}
                    className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex-shrink-0"
                  >
                    Upgrade
                  </motion.button>
                </div>
              </motion.div>
            )}
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
          groupCount={groups.length}
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
  const [dragX, setDragX] = useState(0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl mono-card overflow-hidden relative"
    >
      {/* Delete background */}
      <div 
        className="absolute inset-y-0 right-0 w-20 bg-destructive flex items-center justify-center rounded-r-2xl"
        style={{ opacity: Math.min(1, Math.abs(dragX) / 60) }}
      >
        <Trash2 className="w-5 h-5 text-destructive-foreground" />
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) {
            haptic(20);
            onDelete();
          }
          setDragX(0);
        }}
        className="relative bg-popover rounded-2xl"
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
              Swipe left to delete
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
        </button>
      </motion.div>
    </motion.div>
  );
}

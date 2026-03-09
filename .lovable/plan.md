

## Split Tab Review — Issues & Fixes

### Critical Bugs Found

**1. Balance Calculation Logic Error**
When a share is settled, the payer's balance doesn't update correctly. Current logic:
```
balance = total_paid - own_unsettled_share
```
Should be:
```
balance = sum(unsettled shares of others for my expenses) - sum(my unsettled shares on others' expenses)
```

Example: If A pays $60 for A, B, C ($20 each) and B settles, A should show +$20 (only C owes). But currently shows +$40.

**2. AddExpenseSheet State Not Reset on Reopen**
`paidBy` and `participants` are only initialized on component mount. When sheet reopens (or members change), state is stale. Could reference non-existent member IDs.

**3. No Delete UI for Groups**
`onDelete` handler exists in `GroupCard` but there's no delete button rendered. Users can't remove groups from the main list.

**4. AddExpenseSheet Missing Currency Format**
"Each pays: X.XX" shows raw number without currency symbol.

---

### Implementation Plan

**File: `src/hooks/useSplitGroups.ts`**
- Fix balance calculation to properly track who owes whom
- Only count unsettled shares between different members

**File: `src/components/split/AddExpenseSheet.tsx`**  
- Add useEffect to reset state when `open` changes or `members` changes
- Sync `paidBy` to valid member on open
- Update participants to include all current members
- Format "Each pays" with currency

**File: `src/pages/Split.tsx`**
- Add swipe-to-delete on GroupCard using motion drag gestures
- Show delete button on swipe left

**File: `src/components/split/SplitGroupDetail.tsx`**
- Show hint when < 2 members explaining expenses need 2+ people

---

### Technical Details

**Balance fix formula:**
```typescript
// For member M:
let credit = 0;  // others owe me
let debit = 0;   // I owe others

expenses.forEach(exp => {
  const expShares = shares.filter(s => s.expense_id === exp.id);
  expShares.forEach(share => {
    if (!share.is_settled) {
      if (exp.paid_by === M.id && share.member_id !== M.id) {
        credit += share.amount; // they owe me
      } else if (exp.paid_by !== M.id && share.member_id === M.id) {
        debit += share.amount; // I owe them
      }
    }
  });
});
balance = credit - debit;
```

**AddExpenseSheet state sync:**
```typescript
useEffect(() => {
  if (open && members.length > 0) {
    setPaidBy(members[0].id);
    setParticipants(members.map(m => m.id));
    setTitle('');
    setAmount('');
    setDate(new Date().toISOString().slice(0,10));
    setNotes('');
  }
}, [open, members]);
```

**Swipe-to-delete gesture:**
```typescript
<motion.div
  drag="x"
  dragConstraints={{ left: -80, right: 0 }}
  onDragEnd={(_, info) => {
    if (info.offset.x < -60) onDelete();
  }}
>
```


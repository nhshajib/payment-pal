// Group activity log for tracking changes in split groups

export interface ActivityEntry {
  id: string;
  groupId: string;
  message: string;
  timestamp: string;
}

const ACTIVITY_KEY = 'paytrack_group_activity';
const SEEN_KEY = 'paytrack_group_activity_seen';

export function getGroupActivity(groupId: string): ActivityEntry[] {
  try {
    const all = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]') as ActivityEntry[];
    return all.filter(a => a.groupId === groupId).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch { return []; }
}

export function addGroupActivity(groupId: string, message: string) {
  try {
    const all = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]') as ActivityEntry[];
    const entry: ActivityEntry = {
      id: crypto.randomUUID(),
      groupId,
      message,
      timestamp: new Date().toISOString(),
    };
    all.push(entry);
    // Keep last 100 entries total
    const trimmed = all.slice(-100);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(trimmed));
  } catch { }
}

export function getUnseenCount(groupId: string): number {
  try {
    const lastSeen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') as Record<string, string>;
    const seenTime = lastSeen[groupId] ? new Date(lastSeen[groupId]).getTime() : 0;
    const activities = getGroupActivity(groupId);
    return activities.filter(a => new Date(a.timestamp).getTime() > seenTime).length;
  } catch { return 0; }
}

export function markGroupSeen(groupId: string) {
  try {
    const lastSeen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') as Record<string, string>;
    lastSeen[groupId] = new Date().toISOString();
    localStorage.setItem(SEEN_KEY, JSON.stringify(lastSeen));
  } catch { }
}

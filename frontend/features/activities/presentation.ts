import type { Activity } from '@himma/contracts';

export interface ActivityFeedItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  type: string;
  time: string;
  link?: string;
  consumedAt: string;
}

const formatDateLabel = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Today';

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (date.toDateString() === now.toDateString()) return `Today at ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const toActivityFeedItem = (activity: Activity): ActivityFeedItem => ({
  id: activity.id,
  title: activity.title,
  summary: activity.title,
  category: activity.tags[0]?.toUpperCase() || 'ENGINEERING',
  type: activity.type.toUpperCase(),
  time: formatDateLabel(activity.consumedAt),
  link: activity.url || undefined,
  consumedAt: activity.consumedAt,
});

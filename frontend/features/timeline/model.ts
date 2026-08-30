import type { Activity, Note } from '@himma/contracts';

export type TimelineFilter = 'All' | 'Article' | 'Course' | 'Note' | 'Repository' | 'Video';

export interface TimelineEntry {
  id: string;
  dateGroup: string;
  type: TimelineFilter;
  title: string;
  summary: string;
  time: string;
  category: string;
  link?: string;
  consumedAt: string;
}

export const timelineFilters: TimelineFilter[] = [
  'All',
  'Article',
  'Course',
  'Note',
  'Repository',
  'Video',
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    dateGroup: date
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      .toUpperCase(),
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};

const activityTypeLabels: Record<Activity['type'], Exclude<TimelineFilter, 'All'>> = {
  article: 'Article',
  video: 'Video',
  course: 'Course',
  repository: 'Repository',
  other: 'Note',
};

export const activityToTimelineEntry = (activity: Activity): TimelineEntry => ({
  id: `activity:${activity.id}`,
  ...formatDate(activity.consumedAt),
  type: activityTypeLabels[activity.type],
  title: activity.title,
  summary: activity.title,
  category: activity.tags[0]?.toUpperCase() || 'ENGINEERING',
  link: activity.url || undefined,
  consumedAt: activity.consumedAt,
});

export const noteToTimelineEntry = (note: Note): TimelineEntry => ({
  id: `note:${note.id}`,
  ...formatDate(note.createdAt),
  type: 'Note',
  title: note.text.length > 60 ? `${note.text.slice(0, 60)}...` : note.text || 'Study Note',
  summary: note.text,
  category: note.tags[0]?.toUpperCase() || 'ENGINEERING',
  consumedAt: note.createdAt,
});

export const mergeTimelineEntries = (activities: Activity[], notes: Note[]): TimelineEntry[] =>
  [...activities.map(activityToTimelineEntry), ...notes.map(noteToTimelineEntry)].sort(
    (a, b) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime()
  );

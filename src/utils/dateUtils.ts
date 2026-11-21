import { BlockCategory, Course, CourseAccent, DayGap, ScheduleBlock, Weekday } from '../types/schedule';

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, delta: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + delta);
  return toISODate(date);
}

export function formatDisplayDate(iso: string): string {
  const date = parseISODate(iso);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(iso: string): string {
  const date = parseISODate(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatWeekdayShort(iso: string): string {
  const date = parseISODate(iso);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function getWeekday(iso: string): Weekday {
  return parseISODate(iso).getDay() as Weekday;
}

export function getWeekDates(anchorIso: string): string[] {
  const date = parseISODate(anchorIso);
  const day = date.getDay(); // 0 = Sun ... 6 = Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toISODate(d);
  });
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTime12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getBlocksForDate(
  dateIso: string,
  courses: Course[],
  customBlocks: ScheduleBlock[],
  skippedRecurringKeys: string[],
  completedRecurringKeys: string[]
): ScheduleBlock[] {
  const weekday = getWeekday(dateIso);
  const generated: ScheduleBlock[] = [];

  for (const course of courses) {
    course.meetings.forEach((meeting, idx) => {
      if (meeting.days.includes(weekday)) {
        const recurringKey = `${course.id}__${idx}__${dateIso}`;
        if (skippedRecurringKeys.includes(recurringKey)) return;
        generated.push({
          id: `rec_${recurringKey}`,
          title: `${course.code}: ${course.title}`,
          date: dateIso,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          category: meeting.kind,
          courseId: course.id,
          location: meeting.location,
          completed: completedRecurringKeys.includes(recurringKey),
          isRecurringCourse: true,
          recurringKey,
        });
      }
    });
  }

  const dayCustom = customBlocks.filter((b) => b.date === dateIso);
  return [...generated, ...dayCustom].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
}

export interface PositionedBlock extends ScheduleBlock {
  startMin: number;
  endMin: number;
  colIndex: number;
  totalCols: number;
  hasConflict: boolean;
}

export function layoutTimelineBlocks(blocks: ScheduleBlock[]): PositionedBlock[] {
  const sorted = [...blocks]
    .map((b) => ({
      ...b,
      startMin: timeToMinutes(b.startTime),
      endMin: Math.max(timeToMinutes(b.endTime), timeToMinutes(b.startTime) + 25),
    }))
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const positioned: PositionedBlock[] = [];
  let cluster: typeof sorted = [];
  let clusterEnd = -1;

  const flushCluster = (items: typeof sorted) => {
    if (items.length === 0) return;
    const columnsEnd: number[] = [];
    const assigned: { item: (typeof sorted)[number]; col: number }[] = [];

    for (const item of items) {
      let placedCol = -1;
      for (let c = 0; c < columnsEnd.length; c++) {
        if (columnsEnd[c] <= item.startMin) {
          placedCol = c;
          columnsEnd[c] = item.endMin;
          break;
        }
      }
      if (placedCol === -1) {
        placedCol = columnsEnd.length;
        columnsEnd.push(item.endMin);
      }
      assigned.push({ item, col: placedCol });
    }

    const totalCols = Math.max(1, columnsEnd.length);
    for (const { item, col } of assigned) {
      positioned.push({
        ...item,
        colIndex: col,
        totalCols,
        hasConflict: totalCols > 1,
      });
    }
  };

  for (const item of sorted) {
    if (cluster.length === 0 || item.startMin < clusterEnd) {
      cluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMin);
    } else {
      flushCluster(cluster);
      cluster = [item];
      clusterEnd = item.endMin;
    }
  }
  flushCluster(cluster);

  return positioned;
}

export function computeDailyGaps(
  blocks: ScheduleBlock[],
  windowStart = '08:00',
  windowEnd = '21:30',
  minGapMinutes = 45
): DayGap[] {
  const startBound = timeToMinutes(windowStart);
  const endBound = timeToMinutes(windowEnd);

  const intervals = blocks
    .map((b) => ({
      start: Math.max(startBound, timeToMinutes(b.startTime)),
      end: Math.min(endBound, timeToMinutes(b.endTime)),
    }))
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start - b.start);

  const merged: { start: number; end: number }[] = [];
  for (const iv of intervals) {
    if (merged.length === 0 || iv.start > merged[merged.length - 1].end) {
      merged.push({ ...iv });
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, iv.end);
    }
  }

  const gaps: DayGap[] = [];
  let cursor = startBound;

  for (const iv of merged) {
    if (iv.start - cursor >= minGapMinutes) {
      gaps.push({
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(iv.start),
        durationMinutes: iv.start - cursor,
      });
    }
    cursor = Math.max(cursor, iv.end);
  }

  if (endBound - cursor >= minGapMinutes) {
    gaps.push({
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(endBound),
      durationMinutes: endBound - cursor,
    });
  }

  return gaps;
}

export function getRelativeDueLabel(dueDate: string, todayIso: string): {
  label: string;
  tone: 'overdue' | 'urgent' | 'normal';
} {
  const due = parseISODate(dueDate).getTime();
  const today = parseISODate(todayIso).getTime();
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `${Math.abs(diffDays)}d overdue`, tone: 'overdue' };
  }
  if (diffDays === 0) {
    return { label: 'Due today', tone: 'urgent' };
  }
  if (diffDays === 1) {
    return { label: 'Due tomorrow', tone: 'urgent' };
  }
  return { label: `In ${diffDays} days`, tone: 'normal' };
}

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  lecture: 'Lecture',
  lab: 'Lab / Discussion',
  study: 'Study Block',
  exam: 'Exam / Quiz',
  club: 'Campus & Work',
  wellness: 'Break & Wellness',
};

export const ACCENT_STYLES: Record<
  CourseAccent,
  {
    surface: string;
    border: string;
    dot: string;
    text: string;
  }
> = {
  cobalt: {
    surface: 'bg-blue-50/80 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800/80',
    dot: 'bg-blue-600 dark:bg-blue-400',
    text: 'text-blue-700 dark:text-blue-300',
  },
  emerald: {
    surface: 'bg-emerald-50/80 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800/80',
    dot: 'bg-emerald-600 dark:bg-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  amber: {
    surface: 'bg-amber-50/80 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800/80',
    dot: 'bg-amber-600 dark:bg-amber-400',
    text: 'text-amber-700 dark:text-amber-300',
  },
  rose: {
    surface: 'bg-rose-50/80 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800/80',
    dot: 'bg-rose-600 dark:bg-rose-400',
    text: 'text-rose-700 dark:text-rose-300',
  },
  violet: {
    surface: 'bg-violet-50/80 dark:bg-violet-950/40',
    border: 'border-violet-200 dark:border-violet-800/80',
    dot: 'bg-violet-600 dark:bg-violet-400',
    text: 'text-violet-700 dark:text-violet-300',
  },
  slate: {
    surface: 'bg-slate-100/90 dark:bg-slate-800/60',
    border: 'border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-600 dark:bg-slate-400',
    text: 'text-slate-700 dark:text-slate-300',
  },
};

export function generateICSExport(blocks: ScheduleBlock[], filename: string): void {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Daybook//College Schedule//EN',
    'CALSCALE:GREGORIAN',
  ];

  for (const b of blocks) {
    const dateCompact = b.date.replace(/-/g, '');
    const startCompact = b.startTime.replace(/:/g, '') + '00';
    const endCompact = b.endTime.replace(/:/g, '') + '00';
    lines.push(
      'BEGIN:VEVENT',
      `UID:${b.id}@daybook.local`,
      `DTSTART:${dateCompact}T${startCompact}`,
      `DTEND:${dateCompact}T${endCompact}`,
      `SUMMARY:${b.title.replace(/,/g, '\\,')}`,
      b.location ? `LOCATION:${b.location.replace(/,/g, '\\,')}` : '',
      b.notes ? `DESCRIPTION:${b.notes.replace(/\n/g, '\\n')}` : '',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  const content = lines.filter(Boolean).join('\r\n');
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

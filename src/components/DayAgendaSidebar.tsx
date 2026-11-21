import React, { useMemo, useState } from 'react';
import { CalendarPlus, Check, Clock, Plus } from 'lucide-react';
import { Assignment, Course, DayGap } from '../types/schedule';
import {
  ACCENT_STYLES,
  formatDuration,
  formatShortDate,
  formatTime12h,
  getRelativeDueLabel,
} from '../utils/dateUtils';

interface DayAgendaSidebarProps {
  selectedDate: string;
  todayIso: string;
  gaps: DayGap[];
  courses: Course[];
  assignments: Assignment[];
  onFillGapWithStudy: (gap: DayGap) => void;
  onToggleAssignment: (id: string) => void;
  onQuickAddAssignment: (data: {
    title: string;
    courseId: string;
    dueDate: string;
    priority: 'high' | 'normal';
  }) => void;
  onOpenCoursesView: () => void;
}

export const DayAgendaSidebar: React.FC<DayAgendaSidebarProps> = ({
  selectedDate,
  todayIso,
  gaps,
  courses,
  assignments,
  onFillGapWithStudy,
  onToggleAssignment,
  onQuickAddAssignment,
  onOpenCoursesView,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCourseId, setQuickCourseId] = useState(courses[0]?.id ?? '');
  const [quickPriority, setQuickPriority] = useState<'high' | 'normal'>('normal');

  const courseMap = useMemo(() => {
    const map = new Map<string, Course>();
    for (const c of courses) map.set(c.id, c);
    return map;
  }, [courses]);

  const sortedUpcoming = useMemo(() => {
    return [...assignments]
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.dueDate.localeCompare(b.dueDate) || a.dueTime.localeCompare(b.dueTime);
      })
      .slice(0, 7);
  }, [assignments]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;
    onQuickAddAssignment({
      title: trimmed,
      courseId: quickCourseId || courses[0]?.id || '',
      dueDate: selectedDate,
      priority: quickPriority,
    });
    setQuickTitle('');
    setQuickPriority('normal');
  };

  return (
    <aside className="flex flex-col gap-6">
      {/* Open Study Windows */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
            Open Study Windows
          </h2>
          <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {gaps.length} open
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Gaps of 45+ minutes between scheduled blocks between 8:00 AM and 9:30 PM.
        </p>

        {gaps.length === 0 ? (
          <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            No open windows of 45 minutes or longer remain today.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
            {gaps.slice(0, 4).map((gap) => (
              <div
                key={`${gap.startTime}-${gap.endTime}`}
                className="flex items-center justify-between gap-3 py-3 first:pt-3 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="font-mono text-xs font-medium tabular-nums text-slate-900 dark:text-slate-100">
                    {formatTime12h(gap.startTime)} – {formatTime12h(gap.endTime)}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {formatDuration(gap.durationMinutes)} available
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onFillGapWithStudy(gap)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-300"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  <span>Book Study</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Deadlines & Quick Task */}
      <section className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
            Assignments & Deadlines
          </h2>
          <button
            type="button"
            onClick={onOpenCoursesView}
            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            View all
          </button>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleQuickSubmit} className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Add assignment or task..."
              aria-label="New assignment title"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              aria-label="Add task"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap shrink-0 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={quickCourseId}
              onChange={(e) => setQuickCourseId(e.target.value)}
              aria-label="Select course for quick task"
              className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {courses.length === 0 ? (
                <option value="">General</option>
              ) : (
                courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.title}
                  </option>
                ))
              )}
            </select>
            <button
              type="button"
              onClick={() =>
                setQuickPriority((p) => (p === 'high' ? 'normal' : 'high'))
              }
              className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                quickPriority === 'high'
                  ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {quickPriority === 'high' ? 'High Priority' : 'Normal'}
            </button>
          </div>
        </form>

        {/* Task List */}
        {sortedUpcoming.length === 0 ? (
          <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            No upcoming assignments logged. Add your next problem set or reading above.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
            {sortedUpcoming.map((item) => {
              const course = courseMap.get(item.courseId);
              const dueInfo = getRelativeDueLabel(item.dueDate, todayIso);
              const accent = course ? ACCENT_STYLES[course.accent] : ACCENT_STYLES.slate;

              return (
                <div key={item.id} className="flex items-start gap-2.5 py-3">
                  <button
                    type="button"
                    onClick={() => onToggleAssignment(item.id)}
                    aria-label={
                      item.completed
                        ? `Mark ${item.title} incomplete`
                        : `Mark ${item.title} complete`
                    }
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      item.completed
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 bg-white hover:border-blue-600 dark:border-slate-600 dark:bg-slate-800'
                    }`}
                  >
                    {item.completed && <Check className="h-3 w-3 stroke-[2.5]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-medium leading-snug ${
                        item.completed
                          ? 'text-slate-400 line-through dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {item.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {course && (
                        <>
                          <span className={`font-mono font-semibold ${accent.text}`}>
                            {course.code}
                          </span>
                          <span aria-hidden="true">·</span>
                        </>
                      )}
                      <span
                        className={
                          !item.completed && dueInfo.tone === 'overdue'
                            ? 'font-medium text-rose-600 dark:text-rose-400'
                            : !item.completed && dueInfo.tone === 'urgent'
                            ? 'font-medium text-amber-700 dark:text-amber-400'
                            : ''
                        }
                      >
                        {dueInfo.label} ({formatShortDate(item.dueDate)})
                      </span>
                      {item.priority === 'high' && !item.completed && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-amber-700 dark:text-amber-400">
                            Priority
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-0.5 font-mono tabular-nums">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDuration(item.estimatedMinutes)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </aside>
  );
};

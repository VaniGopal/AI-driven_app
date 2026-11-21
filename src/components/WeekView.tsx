import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Course, ScheduleBlock } from '../types/schedule';
import {
  ACCENT_STYLES,
  CATEGORY_LABELS,
  formatDuration,
  formatShortDate,
  formatTime12h,
  formatWeekdayShort,
  getBlocksForDate,
  getWeekDates,
  timeToMinutes,
} from '../utils/dateUtils';

interface WeekViewProps {
  selectedDate: string;
  todayIso: string;
  courses: Course[];
  customBlocks: ScheduleBlock[];
  skippedRecurringKeys: string[];
  completedRecurringKeys: string[];
  selectedCourseFilter: string | null;
  onSelectDay: (dateIso: string) => void;
  onAddBlockForDay: (dateIso: string) => void;
  onEditBlock: (block: ScheduleBlock) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  selectedDate,
  todayIso,
  courses,
  customBlocks,
  skippedRecurringKeys,
  completedRecurringKeys,
  selectedCourseFilter,
  onSelectDay,
  onAddBlockForDay,
  onEditBlock,
}) => {
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const courseMap = useMemo(() => {
    const map = new Map<string, Course>();
    for (const c of courses) map.set(c.id, c);
    return map;
  }, [courses]);

  const weekData = useMemo(() => {
    let classMin = 0;
    let studyMin = 0;
    let otherMin = 0;

    const days = weekDates.map((dateIso) => {
      const allBlocks = getBlocksForDate(
        dateIso,
        courses,
        customBlocks,
        skippedRecurringKeys,
        completedRecurringKeys
      );
      const visibleBlocks = selectedCourseFilter
        ? allBlocks.filter((b) => b.courseId === selectedCourseFilter)
        : allBlocks;

      let dayTotalMin = 0;
      for (const b of visibleBlocks) {
        const dur = Math.max(0, timeToMinutes(b.endTime) - timeToMinutes(b.startTime));
        dayTotalMin += dur;
        if (b.category === 'lecture' || b.category === 'lab' || b.category === 'exam') {
          classMin += dur;
        } else if (b.category === 'study') {
          studyMin += dur;
        } else {
          otherMin += dur;
        }
      }

      return {
        dateIso,
        blocks: visibleBlocks,
        totalMinutes: dayTotalMin,
      };
    });

    return { days, classMin, studyMin, otherMin };
  }, [
    weekDates,
    courses,
    customBlocks,
    skippedRecurringKeys,
    completedRecurringKeys,
    selectedCourseFilter,
  ]);

  return (
    <div className="space-y-6">
      {/* Weekly Hour Summary */}
      <div className="grid grid-cols-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Weekly Total</div>
          <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {formatDuration(weekData.classMin + weekData.studyMin + weekData.otherMin)}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Classes & Exams</div>
          <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {formatDuration(weekData.classMin)}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Dedicated Study</div>
          <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-blue-600 dark:text-blue-400">
            {formatDuration(weekData.studyMin)}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Campus & Wellness</div>
          <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {formatDuration(weekData.otherMin)}
          </div>
        </div>
      </div>

      {/* 7-Day Timetable Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        {weekData.days.map(({ dateIso, blocks, totalMinutes }) => {
          const isToday = dateIso === todayIso;
          const isSelected = dateIso === selectedDate;

          return (
            <div
              key={dateIso}
              className={`flex min-h-[360px] flex-col rounded-xl border bg-white dark:bg-slate-900 ${
                isToday
                  ? 'border-blue-400 dark:border-blue-600'
                  : isSelected
                  ? 'border-slate-400 dark:border-slate-600'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Day Column Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onSelectDay(dateIso)}
                  className="text-left transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                    <span>{formatWeekdayShort(dateIso)}</span>
                    {isToday && (
                      <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                        · Today
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                    {formatShortDate(dateIso)} · {formatDuration(totalMinutes)}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onAddBlockForDay(dateIso)}
                  aria-label={`Add block on ${formatShortDate(dateIso)}`}
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Day Blocks List */}
              <div className="flex-1 space-y-2 p-2.5">
                {blocks.length === 0 ? (
                  <div className="flex h-full min-h-[120px] items-center justify-center text-center">
                    <button
                      type="button"
                      onClick={() => onAddBlockForDay(dateIso)}
                      className="text-xs text-slate-400 transition-colors hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400"
                    >
                      Open day
                    </button>
                  </div>
                ) : (
                  blocks.map((block) => {
                    const course = block.courseId ? courseMap.get(block.courseId) : undefined;
                    const accent =
                      course?.accent ??
                      (block.category === 'exam'
                        ? 'rose'
                        : block.category === 'wellness'
                        ? 'emerald'
                        : 'slate');
                    const style = ACCENT_STYLES[accent];

                    return (
                      <button
                        key={block.id}
                        type="button"
                        onClick={() => onEditBlock(block)}
                        className={`w-full rounded-lg border px-2.5 py-2 text-left transition-colors hover:brightness-97 ${style.border} ${style.surface} ${
                          block.completed ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="font-mono text-[10px] font-medium tabular-nums text-slate-600 dark:text-slate-300">
                          {formatTime12h(block.startTime)} – {formatTime12h(block.endTime)}
                        </div>
                        <div
                          className={`mt-0.5 line-clamp-2 text-xs font-semibold leading-snug ${
                            block.completed
                              ? 'text-slate-500 line-through dark:text-slate-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {block.title}
                        </div>
                        <div className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {CATEGORY_LABELS[block.category]}
                          {block.location ? ` · ${block.location}` : ''}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

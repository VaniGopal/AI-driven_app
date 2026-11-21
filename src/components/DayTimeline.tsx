import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Edit3,
  Play,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { BlockCategory, Course, ScheduleBlock } from '../types/schedule';
import {
  ACCENT_STYLES,
  CATEGORY_LABELS,
  formatDuration,
  formatTime12h,
  layoutTimelineBlocks,
  minutesToTime,
  timeToMinutes,
} from '../utils/dateUtils';

interface DayTimelineProps {
  selectedDate: string;
  todayIso: string;
  blocks: ScheduleBlock[];
  courses: Course[];
  selectedCourseFilter: string | null;
  onToggleComplete: (block: ScheduleBlock) => void;
  onEditBlock: (block: ScheduleBlock) => void;
  onDeleteBlock: (block: ScheduleBlock) => void;
  onCreateAtTime: (startTime: string, endTime: string) => void;
  onStartFocus: (block: ScheduleBlock) => void;
}

const START_HOUR = 7;
const END_HOUR = 23;
const HOUR_HEIGHT = 68; // px per hour

type CategoryFilter = 'all' | 'classes' | 'study' | 'personal';

const matchesCategoryFilter = (cat: BlockCategory, filter: CategoryFilter) => {
  if (filter === 'all') return true;
  if (filter === 'classes') return cat === 'lecture' || cat === 'lab' || cat === 'exam';
  if (filter === 'study') return cat === 'study';
  return cat === 'club' || cat === 'wellness';
};

export const DayTimeline: React.FC<DayTimelineProps> = ({
  selectedDate,
  todayIso,
  blocks,
  courses,
  selectedCourseFilter,
  onToggleComplete,
  onEditBlock,
  onDeleteBlock,
  onCreateAtTime,
  onStartFocus,
}) => {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [nowMinutes, setNowMinutes] = useState<number>(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const courseMap = useMemo(() => {
    const map = new Map<string, Course>();
    for (const c of courses) map.set(c.id, c);
    return map;
  }, [courses]);

  const filteredBlocks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return blocks.filter((b) => {
      if (selectedCourseFilter && b.courseId !== selectedCourseFilter) return false;
      if (!matchesCategoryFilter(b.category, filter)) return false;
      if (q) {
        const course = b.courseId ? courseMap.get(b.courseId) : undefined;
        const haystack = `${b.title} ${b.location || ''} ${b.notes || ''} ${course?.code || ''} ${course?.title || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [blocks, selectedCourseFilter, filter, searchQuery, courseMap]);

  const positioned = useMemo(
    () => layoutTimelineBlocks(filteredBlocks),
    [filteredBlocks]
  );

  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i
  );

  const isToday = selectedDate === todayIso;
  const showNowLine =
    isToday && nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60;
  const nowTopPx = ((nowMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;

  const conflictCount = positioned.filter((b) => b.hasConflict).length;

  return (
    <section className="flex flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 dark:border-slate-800">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {(
            [
              { id: 'all', label: 'All Blocks' },
              { id: 'classes', label: 'Classes & Exams' },
              { id: 'study', label: 'Study' },
              { id: 'personal', label: 'Personal' },
            ] as { id: CategoryFilter; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {conflictCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Schedule overlap detected</span>
            </span>
          )}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter timeline..."
              aria-label="Filter timeline blocks"
              className="w-40 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none sm:w-48 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Empty Hint Banner when day has 0 blocks */}
      {positioned.length === 0 && (
        <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-800/40">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {blocks.length === 0
                ? 'No blocks scheduled for this day yet.'
                : 'No blocks match your current filter.'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Click any hour row below or add a study block to plan your day.
            </p>
          </div>
          {blocks.length === 0 ? (
            <button
              type="button"
              onClick={() => onCreateAtTime('09:00', '10:30')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Schedule First Block</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setFilter('all');
                setSearchQuery('');
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Hourly Grid */}
      <div className="relative overflow-x-auto px-3 py-4 sm:px-5">
        <div
          className="relative min-w-[460px]"
          style={{ height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px` }}
        >
          {/* Hour Lines & Clickable Slots */}
          {hours.slice(0, -1).map((hour) => {
            const top = (hour - START_HOUR) * HOUR_HEIGHT;
            const slotStart = `${String(hour).padStart(2, '0')}:00`;
            const slotEnd = `${String(hour + 1).padStart(2, '0')}:00`;
            const label =
              hour === 12
                ? '12 PM'
                : hour > 12
                ? `${hour - 12} PM`
                : `${hour} AM`;

            return (
              <div
                key={hour}
                style={{ top: `${top}px`, height: `${HOUR_HEIGHT}px` }}
                className="group absolute inset-x-0 flex items-start"
              >
                <div className="w-14 shrink-0 -translate-y-2 pr-3 text-right font-mono text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                  {label}
                </div>
                <button
                  type="button"
                  onClick={() => onCreateAtTime(slotStart, slotEnd)}
                  title={`Schedule block at ${formatTime12h(slotStart)}`}
                  className="relative h-full flex-1 border-t border-slate-100 text-left transition-colors hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-800/80 dark:hover:bg-blue-950/20"
                >
                  <span className="pointer-events-none absolute top-1.5 right-2 hidden items-center gap-1 text-[11px] font-medium text-blue-600 group-hover:inline-flex dark:text-blue-400">
                    <Plus className="h-3 w-3" />
                    <span>Add at {formatTime12h(slotStart)}</span>
                  </span>
                </button>
              </div>
            );
          })}

          {/* Final bottom line */}
          <div
            style={{ top: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px` }}
            className="absolute inset-x-0 flex items-start"
          >
            <div className="w-14 shrink-0 -translate-y-2 pr-3 text-right font-mono text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
              11 PM
            </div>
            <div className="flex-1 border-t border-slate-100 dark:border-slate-800/80" />
          </div>

          {/* Current Time Indicator */}
          {showNowLine && (
            <div
              style={{ top: `${nowTopPx}px` }}
              className="pointer-events-none absolute right-0 left-14 z-20 flex items-center"
            >
              <span className="-ml-12 mr-1.5 rounded bg-blue-600 px-1 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-white">
                {formatTime12h(minutesToTime(nowMinutes)).replace(' ', '')}
              </span>
              <div className="h-[1.5px] flex-1 bg-blue-600 dark:bg-blue-400" />
            </div>
          )}

          {/* Positioned Blocks */}
          <div className="pointer-events-none absolute inset-y-0 right-1 left-14">
            {positioned.map((block) => {
              const clampedStart = Math.max(block.startMin, START_HOUR * 60);
              const clampedEnd = Math.min(block.endMin, END_HOUR * 60);
              if (clampedEnd <= clampedStart) return null;

              const topPx = ((clampedStart - START_HOUR * 60) / 60) * HOUR_HEIGHT;
              const heightPx = Math.max(
                44,
                ((clampedEnd - clampedStart) / 60) * HOUR_HEIGHT - 3
              );

              const widthPct = 100 / block.totalCols;
              const leftPct = block.colIndex * widthPct;

              const course = block.courseId ? courseMap.get(block.courseId) : undefined;
              const accent = course?.accent ?? (block.category === 'exam' ? 'rose' : block.category === 'wellness' ? 'emerald' : 'slate');
              const style = ACCENT_STYLES[accent];
              const durationMin = Math.max(
                0,
                timeToMinutes(block.endTime) - timeToMinutes(block.startTime)
              );
              const isCompact = heightPx < 64;

              return (
                <div
                  key={block.id}
                  style={{
                    top: `${topPx + 1}px`,
                    height: `${heightPx}px`,
                    left: `calc(${leftPct}% + 4px)`,
                    width: `calc(${widthPct}% - 8px)`,
                  }}
                  className={`pointer-events-auto group absolute z-10 flex flex-col justify-between overflow-hidden rounded-lg border px-3 py-2 transition-colors ${
                    block.hasConflict
                      ? 'border-rose-300 bg-rose-50/90 dark:border-rose-700 dark:bg-rose-950/50'
                      : `${style.border} ${style.surface}`
                  } ${block.completed ? 'opacity-65' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(block);
                          }}
                          aria-label={
                            block.completed
                              ? `Mark ${block.title} incomplete`
                              : `Mark ${block.title} complete`
                          }
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                            block.completed
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-400 bg-white hover:border-blue-600 dark:border-slate-500 dark:bg-slate-900'
                          }`}
                        >
                          {block.completed && <Check className="h-3 w-3 stroke-[2.5]" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditBlock(block)}
                          className={`truncate text-left text-xs font-semibold sm:text-sm ${
                            block.completed
                              ? 'text-slate-500 line-through dark:text-slate-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {block.title}
                        </button>
                      </div>

                      {!isCompact && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-6 text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-mono text-[11px] tabular-nums">
                            {formatTime12h(block.startTime)} – {formatTime12h(block.endTime)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{CATEGORY_LABELS[block.category]}</span>
                          {block.location && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{block.location}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-[11px] tabular-nums">
                            {formatDuration(durationMin)}
                          </span>
                          {block.hasConflict && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 font-medium text-rose-700 dark:text-rose-300">
                                <AlertTriangle className="h-3 w-3" />
                                Overlap
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick Block Actions */}
                    <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => onStartFocus(block)}
                        title="Start Focus Timer for this block"
                        aria-label={`Start Focus Timer for ${block.title}`}
                        className="rounded p-1 text-slate-600 hover:bg-white/80 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditBlock(block)}
                        title="Edit block"
                        aria-label={`Edit ${block.title}`}
                        className="rounded p-1 text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBlock(block)}
                        title={block.isRecurringCourse ? 'Skip this session today' : 'Delete block'}
                        aria-label={`Delete ${block.title}`}
                        className="rounded p-1 text-slate-600 hover:bg-white/80 hover:text-rose-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

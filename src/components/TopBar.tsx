import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Menu,
  Plus,
} from 'lucide-react';
import { ActiveView } from '../types/schedule';
import { formatDisplayDate, formatShortDate, getWeekDates } from '../utils/dateUtils';

interface TopBarProps {
  activeView: ActiveView;
  termName: string;
  selectedDate: string;
  todayIso: string;
  onNavigateDate: (deltaDays: number) => void;
  onJumpToday: () => void;
  onOpenAddBlock: () => void;
  onExportICS: () => void;
  onOpenMobileMenu: () => void;
}

const VIEW_TITLES: Record<ActiveView, string> = {
  today: "Today's Schedule",
  week: 'Week Overview',
  courses: 'Courses & Deadlines',
  focus: 'Focus Timer',
};

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  termName,
  selectedDate,
  todayIso,
  onNavigateDate,
  onJumpToday,
  onOpenAddBlock,
  onExportICS,
  onOpenMobileMenu,
}) => {
  const weekDates = getWeekDates(selectedDate);
  const weekLabel = `${formatShortDate(weekDates[0])} – ${formatShortDate(weekDates[6])}`;
  const isToday = selectedDate === todayIso;

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
      {/* Left: Mobile Trigger + Contextual Breadcrumb + Date Controls */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{termName}</span>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {VIEW_TITLES[activeView]}
            </span>
          </div>

          {(activeView === 'today' || activeView === 'week') && (
            <div className="mt-0.5 flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-base font-semibold tracking-tight text-slate-900 sm:text-lg dark:text-white">
                {activeView === 'today' ? formatDisplayDate(selectedDate) : `Week of ${weekLabel}`}
              </h1>

              <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => onNavigateDate(activeView === 'week' ? -7 : -1)}
                  aria-label={activeView === 'week' ? 'Previous week' : 'Previous day'}
                  className="rounded p-1 text-slate-600 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onJumpToday}
                  disabled={isToday}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    isToday
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-700 hover:bg-white hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateDate(activeView === 'week' ? 7 : 1)}
                  aria-label={activeView === 'week' ? 'Next week' : 'Next day'}
                  className="rounded p-1 text-slate-600 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {(activeView === 'courses' || activeView === 'focus') && (
            <h1 className="mt-0.5 font-display text-base font-semibold tracking-tight text-slate-900 sm:text-lg dark:text-white">
              {VIEW_TITLES[activeView]}
            </h1>
          )}
        </div>
      </div>

      {/* Right: Primary Actions */}
      <div className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onExportICS}
          title="Download schedule as .ics calendar file"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export .ics</span>
        </button>

        <button
          type="button"
          onClick={onOpenAddBlock}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Block</span>
        </button>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  Clock,
  LayoutGrid,
  Moon,
  Plus,
  RotateCcw,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { ActiveView, Course } from '../types/schedule';
import { ACCENT_STYLES } from '../utils/dateUtils';

interface SidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  termName: string;
  onUpdateTermName: (name: string) => void;
  courses: Course[];
  selectedCourseFilter: string | null;
  onToggleCourseFilter: (courseId: string | null) => void;
  onAddCourse: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onResetDemo: () => void;
  onClearAll: () => void;
  activeFocusSecondsLeft: number | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  termName,
  onUpdateTermName,
  courses,
  selectedCourseFilter,
  onToggleCourseFilter,
  onAddCourse,
  isDark,
  onToggleTheme,
  onResetDemo,
  onClearAll,
  activeFocusSecondsLeft,
  mobileOpen,
  onCloseMobile,
}) => {
  const [editingTerm, setEditingTerm] = useState(false);
  const [termDraft, setTermDraft] = useState(termName);
  const [confirmMode, setConfirmMode] = useState<'none' | 'reset' | 'clear'>('none');

  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: "Today's Schedule", icon: <CalendarDays className="h-4 w-4" /> },
    { id: 'week', label: 'Week Overview', icon: <LayoutGrid className="h-4 w-4" /> },
    { id: 'courses', label: 'Courses & Deadlines', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'focus', label: 'Focus Timer', icon: <Clock className="h-4 w-4" /> },
  ];

  const handleTermSave = () => {
    const trimmed = termDraft.trim();
    if (trimmed) onUpdateTermName(trimmed);
    else setTermDraft(termName);
    setEditingTerm(false);
  };

  const formatTimerMini = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white px-4 py-5 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="space-y-6">
        {/* Brand & Term */}
        <div className="flex items-center justify-between px-2">
          <div>
            <div className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Daybook
            </div>
            {editingTerm ? (
              <input
                type="text"
                value={termDraft}
                onChange={(e) => setTermDraft(e.target.value)}
                onBlur={handleTermSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTermSave();
                  if (e.key === 'Escape') {
                    setTermDraft(termName);
                    setEditingTerm(false);
                  }
                }}
                autoFocus
                aria-label="Academic term name"
                className="mt-0.5 w-32 rounded border border-blue-500 bg-white px-1.5 py-0.5 text-xs text-slate-900 outline-none dark:bg-slate-800 dark:text-slate-100"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTermDraft(termName);
                  setEditingTerm(true);
                }}
                title="Click to rename academic term"
                className="mt-0.5 text-left text-xs text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {termName} · {totalCredits} Credits
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Primary workspace navigation" className="space-y-1">
          {navItems.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.id === 'focus' && activeFocusSecondsLeft !== null && (
                  <span className="font-mono text-xs font-medium tabular-nums text-blue-700 dark:text-blue-300">
                    {formatTimerMini(activeFocusSecondsLeft)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Course Roster Filter */}
        <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
          <div className="mb-2.5 flex items-center justify-between px-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Enrolled Courses
            </span>
            <button
              type="button"
              onClick={onAddCourse}
              aria-label="Add new course"
              className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </div>

          {courses.length === 0 ? (
            <p className="px-2 text-xs text-slate-500 dark:text-slate-400">
              No courses added yet.
            </p>
          ) : (
            <div className="space-y-1">
              {selectedCourseFilter && (
                <button
                  type="button"
                  onClick={() => onToggleCourseFilter(null)}
                  className="mb-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                >
                  <span>Show all courses</span>
                  <X className="h-3 w-3" />
                </button>
              )}
              {courses.map((course) => {
                const isSelected = selectedCourseFilter === course.id;
                const style = ACCENT_STYLES[course.accent];
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() =>
                      onToggleCourseFilter(isSelected ? null : course.id)
                    }
                    className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-colors ${
                      isSelected
                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-sm ${style.dot}`}
                        aria-hidden="true"
                      />
                      <span className="truncate text-xs font-medium">
                        <span className="font-mono font-semibold">{course.code}</span>{' '}
                        <span className="text-slate-500 dark:text-slate-400">
                          {course.title}
                        </span>
                      </span>
                    </span>
                    <span className="ml-2 shrink-0 font-mono text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                      {course.credits}cr
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Workspace Controls */}
      <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <span className="flex items-center gap-2">
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            <span>{isDark ? 'Light Appearance' : 'Dark Appearance'}</span>
          </span>
        </button>

        {confirmMode === 'none' ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setConfirmMode('reset')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Demo Data</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmMode('clear')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/70">
            <p className="mb-2 text-xs text-slate-700 dark:text-slate-300">
              {confirmMode === 'reset'
                ? 'Restore sample semester data?'
                : 'Delete all courses and blocks?'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirmMode === 'reset') onResetDemo();
                  else onClearAll();
                  setConfirmMode('none');
                }}
                className="flex-1 rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmMode('none')}
                className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-[260px] shrink-0 border-r border-slate-200 lg:block dark:border-slate-800">
        <div className="sticky top-0 h-screen overflow-y-auto">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 h-full w-[270px] border-r border-slate-200 dark:border-slate-800">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

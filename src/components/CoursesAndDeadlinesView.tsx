import React, { useMemo, useState } from 'react';
import {
  CalendarPlus,
  Check,
  Edit3,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Assignment, Course, Weekday } from '../types/schedule';
import {
  ACCENT_STYLES,
  formatDuration,
  formatShortDate,
  formatTime12h,
  getRelativeDueLabel,
} from '../utils/dateUtils';

interface CoursesAndDeadlinesViewProps {
  todayIso: string;
  courses: Course[];
  assignments: Assignment[];
  onAddCourse: () => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onAddAssignment: () => void;
  onEditAssignment: (assignment: Assignment) => void;
  onToggleAssignment: (assignmentId: string) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onScheduleStudyForAssignment: (assignment: Assignment) => void;
}

const WEEKDAY_NAMES: Record<Weekday, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

const KIND_LABELS: Record<Assignment['kind'], string> = {
  assignment: 'Assignment',
  exam: 'Exam / Quiz',
  reading: 'Reading',
  project: 'Project / Lab',
};

export const CoursesAndDeadlinesView: React.FC<CoursesAndDeadlinesViewProps> = ({
  todayIso,
  courses,
  assignments,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  onAddAssignment,
  onEditAssignment,
  onToggleAssignment,
  onDeleteAssignment,
  onScheduleStudyForAssignment,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const courseMap = useMemo(() => {
    const map = new Map<string, Course>();
    for (const c of courses) map.set(c.id, c);
    return map;
  }, [courses]);

  const filteredAssignments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...assignments]
      .filter((a) => {
        if (statusFilter === 'pending' && a.completed) return false;
        if (statusFilter === 'completed' && !a.completed) return false;
        if (courseFilter !== 'all' && a.courseId !== courseFilter) return false;
        if (q) {
          const course = courseMap.get(a.courseId);
          const hay = `${a.title} ${course?.code || ''} ${course?.title || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.dueTime.localeCompare(b.dueTime));
  }, [assignments, statusFilter, courseFilter, search, courseMap]);

  return (
    <div className="space-y-8">
      {/* Enrolled Courses Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Semester Course Schedule
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Recurring lectures and labs automatically populate your Daily and Weekly timelines.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddCourse}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Course</span>
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              No courses enrolled for this term yet.
            </p>
            <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
              Add your classes with their weekly meeting days and rooms to auto-generate your semester timetable.
            </p>
            <button
              type="button"
              onClick={onAddCourse}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add First Course</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {courses.map((course) => {
              const style = ACCENT_STYLES[course.accent];
              return (
                <div
                  key={course.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-sm ${style.dot}`}
                            aria-hidden="true"
                          />
                          <span className="font-mono font-semibold text-slate-900 dark:text-white">
                            {course.code}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{course.credits} Credits</span>
                          {course.instructor && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{course.instructor}</span>
                            </>
                          )}
                        </div>
                        <h3 className="mt-1.5 font-display text-base font-semibold text-slate-900 dark:text-white">
                          {course.title}
                        </h3>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditCourse(course)}
                          aria-label={`Edit ${course.code}`}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCourse(course.id)}
                          aria-label={`Delete ${course.code}`}
                          className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                      {course.meetings.length === 0 ? (
                        <p className="text-xs text-slate-400">No weekly class times set.</p>
                      ) : (
                        course.meetings.map((m, idx) => (
                          <div
                            key={idx}
                            className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300"
                          >
                            <span className="font-medium">
                              {m.kind === 'lab' ? 'Lab' : 'Lecture'} ·{' '}
                              {m.days.map((d) => WEEKDAY_NAMES[d]).join('/')}
                            </span>
                            <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                              {formatTime12h(m.startTime)} – {formatTime12h(m.endTime)}
                              {m.location ? ` · ${m.location}` : ''}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Assignments & Exams Table */}
      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Assignments, Labs & Exams
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Track due dates, effort estimates, and book study sessions directly onto your schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddAssignment}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Deadline</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {(
                [
                  { id: 'pending', label: 'Upcoming' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'all', label: 'All' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    statusFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              aria-label="Filter assignments by course"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assignments..."
              aria-label="Search assignments"
              className="w-48 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* High-Density Data Table */}
        {filteredAssignments.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No assignments match this filter.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Try switching filters or add a new assignment or exam.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="w-10 px-4 py-2.5 font-medium">Done</th>
                  <th className="px-3 py-2.5 font-medium">Title</th>
                  <th className="px-3 py-2.5 font-medium">Course</th>
                  <th className="px-3 py-2.5 font-medium">Type</th>
                  <th className="px-3 py-2.5 font-medium">Due</th>
                  <th className="px-3 py-2.5 text-right font-medium">Est. Effort</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAssignments.map((item) => {
                  const course = courseMap.get(item.courseId);
                  const dueInfo = getRelativeDueLabel(item.dueDate, todayIso);
                  const accent = course ? ACCENT_STYLES[course.accent] : ACCENT_STYLES.slate;

                  return (
                    <tr
                      key={item.id}
                      className="h-11 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => onToggleAssignment(item.id)}
                          aria-label={`Toggle ${item.title}`}
                          className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                            item.completed
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 bg-white hover:border-blue-600 dark:border-slate-600 dark:bg-slate-800'
                          }`}
                        >
                          {item.completed && <Check className="h-3 w-3 stroke-[2.5]" />}
                        </button>
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                        <span className={item.completed ? 'text-slate-400 line-through' : ''}>
                          {item.title}
                        </span>
                        {item.priority === 'high' && !item.completed && (
                          <span className="ml-2 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                            · High Priority
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {course ? (
                          <span className={`font-mono font-semibold ${accent.text}`}>
                            {course.code}
                          </span>
                        ) : (
                          <span className="text-slate-400">General</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap dark:text-slate-300">
                        {KIND_LABELS[item.kind]}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={
                            !item.completed && dueInfo.tone === 'overdue'
                              ? 'font-medium text-rose-600 dark:text-rose-400'
                              : !item.completed && dueInfo.tone === 'urgent'
                              ? 'font-medium text-amber-700 dark:text-amber-400'
                              : 'text-slate-600 dark:text-slate-300'
                          }
                        >
                          {formatShortDate(item.dueDate)} · {formatTime12h(item.dueTime)}
                        </span>
                        <span className="ml-1.5 text-slate-400">({dueInfo.label})</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {formatDuration(item.estimatedMinutes)}
                      </td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onScheduleStudyForAssignment(item)}
                            title="Schedule study block for this assignment"
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                          >
                            <CalendarPlus className="h-3.5 w-3.5" />
                            <span>Study</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditAssignment(item)}
                            aria-label={`Edit ${item.title}`}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteAssignment(item.id)}
                            aria-label={`Delete ${item.title}`}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

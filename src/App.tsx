import React, { useEffect, useMemo, useState } from 'react';
import { AssignmentModal } from './components/AssignmentModal';
import { BlockModal } from './components/BlockModal';
import { CourseModal } from './components/CourseModal';
import { CoursesAndDeadlinesView } from './components/CoursesAndDeadlinesView';
import { DayAgendaSidebar } from './components/DayAgendaSidebar';
import { DayTimeline } from './components/DayTimeline';
import { FocusTimerView } from './components/FocusTimerView';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { WeekView } from './components/WeekView';
import { createEmptyState, createSeedState } from './data/seedData';
import {
  ActiveView,
  AppDataState,
  Assignment,
  Course,
  DayGap,
  ScheduleBlock,
} from './types/schedule';
import {
  addDays,
  computeDailyGaps,
  formatDuration,
  generateICSExport,
  getBlocksForDate,
  getWeekDates,
  minutesToTime,
  timeToMinutes,
  toISODate,
} from './utils/dateUtils';

const STORAGE_KEY = 'daybook_schedule_v1';
const THEME_KEY = 'daybook_theme_v1';

function loadInitialData(): AppDataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppDataState>;
      if (parsed && Array.isArray(parsed.courses) && Array.isArray(parsed.blocks)) {
        return {
          termName: parsed.termName || 'Fall 2026',
          courses: parsed.courses,
          blocks: parsed.blocks,
          assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
          skippedRecurringKeys: Array.isArray(parsed.skippedRecurringKeys)
            ? parsed.skippedRecurringKeys
            : [],
          completedRecurringKeys: Array.isArray(parsed.completedRecurringKeys)
            ? parsed.completedRecurringKeys
            : [],
          focusLogs: Array.isArray(parsed.focusLogs) ? parsed.focusLogs : [],
        };
      }
    }
  } catch {
    // Fallback to seed state if storage is unreadable
  }
  return createSeedState();
}

export default function App() {
  const todayIso = useMemo(() => toISODate(new Date()), []);
  const [data, setData] = useState<AppDataState>(loadInitialData);
  const [activeView, setActiveView] = useState<ActiveView>('today');
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark';
    } catch {
      return false;
    }
  });

  // Modal states
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Partial<ScheduleBlock> | null>(null);

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Focus Timer state (runs smoothly across view switches)
  const [focusDurationMin, setFocusDurationMin] = useState(25);
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusCourseId, setFocusCourseId] = useState('');
  const [focusLabel, setFocusLabel] = useState('Deep Study Session');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage quota errors
    }
  }, [data]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  // Focus timer tick
  useEffect(() => {
    if (!focusRunning) return;
    const id = window.setInterval(() => {
      setFocusSecondsLeft((prev) => {
        if (prev <= 1) {
          setFocusRunning(false);
          const loggedMinutes = focusDurationMin;
          setData((curr) => ({
            ...curr,
            focusLogs: [
              {
                id: `fl_${Date.now()}`,
                date: todayIso,
                minutes: loggedMinutes,
                courseId: focusCourseId || undefined,
                label: focusLabel.trim() || 'Study Session',
                timestamp: new Date().toISOString(),
              },
              ...curr.focusLogs,
            ],
          }));
          return focusDurationMin * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [focusRunning, focusDurationMin, focusCourseId, focusLabel, todayIso]);

  const dayBlocks = useMemo(
    () =>
      getBlocksForDate(
        selectedDate,
        data.courses,
        data.blocks,
        data.skippedRecurringKeys,
        data.completedRecurringKeys
      ),
    [
      selectedDate,
      data.courses,
      data.blocks,
      data.skippedRecurringKeys,
      data.completedRecurringKeys,
    ]
  );

  const dayGaps = useMemo(() => computeDailyGaps(dayBlocks), [dayBlocks]);

  const dayScheduledMin = useMemo(
    () =>
      dayBlocks.reduce(
        (sum, b) => sum + Math.max(0, timeToMinutes(b.endTime) - timeToMinutes(b.startTime)),
        0
      ),
    [dayBlocks]
  );

  const dayFreeMin = useMemo(
    () => dayGaps.reduce((sum, g) => sum + g.durationMinutes, 0),
    [dayGaps]
  );

  const pendingAssignments = useMemo(
    () => data.assignments.filter((a) => !a.completed),
    [data.assignments]
  );

  const dueSoonCount = useMemo(() => {
    const tomorrow = addDays(todayIso, 1);
    return pendingAssignments.filter((a) => a.dueDate <= tomorrow).length;
  }, [pendingAssignments, todayIso]);

  const todayFocusMin = useMemo(
    () =>
      data.focusLogs
        .filter((l) => l.date === todayIso)
        .reduce((sum, l) => sum + l.minutes, 0),
    [data.focusLogs, todayIso]
  );

  // Handlers
  const handleToggleBlockComplete = (block: ScheduleBlock) => {
    if (block.isRecurringCourse && block.recurringKey) {
      const key = block.recurringKey;
      setData((prev) => {
        const exists = prev.completedRecurringKeys.includes(key);
        return {
          ...prev,
          completedRecurringKeys: exists
            ? prev.completedRecurringKeys.filter((k) => k !== key)
            : [...prev.completedRecurringKeys, key],
        };
      });
      return;
    }
    setData((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === block.id ? { ...b, completed: !b.completed } : b
      ),
    }));
  };

  const handleDeleteBlock = (block: ScheduleBlock) => {
    if (block.isRecurringCourse && block.recurringKey) {
      const key = block.recurringKey;
      setData((prev) => ({
        ...prev,
        skippedRecurringKeys: [...prev.skippedRecurringKeys, key],
      }));
      return;
    }
    setData((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== block.id),
    }));
  };

  const handleSaveBlock = (blockData: Omit<ScheduleBlock, 'id'> & { id?: string }) => {
    setData((prev) => {
      // Editing an auto-generated recurring class converts that single date into a custom override
      if (blockData.isRecurringCourse && blockData.recurringKey) {
        const newBlock: ScheduleBlock = {
          id: `b_${Date.now()}`,
          title: blockData.title,
          date: blockData.date,
          startTime: blockData.startTime,
          endTime: blockData.endTime,
          category: blockData.category,
          courseId: blockData.courseId,
          location: blockData.location,
          notes: blockData.notes,
          completed: blockData.completed,
        };
        return {
          ...prev,
          skippedRecurringKeys: [...prev.skippedRecurringKeys, blockData.recurringKey],
          blocks: [...prev.blocks, newBlock],
        };
      }

      if (blockData.id) {
        return {
          ...prev,
          blocks: prev.blocks.map((b) =>
            b.id === blockData.id ? { ...b, ...blockData, id: b.id } : b
          ),
        };
      }

      const created: ScheduleBlock = {
        ...blockData,
        id: `b_${Date.now()}`,
      };
      return {
        ...prev,
        blocks: [...prev.blocks, created],
      };
    });
    setBlockModalOpen(false);
    setEditingBlock(null);
  };

  const handleSaveCourse = (courseData: Omit<Course, 'id'> & { id?: string }) => {
    setData((prev) => {
      if (courseData.id) {
        return {
          ...prev,
          courses: prev.courses.map((c) =>
            c.id === courseData.id ? { ...courseData, id: c.id } : c
          ),
        };
      }
      const created: Course = {
        ...courseData,
        id: `c_${Date.now()}`,
      };
      return {
        ...prev,
        courses: [...prev.courses, created],
      };
    });
    setCourseModalOpen(false);
    setEditingCourse(null);
  };

  const handleDeleteCourse = (courseId: string) => {
    setData((prev) => ({
      ...prev,
      courses: prev.courses.filter((c) => c.id !== courseId),
      blocks: prev.blocks.filter((b) => b.courseId !== courseId),
      assignments: prev.assignments.filter((a) => a.courseId !== courseId),
    }));
    if (selectedCourseFilter === courseId) setSelectedCourseFilter(null);
  };

  const handleToggleAssignment = (id: string) => {
    setData((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) =>
        a.id === id ? { ...a, completed: !a.completed } : a
      ),
    }));
  };

  const handleQuickAddAssignment = (input: {
    title: string;
    courseId: string;
    dueDate: string;
    priority: 'high' | 'normal';
  }) => {
    const created: Assignment = {
      id: `a_${Date.now()}`,
      title: input.title,
      courseId: input.courseId,
      dueDate: input.dueDate,
      dueTime: '23:59',
      kind: 'assignment',
      priority: input.priority,
      estimatedMinutes: 60,
      completed: false,
    };
    setData((prev) => ({
      ...prev,
      assignments: [...prev.assignments, created],
    }));
  };

  const handleSaveAssignment = (
    input: Omit<Assignment, 'id'> & { id?: string }
  ) => {
    setData((prev) => {
      if (input.id) {
        return {
          ...prev,
          assignments: prev.assignments.map((a) =>
            a.id === input.id ? { ...a, ...input, id: a.id } : a
          ),
        };
      }
      const created: Assignment = {
        ...input,
        id: `a_${Date.now()}`,
      };
      return {
        ...prev,
        assignments: [...prev.assignments, created],
      };
    });
    setAssignmentModalOpen(false);
    setEditingAssignment(null);
  };

  const handleDeleteAssignment = (id: string) => {
    setData((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((a) => a.id !== id),
    }));
  };

  const handleFillGapWithStudy = (gap: DayGap) => {
    const startMin = timeToMinutes(gap.startTime);
    const targetDur = Math.min(gap.durationMinutes, 90);
    setEditingBlock({
      title: 'Focused Study Block',
      date: selectedDate,
      startTime: gap.startTime,
      endTime: minutesToTime(startMin + targetDur),
      category: 'study',
      courseId: selectedCourseFilter || data.courses[0]?.id || '',
      location: 'Library',
    });
    setBlockModalOpen(true);
  };

  const handleScheduleStudyForAssignment = (assignment: Assignment) => {
    const firstGap = dayGaps[0];
    const startTime = firstGap ? firstGap.startTime : '16:00';
    const startMin = timeToMinutes(startTime);
    const dur = Math.min(assignment.estimatedMinutes, firstGap ? firstGap.durationMinutes : 90);
    setEditingBlock({
      title: `Work on: ${assignment.title}`,
      date: selectedDate,
      startTime,
      endTime: minutesToTime(startMin + Math.max(30, dur)),
      category: 'study',
      courseId: assignment.courseId,
      location: 'Study Desk',
    });
    setBlockModalOpen(true);
  };

  const handleStartFocusFromBlock = (block: ScheduleBlock) => {
    setFocusCourseId(block.courseId ?? '');
    setFocusLabel(block.title);
    setFocusDurationMin(25);
    setFocusSecondsLeft(25 * 60);
    setFocusRunning(true);
    setActiveView('focus');
  };

  const handleExportICS = () => {
    const weekDates = getWeekDates(selectedDate);
    const allWeekBlocks = weekDates.flatMap((d) =>
      getBlocksForDate(
        d,
        data.courses,
        data.blocks,
        data.skippedRecurringKeys,
        data.completedRecurringKeys
      )
    );
    generateICSExport(allWeekBlocks, `daybook-${weekDates[0]}.ics`);
  };

  const handleCompleteFocusNow = () => {
    const totalSec = focusDurationMin * 60;
    const elapsedMin = Math.max(1, Math.round((totalSec - focusSecondsLeft) / 60));
    setData((prev) => ({
      ...prev,
      focusLogs: [
        {
          id: `fl_${Date.now()}`,
          date: todayIso,
          minutes: elapsedMin,
          courseId: focusCourseId || undefined,
          label: focusLabel.trim() || 'Study Session',
          timestamp: new Date().toISOString(),
        },
        ...prev.focusLogs,
      ],
    }));
    setFocusRunning(false);
    setFocusSecondsLeft(focusDurationMin * 60);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        termName={data.termName}
        onUpdateTermName={(termName) => setData((p) => ({ ...p, termName }))}
        courses={data.courses}
        selectedCourseFilter={selectedCourseFilter}
        onToggleCourseFilter={setSelectedCourseFilter}
        onAddCourse={() => {
          setEditingCourse(null);
          setCourseModalOpen(true);
        }}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onResetDemo={() => {
          setData(createSeedState());
          setSelectedCourseFilter(null);
          setSelectedDate(todayIso);
        }}
        onClearAll={() => {
          setData(createEmptyState());
          setSelectedCourseFilter(null);
        }}
        activeFocusSecondsLeft={
          focusRunning || focusSecondsLeft < focusDurationMin * 60
            ? focusSecondsLeft
            : null
        }
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          activeView={activeView}
          termName={data.termName}
          selectedDate={selectedDate}
          todayIso={todayIso}
          onNavigateDate={(delta) => setSelectedDate((d) => addDays(d, delta))}
          onJumpToday={() => setSelectedDate(todayIso)}
          onOpenAddBlock={() => {
            setEditingBlock({
              date: selectedDate,
              startTime: '14:00',
              endTime: '15:30',
              category: 'study',
              courseId: selectedCourseFilter || '',
            });
            setBlockModalOpen(true);
          }}
          onExportICS={handleExportICS}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 sm:px-6">
          {activeView === 'today' && (
            <div className="space-y-6">
              {/* Daily Summary Strip */}
              <div className="grid grid-cols-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                <div className="p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Scheduled Today
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
                      {formatDuration(dayScheduledMin)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      · {dayBlocks.length} {dayBlocks.length === 1 ? 'block' : 'blocks'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Open Study Windows
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-xl font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                      {formatDuration(dayFreeMin)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      · {dayGaps.length} {dayGaps.length === 1 ? 'gap' : 'gaps'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Pending Deadlines
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
                      {pendingAssignments.length}
                    </span>
                    <span
                      className={`text-xs ${
                        dueSoonCount > 0
                          ? 'font-medium text-amber-700 dark:text-amber-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      · {dueSoonCount} due soon
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Focus Logged Today
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatDuration(todayFocusMin)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveView('focus')}
                      className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Open timer
                    </button>
                  </div>
                </div>
              </div>

              {/* Main 2-Column Workspace */}
              <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-12">
                <div className="xl:col-span-8">
                  <DayTimeline
                    selectedDate={selectedDate}
                    todayIso={todayIso}
                    blocks={dayBlocks}
                    courses={data.courses}
                    selectedCourseFilter={selectedCourseFilter}
                    onToggleComplete={handleToggleBlockComplete}
                    onEditBlock={(block) => {
                      setEditingBlock(block);
                      setBlockModalOpen(true);
                    }}
                    onDeleteBlock={handleDeleteBlock}
                    onCreateAtTime={(startTime, endTime) => {
                      setEditingBlock({
                        date: selectedDate,
                        startTime,
                        endTime,
                        category: 'study',
                        courseId: selectedCourseFilter || '',
                      });
                      setBlockModalOpen(true);
                    }}
                    onStartFocus={handleStartFocusFromBlock}
                  />
                </div>

                <div className="xl:col-span-4">
                  <DayAgendaSidebar
                    selectedDate={selectedDate}
                    todayIso={todayIso}
                    gaps={dayGaps}
                    courses={data.courses}
                    assignments={data.assignments}
                    onFillGapWithStudy={handleFillGapWithStudy}
                    onToggleAssignment={handleToggleAssignment}
                    onQuickAddAssignment={handleQuickAddAssignment}
                    onOpenCoursesView={() => setActiveView('courses')}
                  />
                </div>
              </div>
            </div>
          )}

          {activeView === 'week' && (
            <WeekView
              selectedDate={selectedDate}
              todayIso={todayIso}
              courses={data.courses}
              customBlocks={data.blocks}
              skippedRecurringKeys={data.skippedRecurringKeys}
              completedRecurringKeys={data.completedRecurringKeys}
              selectedCourseFilter={selectedCourseFilter}
              onSelectDay={(dateIso) => {
                setSelectedDate(dateIso);
                setActiveView('today');
              }}
              onAddBlockForDay={(dateIso) => {
                setEditingBlock({
                  date: dateIso,
                  startTime: '14:00',
                  endTime: '15:30',
                  category: 'study',
                  courseId: selectedCourseFilter || '',
                });
                setBlockModalOpen(true);
              }}
              onEditBlock={(block) => {
                setEditingBlock(block);
                setBlockModalOpen(true);
              }}
            />
          )}

          {activeView === 'courses' && (
            <CoursesAndDeadlinesView
              todayIso={todayIso}
              courses={data.courses}
              assignments={data.assignments}
              onAddCourse={() => {
                setEditingCourse(null);
                setCourseModalOpen(true);
              }}
              onEditCourse={(course) => {
                setEditingCourse(course);
                setCourseModalOpen(true);
              }}
              onDeleteCourse={handleDeleteCourse}
              onAddAssignment={() => {
                setEditingAssignment(null);
                setAssignmentModalOpen(true);
              }}
              onEditAssignment={(a) => {
                setEditingAssignment(a);
                setAssignmentModalOpen(true);
              }}
              onToggleAssignment={handleToggleAssignment}
              onDeleteAssignment={handleDeleteAssignment}
              onScheduleStudyForAssignment={handleScheduleStudyForAssignment}
            />
          )}

          {activeView === 'focus' && (
            <FocusTimerView
              todayIso={todayIso}
              courses={data.courses}
              focusLogs={data.focusLogs}
              durationMinutes={focusDurationMin}
              secondsLeft={focusSecondsLeft}
              isRunning={focusRunning}
              linkedCourseId={focusCourseId}
              sessionLabel={focusLabel}
              onChangeDuration={(m) => {
                setFocusRunning(false);
                setFocusDurationMin(m);
                setFocusSecondsLeft(m * 60);
              }}
              onChangeCourse={setFocusCourseId}
              onChangeLabel={setFocusLabel}
              onToggleRun={() => setFocusRunning((r) => !r)}
              onReset={() => {
                setFocusRunning(false);
                setFocusSecondsLeft(focusDurationMin * 60);
              }}
              onCompleteNow={handleCompleteFocusNow}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <BlockModal
        isOpen={blockModalOpen}
        initialBlock={editingBlock}
        courses={data.courses}
        onClose={() => {
          setBlockModalOpen(false);
          setEditingBlock(null);
        }}
        onSave={handleSaveBlock}
      />

      <CourseModal
        isOpen={courseModalOpen}
        initialCourse={editingCourse}
        onClose={() => {
          setCourseModalOpen(false);
          setEditingCourse(null);
        }}
        onSave={handleSaveCourse}
      />

      <AssignmentModal
        isOpen={assignmentModalOpen}
        initialAssignment={editingAssignment}
        defaultDate={selectedDate}
        courses={data.courses}
        onClose={() => {
          setAssignmentModalOpen(false);
          setEditingAssignment(null);
        }}
        onSave={handleSaveAssignment}
      />
    </div>
  );
}

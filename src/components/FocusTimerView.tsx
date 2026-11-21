import React from 'react';
import { CheckCircle2, Pause, Play, RotateCcw } from 'lucide-react';
import { Course, FocusLog } from '../types/schedule';
import { ACCENT_STYLES, formatDuration } from '../utils/dateUtils';

interface FocusTimerViewProps {
  todayIso: string;
  courses: Course[];
  focusLogs: FocusLog[];
  durationMinutes: number;
  secondsLeft: number;
  isRunning: boolean;
  linkedCourseId: string;
  sessionLabel: string;
  onChangeDuration: (minutes: number) => void;
  onChangeCourse: (courseId: string) => void;
  onChangeLabel: (label: string) => void;
  onToggleRun: () => void;
  onReset: () => void;
  onCompleteNow: () => void;
}

const PRESETS = [
  { label: '25m Pomodoro', minutes: 25 },
  { label: '50m Deep Study', minutes: 50 },
  { label: '15m Quick Review', minutes: 15 },
];

export const FocusTimerView: React.FC<FocusTimerViewProps> = ({
  todayIso,
  courses,
  focusLogs,
  durationMinutes,
  secondsLeft,
  isRunning,
  linkedCourseId,
  sessionLabel,
  onChangeDuration,
  onChangeCourse,
  onChangeLabel,
  onToggleRun,
  onReset,
  onCompleteNow,
}) => {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const totalSeconds = durationMinutes * 60;
  const elapsedMinutes = Math.max(1, Math.round((totalSeconds - secondsLeft) / 60));
  const progressPct =
    totalSeconds > 0 ? Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100) : 0;

  const todayLogs = focusLogs.filter((l) => l.date === todayIso);
  const todayTotalMin = todayLogs.reduce((s, l) => s + l.minutes, 0);

  const courseMap = new Map<string, Course>();
  for (const c of courses) courseMap.set(c.id, c);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Main Timer Console */}
      <section className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Study Session Timer
            </h2>

            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => onChangeDuration(preset.minutes)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    durationMinutes === preset.minutes
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Course & Goal Inputs */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Course Context
              </label>
              <select
                value={linkedCourseId}
                onChange={(e) => onChangeCourse(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">General Study</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Session Goal
              </label>
              <input
                type="text"
                value={sessionLabel}
                onChange={(e) => onChangeLabel(e.target.value)}
                placeholder="e.g., Problem Set 5 proofs"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Large Tabular Clock */}
          <div className="my-10 flex flex-col items-center">
            <div className="font-mono text-6xl font-semibold tracking-tight tabular-nums text-slate-900 sm:text-7xl dark:text-white">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
            <div className="mt-4 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-blue-600 transition-transform duration-300 ease-out dark:bg-blue-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
          <button
            type="button"
            onClick={onToggleRun}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap"
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>{secondsLeft < totalSeconds ? 'Resume' : 'Start Focus'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          {secondsLeft < totalSeconds && (
            <button
              type="button"
              onClick={onCompleteNow}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 whitespace-nowrap dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Log {elapsedMinutes}m Now</span>
            </button>
          )}
        </div>
      </section>

      {/* Today's Study Log */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Focus Logged Today
          </h2>
          <span className="font-mono text-sm font-semibold tabular-nums text-blue-600 dark:text-blue-400">
            {formatDuration(todayTotalMin)}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Completed sessions are saved automatically to your daily summary.
        </p>

        {todayLogs.length === 0 ? (
          <p className="mt-6 border-t border-slate-100 pt-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            No focus sessions logged today yet. Start a 25-minute or 50-minute block to track your deep study time.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
            {todayLogs.map((log) => {
              const course = log.courseId ? courseMap.get(log.courseId) : undefined;
              const style = course ? ACCENT_STYLES[course.accent] : ACCENT_STYLES.slate;
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
                      {log.label}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {course && (
                        <>
                          <span className={`font-mono font-semibold ${style.text}`}>
                            {course.code}
                          </span>
                          <span aria-hidden="true">·</span>
                        </>
                      )}
                      <span>
                        {new Date(log.timestamp).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                    {formatDuration(log.minutes)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Course, CourseAccent, CourseMeeting, Weekday } from '../types/schedule';
import { ACCENT_STYLES, timeToMinutes } from '../utils/dateUtils';

interface CourseModalProps {
  isOpen: boolean;
  initialCourse: Course | null;
  onClose: () => void;
  onSave: (courseData: Omit<Course, 'id'> & { id?: string }) => void;
}

const ACCENTS: { id: CourseAccent; label: string }[] = [
  { id: 'cobalt', label: 'Cobalt' },
  { id: 'emerald', label: 'Emerald' },
  { id: 'amber', label: 'Amber' },
  { id: 'violet', label: 'Violet' },
  { id: 'rose', label: 'Rose' },
  { id: 'slate', label: 'Slate' },
];

const WEEKDAYS: { id: Weekday; short: string }[] = [
  { id: 1, short: 'Mon' },
  { id: 2, short: 'Tue' },
  { id: 3, short: 'Wed' },
  { id: 4, short: 'Thu' },
  { id: 5, short: 'Fri' },
  { id: 6, short: 'Sat' },
  { id: 0, short: 'Sun' },
];

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  initialCourse,
  onClose,
  onSave,
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [credits, setCredits] = useState(3);
  const [accent, setAccent] = useState<CourseAccent>('cobalt');
  const [meetings, setMeetings] = useState<CourseMeeting[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (initialCourse) {
      setCode(initialCourse.code);
      setTitle(initialCourse.title);
      setInstructor(initialCourse.instructor);
      setCredits(initialCourse.credits);
      setAccent(initialCourse.accent);
      setMeetings(initialCourse.meetings.map((m) => ({ ...m, days: [...m.days] })));
    } else {
      setCode('');
      setTitle('');
      setInstructor('');
      setCredits(3);
      setAccent('cobalt');
      setMeetings([
        {
          days: [1, 3, 5],
          startTime: '10:00',
          endTime: '11:00',
          location: '',
          kind: 'lecture',
        },
      ]);
    }
    setError('');
  }, [isOpen, initialCourse]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleMeetingDay = (idx: number, day: Weekday) => {
    setMeetings((prev) =>
      prev.map((m, i) => {
        if (i !== idx) return m;
        const exists = m.days.includes(day);
        const days = exists ? m.days.filter((d) => d !== day) : [...m.days, day];
        return { ...m, days };
      })
    );
  };

  const updateMeetingField = <K extends keyof CourseMeeting>(
    idx: number,
    field: K,
    value: CourseMeeting[K]
  ) => {
    setMeetings((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      setError('Course code and title are required.');
      return;
    }
    for (const m of meetings) {
      if (m.days.length === 0) {
        setError('Each meeting time needs at least one selected weekday.');
        return;
      }
      if (timeToMinutes(m.endTime) <= timeToMinutes(m.startTime)) {
        setError('Class end time must be after start time.');
        return;
      }
    }

    onSave({
      id: initialCourse?.id,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      instructor: instructor.trim(),
      credits: Math.max(0, Number(credits) || 0),
      accent,
      meetings: meetings.map((m) => ({
        ...m,
        location: m.location.trim(),
      })),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <h2
            id="course-modal-title"
            className="font-display text-base font-semibold text-slate-900 dark:text-white"
          >
            {initialCourse ? 'Edit Course' : 'Add Semester Course'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Course Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., CS 310"
                autoFocus
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Course Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Algorithms & Graph Theory"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Instructor (Optional)
              </label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="e.g., Prof. Elena Rostova"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Credits
              </label>
              <input
                type="number"
                min={0}
                max={8}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Color Identifier
            </label>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => {
                const style = ACCENT_STYLES[a.id];
                const selected = accent === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAccent(a.id)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? 'border-slate-900 bg-slate-100 text-slate-900 dark:border-white dark:bg-slate-800 dark:text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-sm ${style.dot}`} />
                    <span>{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weekly Recurring Meetings */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Weekly Class & Lab Times
              </span>
              <button
                type="button"
                onClick={() =>
                  setMeetings((prev) => [
                    ...prev,
                    {
                      days: [2, 4],
                      startTime: '13:00',
                      endTime: '14:30',
                      location: '',
                      kind: 'lab',
                    },
                  ])
                }
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Section</span>
              </button>
            </div>

            <div className="space-y-3">
              {meetings.map((meeting, idx) => (
                <div
                  key={idx}
                  className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {WEEKDAYS.map((wd) => {
                        const active = meeting.days.includes(wd.id);
                        return (
                          <button
                            key={wd.id}
                            type="button"
                            onClick={() => toggleMeetingDay(idx, wd.id)}
                            className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                              active
                                ? 'bg-blue-600 text-white'
                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {wd.short}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={meeting.kind}
                        onChange={(e) =>
                          updateMeetingField(
                            idx,
                            'kind',
                            e.target.value as 'lecture' | 'lab'
                          )
                        }
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="lecture">Lecture</option>
                        <option value="lab">Lab / Discussion</option>
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          setMeetings((prev) => prev.filter((_, i) => i !== idx))
                        }
                        aria-label="Remove section"
                        className="rounded p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <input
                      type="time"
                      value={meeting.startTime}
                      onChange={(e) =>
                        updateMeetingField(idx, 'startTime', e.target.value)
                      }
                      aria-label="Class start time"
                      className="rounded border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <input
                      type="time"
                      value={meeting.endTime}
                      onChange={(e) =>
                        updateMeetingField(idx, 'endTime', e.target.value)
                      }
                      aria-label="Class end time"
                      className="rounded border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <input
                      type="text"
                      value={meeting.location}
                      onChange={(e) =>
                        updateMeetingField(idx, 'location', e.target.value)
                      }
                      placeholder="Room / Building"
                      className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              {initialCourse ? 'Save Course' : 'Add Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

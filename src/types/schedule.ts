export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sun, 1 = Mon ... 6 = Sat

export type BlockCategory =
  | 'lecture'
  | 'lab'
  | 'study'
  | 'exam'
  | 'club'
  | 'wellness';

export type CourseAccent =
  | 'cobalt'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'slate';

export interface CourseMeeting {
  days: Weekday[];
  startTime: string; // HH:mm 24h
  endTime: string;   // HH:mm 24h
  location: string;
  kind: 'lecture' | 'lab';
}

export interface Course {
  id: string;
  code: string;       // e.g. "CS 310"
  title: string;      // e.g. "Algorithms & Data Structures"
  instructor: string;
  credits: number;
  accent: CourseAccent;
  meetings: CourseMeeting[];
}

export interface ScheduleBlock {
  id: string;
  title: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  category: BlockCategory;
  courseId?: string;
  location?: string;
  notes?: string;
  completed: boolean;
  isRecurringCourse?: boolean;
  recurringKey?: string;
}

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  dueDate: string;    // YYYY-MM-DD
  dueTime: string;    // HH:mm
  kind: 'assignment' | 'exam' | 'reading' | 'project';
  priority: 'high' | 'normal';
  estimatedMinutes: number;
  completed: boolean;
}

export interface FocusLog {
  id: string;
  date: string;       // YYYY-MM-DD
  minutes: number;
  courseId?: string;
  label: string;
  timestamp: string;
}

export interface DayGap {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export type ActiveView = 'today' | 'week' | 'courses' | 'focus';

export interface AppDataState {
  termName: string;
  courses: Course[];
  blocks: ScheduleBlock[];
  assignments: Assignment[];
  skippedRecurringKeys: string[];
  completedRecurringKeys: string[];
  focusLogs: FocusLog[];
}

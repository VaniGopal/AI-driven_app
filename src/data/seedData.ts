import { AppDataState } from '../types/schedule';
import { addDays, getWeekday, toISODate } from '../utils/dateUtils';

export function createSeedState(referenceDate = new Date()): AppDataState {
  const today = toISODate(referenceDate);
  const tomorrow = addDays(today, 1);
  const inTwoDays = addDays(today, 2);
  const inThreeDays = addDays(today, 3);
  const inFiveDays = addDays(today, 5);
  const todayWeekday = getWeekday(today);

  // Include today's weekday in at least two courses if today is a weekend so Today's Schedule immediately demonstrates live blocks & free-gap detection, while keeping normal MWF/TuTh structure.
  const isWeekend = todayWeekday === 0 || todayWeekday === 6;

  return {
    termName: 'Fall 2026',
    courses: [
      {
        id: 'c_cs310',
        code: 'CS 310',
        title: 'Algorithms & Graph Theory',
        instructor: 'Prof. Elena Rostova',
        credits: 4,
        accent: 'cobalt',
        meetings: [
          {
            days: [1, 3, 5],
            startTime: '09:30',
            endTime: '10:45',
            location: 'Gates Hall 204',
            kind: 'lecture',
          },
          {
            days: [4],
            startTime: '14:00',
            endTime: '15:30',
            location: 'Gates Lab B12',
            kind: 'lab',
          },
        ],
      },
      {
        id: 'c_econ204',
        code: 'ECON 204',
        title: 'Macroeconomic Policy',
        instructor: 'Dr. Marcus Vance',
        credits: 3,
        accent: 'emerald',
        meetings: [
          {
            days: [2, 4],
            startTime: '11:00',
            endTime: '12:15',
            location: 'Sterling Annex 110',
            kind: 'lecture',
          },
        ],
      },
      {
        id: 'c_bio105',
        code: 'BIO 105',
        title: 'Cellular Biology & Genetics',
        instructor: 'Prof. Hannah Lin',
        credits: 4,
        accent: 'amber',
        meetings: [
          {
            days: [1, 3],
            startTime: '13:30',
            endTime: '14:45',
            location: 'Mendel Science 302',
            kind: 'lecture',
          },
          {
            days: [2],
            startTime: '14:30',
            endTime: '17:00',
            location: 'Mendel Wet Lab 104',
            kind: 'lab',
          },
        ],
      },
      {
        id: 'c_phil112',
        code: 'PHIL 112',
        title: 'Ethics in Technology',
        instructor: 'Dr. Julian Mercer',
        credits: 3,
        accent: 'violet',
        meetings: [
          {
            days: [1, 3],
            startTime: '15:30',
            endTime: '16:45',
            location: 'Humanities 218',
            kind: 'lecture',
          },
        ],
      },
    ],
    blocks: [
      ...(isWeekend
        ? [
            {
              id: 'b_wk_review',
              title: 'CS 310 Midterm Study Group',
              date: today,
              startTime: '10:00',
              endTime: '11:30',
              category: 'study' as const,
              courseId: 'c_cs310',
              location: 'Main Library Room 3B',
              notes: 'Review dynamic programming & shortest-path proofs.',
              completed: false,
            },
            {
              id: 'b_wk_lab',
              title: 'BIO 105 Lab Report Drafting',
              date: today,
              startTime: '13:30',
              endTime: '15:00',
              category: 'study' as const,
              courseId: 'c_bio105',
              location: 'Science Commons',
              notes: 'Compile microscopy results and error bars.',
              completed: false,
            },
            {
              id: 'b_wk_gym',
              title: 'Campus Rec: Rowing & Conditioning',
              date: today,
              startTime: '17:30',
              endTime: '18:30',
              category: 'wellness' as const,
              location: 'Rec Center Boathouse',
              completed: false,
            },
          ]
        : [
            {
              id: 'b_day_prep',
              title: 'ECON 204 Problem Set 6',
              date: today,
              startTime: '17:15',
              endTime: '18:45',
              category: 'study' as const,
              courseId: 'c_econ204',
              location: 'Library Quiet Floor',
              notes: 'Finish IS-LM model derivations before Friday section.',
              completed: false,
            },
            {
              id: 'b_day_club',
              title: 'ACM Competitive Coding Practice',
              date: today,
              startTime: '19:30',
              endTime: '20:45',
              category: 'club' as const,
              location: 'Engineering Atrium',
              completed: false,
            },
          ]),
      {
        id: 'b_tom_study',
        title: 'PHIL 112 Case Brief Reading',
        date: tomorrow,
        startTime: '10:30',
        endTime: '11:45',
        category: 'study',
        courseId: 'c_phil112',
        location: 'Dorm Study Lounge',
        completed: false,
      },
      {
        id: 'b_in2_exam',
        title: 'CS 310 Quiz 4: Greedy & MST',
        date: inTwoDays,
        startTime: '09:30',
        endTime: '10:30',
        category: 'exam',
        courseId: 'c_cs310',
        location: 'Gates Hall 204',
        completed: false,
      },
    ],
    assignments: [
      {
        id: 'a_1',
        title: 'Problem Set 5: Dynamic Programming',
        courseId: 'c_cs310',
        dueDate: tomorrow,
        dueTime: '23:59',
        kind: 'assignment',
        priority: 'high',
        estimatedMinutes: 120,
        completed: false,
      },
      {
        id: 'a_2',
        title: 'Cellular Respiration Lab Report',
        courseId: 'c_bio105',
        dueDate: inTwoDays,
        dueTime: '17:00',
        kind: 'project',
        priority: 'high',
        estimatedMinutes: 90,
        completed: false,
      },
      {
        id: 'a_3',
        title: 'Monetary Policy Response Memo',
        courseId: 'c_econ204',
        dueDate: inThreeDays,
        dueTime: '11:00',
        kind: 'assignment',
        priority: 'normal',
        estimatedMinutes: 60,
        completed: false,
      },
      {
        id: 'a_4',
        title: 'Algorithmic Fairness Seminar Reading',
        courseId: 'c_phil112',
        dueDate: inFiveDays,
        dueTime: '15:30',
        kind: 'reading',
        priority: 'normal',
        estimatedMinutes: 45,
        completed: true,
      },
    ],
    skippedRecurringKeys: [],
    completedRecurringKeys: [],
    focusLogs: [
      {
        id: 'f_seed_1',
        date: today,
        minutes: 25,
        courseId: 'c_cs310',
        label: 'Morning graph review',
        timestamp: new Date(referenceDate.getTime() - 3600 * 1000).toISOString(),
      },
    ],
  };
}

export function createEmptyState(): AppDataState {
  return {
    termName: 'Fall 2026',
    courses: [],
    blocks: [],
    assignments: [],
    skippedRecurringKeys: [],
    completedRecurringKeys: [],
    focusLogs: [],
  };
}

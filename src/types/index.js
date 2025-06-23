// Core data models for Smart Study Scheduler

// Subject/Course model
export const createSubject = (name, color = '#3B82F6', priority = 'medium') => ({
  id: crypto.randomUUID(),
  name,
  color,
  priority, // 'low', 'medium', 'high'
  totalStudyTime: 0, // in minutes
  sessionsCompleted: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Study Session model
export const createStudySession = (subjectId, title, duration = 25, type = 'study') => ({
  id: crypto.randomUUID(),
  subjectId,
  title,
  description: '',
  duration, // in minutes
  type, // 'study', 'review', 'practice', 'exam'
  status: 'planned', // 'planned', 'in-progress', 'completed', 'skipped'
  scheduledAt: null,
  startedAt: null,
  completedAt: null,
  actualDuration: null,
  notes: '',
  difficulty: 'medium', // 'easy', 'medium', 'hard'
  effectiveness: null, // 1-5 rating after completion
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Study Schedule model
export const createSchedule = (name = 'My Study Schedule') => ({
  id: crypto.randomUUID(),
  name,
  sessions: [], // array of session IDs
  startDate: new Date().toISOString(),
  endDate: null,
  isActive: true,
  preferences: {
    dailyStudyGoal: 120, // minutes per day
    sessionLength: 25, // default pomodoro length
    breakLength: 5, // break between sessions
    longBreakLength: 15, // long break after 4 sessions
    studyDaysPerWeek: 5,
    preferredStudyTimes: ['09:00', '14:00', '19:00'], // preferred start times
    maxSessionsPerDay: 8
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// User Preferences model
export const createUserPreferences = () => ({
  id: crypto.randomUUID(),
  theme: 'light', // 'light', 'dark', 'auto'
  notifications: {
    enabled: true,
    sessionReminders: true,
    breakReminders: true,
    dailyGoalReminders: true,
    reminderMinutes: 5 // minutes before session
  },
  studySettings: {
    defaultSessionLength: 25,
    defaultBreakLength: 5,
    autoStartBreaks: false,
    autoStartNextSession: false,
    soundEnabled: true,
    focusMode: false // hides distracting elements
  },
  analytics: {
    trackProductivity: true,
    trackMood: false,
    trackDifficulty: true,
    weeklyReports: true
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Analytics/Progress model
export const createProgressEntry = (subjectId, sessionId, date = new Date()) => ({
  id: crypto.randomUUID(),
  subjectId,
  sessionId,
  date: date.toISOString().split('T')[0], // YYYY-MM-DD format
  studyTime: 0, // minutes studied
  sessionsCompleted: 0,
  effectiveness: null, // average effectiveness rating
  mood: null, // 1-5 rating
  notes: '',
  createdAt: new Date().toISOString()
});

// Goal model
export const createGoal = (title, type = 'daily', target = 60) => ({
  id: crypto.randomUUID(),
  title,
  description: '',
  type, // 'daily', 'weekly', 'monthly', 'custom'
  target, // target value (minutes, sessions, etc.)
  current: 0, // current progress
  unit: 'minutes', // 'minutes', 'sessions', 'subjects'
  deadline: null,
  isCompleted: false,
  subjectId: null, // optional: goal specific to a subject
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Smart scheduling priorities
export const PRIORITY_WEIGHTS = {
  high: 3,
  medium: 2,
  low: 1
};

export const SESSION_TYPES = {
  study: { label: 'Study', color: '#3B82F6', icon: '📚' },
  review: { label: 'Review', color: '#10B981', icon: '🔄' },
  practice: { label: 'Practice', color: '#F59E0B', icon: '✏️' },
  exam: { label: 'Exam Prep', color: '#EF4444', icon: '🎯' }
};

export const DIFFICULTY_LEVELS = {
  easy: { label: 'Easy', color: '#10B981', value: 1 },
  medium: { label: 'Medium', color: '#F59E0B', value: 2 },
  hard: { label: 'Hard', color: '#EF4444', value: 3 }
};

// Utility functions for data validation
export const validateSubject = (subject) => {
  return subject.name && subject.name.trim().length > 0;
};

export const validateSession = (session) => {
  return session.title && 
         session.title.trim().length > 0 && 
         session.duration > 0 && 
         session.subjectId;
};

export const validateSchedule = (schedule) => {
  return schedule.name && 
         schedule.name.trim().length > 0 && 
         schedule.preferences.dailyStudyGoal > 0;
};

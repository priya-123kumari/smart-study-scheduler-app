// Smart Study Scheduler Algorithm
import { PRIORITY_WEIGHTS, DIFFICULTY_LEVELS } from '../types/index.js';

// Calculate optimal study session order based on multiple factors
export const calculateSessionPriority = (session, subject, timeOfDay, userProgress) => {
  let score = 0;
  
  // Base priority from subject
  score += PRIORITY_WEIGHTS[subject.priority] * 10;
  
  // Difficulty factor (harder topics get higher priority when fresh)
  const difficultyMultiplier = DIFFICULTY_LEVELS[session.difficulty].value;
  const timeBonus = isOptimalTimeForDifficulty(timeOfDay, session.difficulty) ? 1.5 : 1;
  score += difficultyMultiplier * 5 * timeBonus;
  
  // Deadline urgency (if session has a deadline)
  if (session.deadline) {
    const daysUntilDeadline = getDaysUntilDeadline(session.deadline);
    if (daysUntilDeadline <= 1) score += 20;
    else if (daysUntilDeadline <= 3) score += 15;
    else if (daysUntilDeadline <= 7) score += 10;
  }
  
  // Recent study pattern (avoid burnout, encourage variety)
  const recentStudyTime = getRecentStudyTime(subject.id, userProgress, 3); // last 3 days
  if (recentStudyTime > 180) score -= 10; // reduce priority if studied a lot recently
  if (recentStudyTime === 0) score += 5; // boost if not studied recently
  
  // Session type optimization
  if (session.type === 'review' && isGoodTimeForReview(timeOfDay)) score += 5;
  if (session.type === 'practice' && isGoodTimeForPractice(timeOfDay)) score += 5;
  
  return Math.max(0, score);
};

// Determine if current time is optimal for difficulty level
export const isOptimalTimeForDifficulty = (timeOfDay, difficulty) => {
  const hour = new Date(timeOfDay).getHours();
  
  // Hard topics: best in morning (8-12) or early evening (18-20)
  if (difficulty === 'hard') {
    return (hour >= 8 && hour <= 12) || (hour >= 18 && hour <= 20);
  }
  
  // Medium topics: flexible, avoid very early/late
  if (difficulty === 'medium') {
    return hour >= 9 && hour <= 22;
  }
  
  // Easy topics: good for any time, especially late
  return true;
};

// Check if it's a good time for review sessions
export const isGoodTimeForReview = (timeOfDay) => {
  const hour = new Date(timeOfDay).getHours();
  // Reviews work well in afternoon/evening
  return hour >= 14 && hour <= 21;
};

// Check if it's a good time for practice sessions
export const isGoodTimeForPractice = (timeOfDay) => {
  const hour = new Date(timeOfDay).getHours();
  // Practice works well when alert (morning/early evening)
  return (hour >= 9 && hour <= 12) || (hour >= 16 && hour <= 19);
};

// Calculate days until deadline
export const getDaysUntilDeadline = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Get recent study time for a subject
export const getRecentStudyTime = (subjectId, userProgress, days = 7) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return userProgress
    .filter(entry => 
      entry.subjectId === subjectId && 
      new Date(entry.date) >= cutoffDate
    )
    .reduce((total, entry) => total + entry.studyTime, 0);
};

// Generate optimal daily schedule
export const generateDailySchedule = (sessions, subjects, preferences, date = new Date()) => {
  const schedule = [];
  const availableSessions = sessions.filter(s => s.status === 'planned');
  
  // Sort sessions by priority
  const prioritizedSessions = availableSessions
    .map(session => {
      const subject = subjects.find(s => s.id === session.subjectId);
      const priority = calculateSessionPriority(session, subject, date, []);
      return { ...session, priority, subject };
    })
    .sort((a, b) => b.priority - a.priority);
  
  let totalTime = 0;
  let sessionCount = 0;
  const maxDailyTime = preferences.dailyStudyGoal;
  const maxSessions = preferences.maxSessionsPerDay;
  
  // Build schedule respecting time and session limits
  for (const session of prioritizedSessions) {
    if (totalTime + session.duration <= maxDailyTime && sessionCount < maxSessions) {
      schedule.push({
        ...session,
        scheduledAt: calculateOptimalStartTime(date, sessionCount, preferences)
      });
      totalTime += session.duration;
      sessionCount++;
    }
  }
  
  return {
    date: date.toISOString().split('T')[0],
    sessions: schedule,
    totalTime,
    sessionCount,
    efficiency: schedule.length > 0 ? totalTime / maxDailyTime : 0
  };
};

// Calculate optimal start time for a session
export const calculateOptimalStartTime = (date, sessionIndex, preferences) => {
  const preferredTimes = preferences.preferredStudyTimes;
  const sessionLength = preferences.sessionLength;
  const breakLength = preferences.breakLength;
  
  // Use preferred times as starting points
  if (sessionIndex < preferredTimes.length) {
    const [hours, minutes] = preferredTimes[sessionIndex].split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(hours, minutes, 0, 0);
    return startTime.toISOString();
  }
  
  // For additional sessions, calculate based on previous sessions
  const baseTime = new Date(date);
  const [hours, minutes] = preferredTimes[0].split(':').map(Number);
  baseTime.setHours(hours, minutes, 0, 0);
  
  // Add time for previous sessions and breaks
  const additionalMinutes = sessionIndex * (sessionLength + breakLength);
  baseTime.setMinutes(baseTime.getMinutes() + additionalMinutes);
  
  return baseTime.toISOString();
};

// Generate weekly schedule
export const generateWeeklySchedule = (sessions, subjects, preferences) => {
  const weekSchedule = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Skip weekends if not in study days
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend && preferences.studyDaysPerWeek <= 5) {
      continue;
    }
    
    const dailySchedule = generateDailySchedule(sessions, subjects, preferences, date);
    weekSchedule.push(dailySchedule);
  }
  
  return weekSchedule;
};

// Calculate study streak
export const calculateStudyStreak = (progressEntries) => {
  const sortedEntries = progressEntries
    .filter(entry => entry.studyTime > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (sortedEntries.length === 0) return 0;
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((currentDate - entryDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

// Suggest optimal break time based on study duration
export const suggestBreakDuration = (studyDuration, sessionCount) => {
  // Pomodoro technique: 5 min break after each session, 15-30 min after 4 sessions
  if (sessionCount % 4 === 0) {
    return studyDuration >= 120 ? 30 : 15; // longer break for longer study periods
  }
  return 5;
};

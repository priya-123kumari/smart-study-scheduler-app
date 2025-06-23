// Local Storage utilities for Smart Study Scheduler

const STORAGE_KEYS = {
  SUBJECTS: 'smart-scheduler-subjects',
  SESSIONS: 'smart-scheduler-sessions',
  SCHEDULES: 'smart-scheduler-schedules',
  PROGRESS: 'smart-scheduler-progress',
  PREFERENCES: 'smart-scheduler-preferences',
  GOALS: 'smart-scheduler-goals'
};

// Generic storage functions
export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

export const loadFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

// Subject storage functions
export const saveSubjects = (subjects) => {
  return saveToStorage(STORAGE_KEYS.SUBJECTS, subjects);
};

export const loadSubjects = () => {
  return loadFromStorage(STORAGE_KEYS.SUBJECTS, []);
};

export const addSubject = (subject) => {
  const subjects = loadSubjects();
  subjects.push(subject);
  return saveSubjects(subjects);
};

export const updateSubject = (subjectId, updates) => {
  const subjects = loadSubjects();
  const index = subjects.findIndex(s => s.id === subjectId);
  if (index !== -1) {
    subjects[index] = { ...subjects[index], ...updates, updatedAt: new Date().toISOString() };
    return saveSubjects(subjects);
  }
  return false;
};

export const deleteSubject = (subjectId) => {
  const subjects = loadSubjects();
  const filteredSubjects = subjects.filter(s => s.id !== subjectId);
  return saveSubjects(filteredSubjects);
};

// Session storage functions
export const saveSessions = (sessions) => {
  return saveToStorage(STORAGE_KEYS.SESSIONS, sessions);
};

export const loadSessions = () => {
  return loadFromStorage(STORAGE_KEYS.SESSIONS, []);
};

export const addSession = (session) => {
  const sessions = loadSessions();
  sessions.push(session);
  return saveSessions(sessions);
};

export const updateSession = (sessionId, updates) => {
  const sessions = loadSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index !== -1) {
    sessions[index] = { ...sessions[index], ...updates, updatedAt: new Date().toISOString() };
    return saveSessions(sessions);
  }
  return false;
};

export const deleteSession = (sessionId) => {
  const sessions = loadSessions();
  const filteredSessions = sessions.filter(s => s.id !== sessionId);
  return saveSessions(filteredSessions);
};

// Schedule storage functions
export const saveSchedules = (schedules) => {
  return saveToStorage(STORAGE_KEYS.SCHEDULES, schedules);
};

export const loadSchedules = () => {
  return loadFromStorage(STORAGE_KEYS.SCHEDULES, []);
};

export const addSchedule = (schedule) => {
  const schedules = loadSchedules();
  schedules.push(schedule);
  return saveSchedules(schedules);
};

export const updateSchedule = (scheduleId, updates) => {
  const schedules = loadSchedules();
  const index = schedules.findIndex(s => s.id === scheduleId);
  if (index !== -1) {
    schedules[index] = { ...schedules[index], ...updates, updatedAt: new Date().toISOString() };
    return saveSchedules(schedules);
  }
  return false;
};

// Progress storage functions
export const saveProgress = (progressEntries) => {
  return saveToStorage(STORAGE_KEYS.PROGRESS, progressEntries);
};

export const loadProgress = () => {
  return loadFromStorage(STORAGE_KEYS.PROGRESS, []);
};

export const addProgressEntry = (entry) => {
  const progress = loadProgress();
  // Check if entry for this date and subject already exists
  const existingIndex = progress.findIndex(p => 
    p.date === entry.date && p.subjectId === entry.subjectId
  );
  
  if (existingIndex !== -1) {
    // Update existing entry
    progress[existingIndex] = {
      ...progress[existingIndex],
      studyTime: progress[existingIndex].studyTime + entry.studyTime,
      sessionsCompleted: progress[existingIndex].sessionsCompleted + entry.sessionsCompleted,
      effectiveness: entry.effectiveness || progress[existingIndex].effectiveness,
      mood: entry.mood || progress[existingIndex].mood,
      notes: entry.notes || progress[existingIndex].notes
    };
  } else {
    // Add new entry
    progress.push(entry);
  }
  
  return saveProgress(progress);
};

// Preferences storage functions
export const savePreferences = (preferences) => {
  return saveToStorage(STORAGE_KEYS.PREFERENCES, preferences);
};

export const loadPreferences = () => {
  return loadFromStorage(STORAGE_KEYS.PREFERENCES, null);
};

// Goals storage functions
export const saveGoals = (goals) => {
  return saveToStorage(STORAGE_KEYS.GOALS, goals);
};

export const loadGoals = () => {
  return loadFromStorage(STORAGE_KEYS.GOALS, []);
};

export const addGoal = (goal) => {
  const goals = loadGoals();
  goals.push(goal);
  return saveGoals(goals);
};

export const updateGoal = (goalId, updates) => {
  const goals = loadGoals();
  const index = goals.findIndex(g => g.id === goalId);
  if (index !== -1) {
    goals[index] = { ...goals[index], ...updates, updatedAt: new Date().toISOString() };
    return saveGoals(goals);
  }
  return false;
};

// Data export/import functions
export const exportAllData = () => {
  return {
    subjects: loadSubjects(),
    sessions: loadSessions(),
    schedules: loadSchedules(),
    progress: loadProgress(),
    preferences: loadPreferences(),
    goals: loadGoals(),
    exportDate: new Date().toISOString()
  };
};

export const importAllData = (data) => {
  try {
    if (data.subjects) saveSubjects(data.subjects);
    if (data.sessions) saveSessions(data.sessions);
    if (data.schedules) saveSchedules(data.schedules);
    if (data.progress) saveProgress(data.progress);
    if (data.preferences) savePreferences(data.preferences);
    if (data.goals) saveGoals(data.goals);
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

// Clear all data (for reset functionality)
export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeFromStorage(key);
  });
};

// Get storage usage info
export const getStorageInfo = () => {
  const data = exportAllData();
  const dataString = JSON.stringify(data);
  const sizeInBytes = new Blob([dataString]).size;
  const sizeInKB = (sizeInBytes / 1024).toFixed(2);
  
  return {
    totalItems: {
      subjects: data.subjects.length,
      sessions: data.sessions.length,
      schedules: data.schedules.length,
      progress: data.progress.length,
      goals: data.goals.length
    },
    storageSize: `${sizeInKB} KB`,
    lastExport: data.exportDate
  };
};

import { useState, useEffect } from 'react'
import { loadProgress, loadGoals } from '../utils/storage'
import { calculateStudyStreak } from '../utils/scheduler'

const Dashboard = ({ subjects, sessions, preferences }) => {
  const [progress, setProgress] = useState([])
  const [goals, setGoals] = useState([])
  const [todayStats, setTodayStats] = useState({
    studyTime: 0,
    sessionsCompleted: 0,
    goalProgress: 0
  })

  useEffect(() => {
    const progressData = loadProgress()
    const goalsData = loadGoals()
    setProgress(progressData)
    setGoals(goalsData)

    // Calculate today's stats
    const today = new Date().toISOString().split('T')[0]
    const todayProgress = progressData.filter(p => p.date === today)
    
    const todayStudyTime = todayProgress.reduce((total, p) => total + p.studyTime, 0)
    const todaySessions = todayProgress.reduce((total, p) => total + p.sessionsCompleted, 0)
    const dailyGoal = preferences?.studySettings?.dailyStudyGoal || 120
    const goalProgress = Math.min((todayStudyTime / dailyGoal) * 100, 100)

    setTodayStats({
      studyTime: todayStudyTime,
      sessionsCompleted: todaySessions,
      goalProgress
    })
  }, [preferences])

  const getWeeklyStats = () => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const weeklyProgress = progress.filter(p => new Date(p.date) >= oneWeekAgo)
    
    return {
      totalStudyTime: weeklyProgress.reduce((total, p) => total + p.studyTime, 0),
      totalSessions: weeklyProgress.reduce((total, p) => total + p.sessionsCompleted, 0),
      averageEffectiveness: weeklyProgress.length > 0 
        ? weeklyProgress.reduce((total, p) => total + (p.effectiveness || 0), 0) / weeklyProgress.length
        : 0
    }
  }

  const getSubjectStats = () => {
    return subjects.map(subject => {
      const subjectProgress = progress.filter(p => p.subjectId === subject.id)
      const totalTime = subjectProgress.reduce((total, p) => total + p.studyTime, 0)
      const totalSessions = subjectProgress.reduce((total, p) => total + p.sessionsCompleted, 0)
      
      return {
        ...subject,
        totalStudyTime: totalTime,
        totalSessions,
        averageEffectiveness: subjectProgress.length > 0
          ? subjectProgress.reduce((total, p) => total + (p.effectiveness || 0), 0) / subjectProgress.length
          : 0
      }
    }).sort((a, b) => b.totalStudyTime - a.totalStudyTime)
  }

  const getUpcomingSessions = () => {
    return sessions
      .filter(s => s.status === 'planned')
      .sort((a, b) => {
        // Sort by deadline first, then by priority
        if (a.deadline && b.deadline) {
          return new Date(a.deadline) - new Date(b.deadline)
        }
        if (a.deadline) return -1
        if (b.deadline) return 1
        
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const aSubject = subjects.find(s => s.id === a.subjectId)
        const bSubject = subjects.find(s => s.id === b.subjectId)
        const aPriority = aSubject ? priorityOrder[aSubject.priority] : 0
        const bPriority = bSubject ? priorityOrder[bSubject.priority] : 0
        
        return bPriority - aPriority
      })
      .slice(0, 5)
  }

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId)
    return subject ? subject.name : 'Unknown Subject'
  }

  const weeklyStats = getWeeklyStats()
  const subjectStats = getSubjectStats()
  const upcomingSessions = getUpcomingSessions()
  const studyStreak = calculateStudyStreak(progress)

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Study Dashboard</h2>
        <p>Track your progress and stay motivated!</p>
      </div>

      {/* Today's Progress */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Today's Goal</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${todayStats.goalProgress}%` }}
              />
            </div>
            <p>{formatTime(todayStats.studyTime)} / {formatTime(preferences?.studySettings?.dailyStudyGoal || 120)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>Study Time Today</h3>
            <p className="stat-value">{formatTime(todayStats.studyTime)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Sessions Completed</h3>
            <p className="stat-value">{todayStats.sessionsCompleted}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>Study Streak</h3>
            <p className="stat-value">{studyStreak} days</p>
          </div>
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="section">
        <h3>📈 This Week</h3>
        <div className="weekly-stats">
          <div className="weekly-stat">
            <span className="label">Total Study Time:</span>
            <span className="value">{formatTime(weeklyStats.totalStudyTime)}</span>
          </div>
          <div className="weekly-stat">
            <span className="label">Sessions Completed:</span>
            <span className="value">{weeklyStats.totalSessions}</span>
          </div>
          <div className="weekly-stat">
            <span className="label">Average Effectiveness:</span>
            <span className="value">{weeklyStats.averageEffectiveness.toFixed(1)}/5</span>
          </div>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="section">
        <h3>📚 Subject Performance</h3>
        {subjectStats.length === 0 ? (
          <p className="empty-message">No subjects yet. Add some subjects to see your performance!</p>
        ) : (
          <div className="subject-performance">
            {subjectStats.slice(0, 5).map(subject => (
              <div key={subject.id} className="subject-performance-item">
                <div className="subject-info">
                  <div 
                    className="subject-color-dot"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="subject-name">{subject.name}</span>
                </div>
                <div className="subject-metrics">
                  <span className="metric">{formatTime(subject.totalStudyTime)}</span>
                  <span className="metric">{subject.totalSessions} sessions</span>
                  <span className="metric">{subject.averageEffectiveness.toFixed(1)}/5 ⭐</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Sessions */}
      <div className="section">
        <h3>📅 Upcoming Sessions</h3>
        {upcomingSessions.length === 0 ? (
          <p className="empty-message">No upcoming sessions. Create some study sessions to get started!</p>
        ) : (
          <div className="upcoming-sessions">
            {upcomingSessions.map(session => (
              <div key={session.id} className="upcoming-session">
                <div className="session-info">
                  <h4>{session.title}</h4>
                  <p>{getSubjectName(session.subjectId)} • {formatTime(session.duration)}</p>
                </div>
                <div className="session-meta">
                  {session.deadline && (
                    <span className="deadline">
                      📅 {new Date(session.deadline).toLocaleDateString()}
                    </span>
                  )}
                  <span className={`difficulty ${session.difficulty}`}>
                    {session.difficulty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="section">
        <h3>⚡ Quick Actions</h3>
        <div className="quick-actions">
          <div className="quick-action">
            <span className="action-icon">📚</span>
            <span className="action-text">Add Subject</span>
          </div>
          <div className="quick-action">
            <span className="action-icon">⏰</span>
            <span className="action-text">Create Session</span>
          </div>
          <div className="quick-action">
            <span className="action-icon">🎯</span>
            <span className="action-text">Start Timer</span>
          </div>
          <div className="quick-action">
            <span className="action-icon">📊</span>
            <span className="action-text">View Analytics</span>
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="motivation-card">
        <div className="motivation-content">
          {studyStreak > 0 ? (
            <p>🎉 Great job! You're on a {studyStreak}-day study streak. Keep it up!</p>
          ) : todayStats.studyTime > 0 ? (
            <p>💪 You've studied {formatTime(todayStats.studyTime)} today. You're doing great!</p>
          ) : (
            <p>🌟 Ready to start your study journey? Create your first session and begin!</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

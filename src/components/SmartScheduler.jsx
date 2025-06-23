import { useState, useEffect } from 'react'
import { generateDailySchedule, generateWeeklySchedule } from '../utils/scheduler'
import { updateSession } from '../utils/storage'

const SmartScheduler = ({ sessions, setSessions, subjects, preferences }) => {
  const [scheduleType, setScheduleType] = useState('daily')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [generatedSchedule, setGeneratedSchedule] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateSchedule = async () => {
    setIsGenerating(true)
    
    try {
      if (scheduleType === 'daily') {
        const date = new Date(selectedDate)
        const schedule = generateDailySchedule(sessions, subjects, preferences.preferences || preferences, date)
        setGeneratedSchedule(schedule)
      } else {
        const weekSchedule = generateWeeklySchedule(sessions, subjects, preferences.preferences || preferences)
        setGeneratedSchedule(weekSchedule)
      }
    } catch (error) {
      console.error('Error generating schedule:', error)
      alert('Error generating schedule. Please try again.')
    }
    
    setIsGenerating(false)
  }

  const handleApplySchedule = () => {
    if (!generatedSchedule) return

    if (scheduleType === 'daily') {
      // Apply daily schedule
      generatedSchedule.sessions.forEach(scheduledSession => {
        updateSession(scheduledSession.id, {
          scheduledAt: scheduledSession.scheduledAt,
          status: 'planned'
        })
      })
      
      setSessions(prev => prev.map(session => {
        const scheduledSession = generatedSchedule.sessions.find(s => s.id === session.id)
        if (scheduledSession) {
          return {
            ...session,
            scheduledAt: scheduledSession.scheduledAt,
            status: 'planned'
          }
        }
        return session
      }))
    } else {
      // Apply weekly schedule
      const allScheduledSessions = generatedSchedule.flatMap(day => day.sessions)
      
      allScheduledSessions.forEach(scheduledSession => {
        updateSession(scheduledSession.id, {
          scheduledAt: scheduledSession.scheduledAt,
          status: 'planned'
        })
      })
      
      setSessions(prev => prev.map(session => {
        const scheduledSession = allScheduledSessions.find(s => s.id === session.id)
        if (scheduledSession) {
          return {
            ...session,
            scheduledAt: scheduledSession.scheduledAt,
            status: 'planned'
          }
        }
        return session
      }))
    }

    alert('Schedule applied successfully!')
    setGeneratedSchedule(null)
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

  const getSubjectColor = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId)
    return subject ? subject.color : '#6b7280'
  }

  const formatScheduledTime = (scheduledAt) => {
    const date = new Date(scheduledAt)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const availableSessions = sessions.filter(s => s.status === 'planned' && !s.scheduledAt)

  return (
    <div className="smart-scheduler">
      <div className="section-header">
        <h2>🤖 Smart Scheduler</h2>
        <p>Let AI optimize your study schedule based on priorities and preferences</p>
      </div>

      <div className="scheduler-controls">
        <div className="control-group">
          <label htmlFor="scheduleType">Schedule Type:</label>
          <select
            id="scheduleType"
            value={scheduleType}
            onChange={(e) => setScheduleType(e.target.value)}
          >
            <option value="daily">Daily Schedule</option>
            <option value="weekly">Weekly Schedule</option>
          </select>
        </div>

        {scheduleType === 'daily' && (
          <div className="control-group">
            <label htmlFor="selectedDate">Date:</label>
            <input
              type="date"
              id="selectedDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleGenerateSchedule}
          disabled={isGenerating || availableSessions.length === 0}
        >
          {isGenerating ? '🔄 Generating...' : '🎯 Generate Smart Schedule'}
        </button>
      </div>

      {availableSessions.length === 0 && (
        <div className="empty-state">
          <p>No unscheduled sessions available. Create some sessions first!</p>
        </div>
      )}

      {generatedSchedule && (
        <div className="generated-schedule">
          <div className="schedule-header">
            <h3>📅 Generated Schedule</h3>
            <div className="schedule-actions">
              <button className="btn btn-primary" onClick={handleApplySchedule}>
                ✅ Apply Schedule
              </button>
              <button className="btn btn-secondary" onClick={() => setGeneratedSchedule(null)}>
                ❌ Cancel
              </button>
            </div>
          </div>

          {scheduleType === 'daily' ? (
            <div className="daily-schedule">
              <div className="schedule-summary">
                <div className="summary-item">
                  <span className="label">Total Sessions:</span>
                  <span className="value">{generatedSchedule.sessionCount}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Total Time:</span>
                  <span className="value">{formatTime(generatedSchedule.totalTime)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Efficiency:</span>
                  <span className="value">{(generatedSchedule.efficiency * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="schedule-sessions">
                {generatedSchedule.sessions.map((session, index) => (
                  <div key={session.id} className="scheduled-session">
                    <div className="session-time">
                      {formatScheduledTime(session.scheduledAt)}
                    </div>
                    <div className="session-content">
                      <div className="session-header">
                        <div 
                          className="subject-indicator"
                          style={{ backgroundColor: getSubjectColor(session.subjectId) }}
                        />
                        <h4>{session.title}</h4>
                        <span className="session-duration">{formatTime(session.duration)}</span>
                      </div>
                      <p className="session-subject">{getSubjectName(session.subjectId)}</p>
                      <div className="session-meta">
                        <span className="session-type">{session.type}</span>
                        <span className="session-difficulty">{session.difficulty}</span>
                        <span className="session-priority">Priority: {session.priority?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="weekly-schedule">
              {generatedSchedule.map((daySchedule, dayIndex) => (
                <div key={dayIndex} className="day-schedule">
                  <h4 className="day-header">
                    {new Date(daySchedule.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </h4>
                  
                  <div className="day-summary">
                    <span>{daySchedule.sessionCount} sessions</span>
                    <span>{formatTime(daySchedule.totalTime)}</span>
                  </div>

                  <div className="day-sessions">
                    {daySchedule.sessions.map(session => (
                      <div key={session.id} className="mini-session">
                        <div className="mini-session-time">
                          {formatScheduledTime(session.scheduledAt)}
                        </div>
                        <div className="mini-session-content">
                          <div 
                            className="mini-subject-indicator"
                            style={{ backgroundColor: getSubjectColor(session.subjectId) }}
                          />
                          <span className="mini-session-title">{session.title}</span>
                          <span className="mini-session-duration">{formatTime(session.duration)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="scheduler-info">
        <h3>🧠 How Smart Scheduling Works</h3>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon">🎯</div>
            <div className="info-content">
              <h4>Priority-Based</h4>
              <p>Sessions are ordered by subject priority, difficulty, and deadlines</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">⏰</div>
            <div className="info-content">
              <h4>Time-Optimized</h4>
              <p>Difficult topics scheduled when you're most alert</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">📊</div>
            <div className="info-content">
              <h4>Pattern-Aware</h4>
              <p>Considers your study history and preferences</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">🔄</div>
            <div className="info-content">
              <h4>Balanced</h4>
              <p>Ensures variety and prevents subject burnout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartScheduler

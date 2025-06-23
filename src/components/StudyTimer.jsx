import { useState, useEffect, useRef } from 'react'
import { updateSession, addProgressEntry } from '../utils/storage'
import { createProgressEntry } from '../types/index'

const StudyTimer = ({ sessions, setSessions, subjects, preferences, activeSession, setActiveSession }) => {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [showCompletionForm, setShowCompletionForm] = useState(false)
  const [completionData, setCompletionData] = useState({
    effectiveness: 3,
    mood: 3,
    notes: ''
  })
  
  const intervalRef = useRef(null)
  const audioRef = useRef(null)

  // Get available sessions (planned status)
  const availableSessions = sessions.filter(s => s.status === 'planned')

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isRunning, timeLeft])

  const startSession = () => {
    if (!selectedSessionId) {
      alert('Please select a session to start')
      return
    }

    const session = sessions.find(s => s.id === selectedSessionId)
    if (!session) return

    setActiveSession(session)
    setTimeLeft(session.duration * 60) // Convert minutes to seconds
    setIsRunning(true)
    setIsPaused(false)
    setSessionStartTime(new Date())

    // Update session status
    const updatedSession = {
      ...session,
      status: 'in-progress',
      startedAt: new Date().toISOString()
    }
    
    updateSession(session.id, { status: 'in-progress', startedAt: updatedSession.startedAt })
    setSessions(prev => prev.map(s => s.id === session.id ? updatedSession : s))
  }

  const pauseSession = () => {
    setIsRunning(false)
    setIsPaused(true)
  }

  const resumeSession = () => {
    setIsRunning(true)
    setIsPaused(false)
  }

  const stopSession = () => {
    if (window.confirm('Are you sure you want to stop this session? Progress will be saved.')) {
      handleSessionComplete(true)
    }
  }

  const handleSessionComplete = (wasStopped = false) => {
    setIsRunning(false)
    setIsPaused(false)
    
    if (activeSession && sessionStartTime) {
      const endTime = new Date()
      const actualDuration = Math.round((endTime - sessionStartTime) / 1000 / 60) // minutes
      
      setShowCompletionForm(true)
      
      // Store completion data for later use
      setCompletionData(prev => ({
        ...prev,
        actualDuration,
        wasStopped
      }))
    }
    
    // Play completion sound if enabled
    if (preferences?.studySettings?.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Could not play sound:', e))
    }
  }

  const submitCompletion = () => {
    if (!activeSession) return

    const { actualDuration, wasStopped, effectiveness, mood, notes } = completionData
    
    // Update session
    const updatedSession = {
      ...activeSession,
      status: wasStopped ? 'skipped' : 'completed',
      completedAt: new Date().toISOString(),
      actualDuration,
      effectiveness: parseInt(effectiveness),
      notes
    }
    
    updateSession(activeSession.id, {
      status: updatedSession.status,
      completedAt: updatedSession.completedAt,
      actualDuration,
      effectiveness: parseInt(effectiveness),
      notes
    })
    
    setSessions(prev => prev.map(s => s.id === activeSession.id ? updatedSession : s))

    // Add progress entry
    const progressEntry = createProgressEntry(
      activeSession.subjectId,
      activeSession.id,
      new Date()
    )
    progressEntry.studyTime = actualDuration
    progressEntry.sessionsCompleted = wasStopped ? 0 : 1
    progressEntry.effectiveness = parseInt(effectiveness)
    progressEntry.mood = parseInt(mood)
    progressEntry.notes = notes
    
    addProgressEntry(progressEntry)

    // Update subject stats
    const subject = subjects.find(s => s.id === activeSession.subjectId)
    if (subject) {
      // This would typically update subject stats in storage
      // For now, we'll just log it
      console.log('Updated subject stats for:', subject.name)
    }

    // Reset state
    setActiveSession(null)
    setTimeLeft(0)
    setSessionStartTime(null)
    setSelectedSessionId('')
    setShowCompletionForm(false)
    setCompletionData({
      effectiveness: 3,
      mood: 3,
      notes: ''
    })
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    if (!activeSession) return 0
    const totalSeconds = activeSession.duration * 60
    return ((totalSeconds - timeLeft) / totalSeconds) * 100
  }

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId)
    return subject ? subject.name : 'Unknown Subject'
  }

  return (
    <div className="study-timer">
      <audio ref={audioRef} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>

      <div className="timer-container">
        <div className="timer-display">
          <div className="time-circle">
            <svg className="progress-ring" width="200" height="200">
              <circle
                className="progress-ring-background"
                cx="100"
                cy="100"
                r="90"
                fill="transparent"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                className="progress-ring-progress"
                cx="100"
                cy="100"
                r="90"
                fill="transparent"
                stroke="#3b82f6"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={`${2 * Math.PI * 90 * (1 - getProgressPercentage() / 100)}`}
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="time-text">
              <span className="time-value">{formatTime(timeLeft)}</span>
              {activeSession && (
                <span className="session-name">{activeSession.title}</span>
              )}
            </div>
          </div>
        </div>

        {!activeSession ? (
          <div className="session-selector">
            <h3>Select a Study Session</h3>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="session-select"
            >
              <option value="">Choose a session...</option>
              {availableSessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.title} - {getSubjectName(session.subjectId)} ({session.duration}m)
                </option>
              ))}
            </select>
            
            <button 
              className="btn btn-primary btn-large"
              onClick={startSession}
              disabled={!selectedSessionId}
            >
              🎯 Start Session
            </button>
          </div>
        ) : (
          <div className="timer-controls">
            <div className="session-info">
              <h3>{activeSession.title}</h3>
              <p>{getSubjectName(activeSession.subjectId)}</p>
              <p>Duration: {activeSession.duration} minutes</p>
            </div>
            
            <div className="control-buttons">
              {!isRunning && !isPaused && (
                <button className="btn btn-primary" onClick={startSession}>
                  ▶️ Start
                </button>
              )}
              
              {isRunning && (
                <button className="btn btn-warning" onClick={pauseSession}>
                  ⏸️ Pause
                </button>
              )}
              
              {isPaused && (
                <button className="btn btn-primary" onClick={resumeSession}>
                  ▶️ Resume
                </button>
              )}
              
              {(isRunning || isPaused) && (
                <button className="btn btn-danger" onClick={stopSession}>
                  ⏹️ Stop
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showCompletionForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Session Complete!</h3>
            </div>
            
            <div className="completion-form">
              <p>How was your study session?</p>
              
              <div className="form-group">
                <label>Effectiveness (1-5):</label>
                <div className="rating-buttons">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      className={`rating-btn ${completionData.effectiveness === rating ? 'active' : ''}`}
                      onClick={() => setCompletionData(prev => ({ ...prev, effectiveness: rating }))}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Mood (1-5):</label>
                <div className="rating-buttons">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      className={`rating-btn ${completionData.mood === rating ? 'active' : ''}`}
                      onClick={() => setCompletionData(prev => ({ ...prev, mood: rating }))}
                    >
                      {rating === 1 ? '😞' : rating === 2 ? '😐' : rating === 3 ? '🙂' : rating === 4 ? '😊' : '😄'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Notes (optional):</label>
                <textarea
                  value={completionData.notes}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any notes about this session..."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" onClick={submitCompletion}>
                  Complete Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {availableSessions.length === 0 && !activeSession && (
        <div className="empty-state">
          <p>No planned sessions available. Create some sessions first!</p>
        </div>
      )}
    </div>
  )
}

export default StudyTimer

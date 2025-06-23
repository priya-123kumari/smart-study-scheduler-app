import { useState, useEffect } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import SubjectManager from './components/SubjectManager'
import SessionManager from './components/SessionManager'
import StudyTimer from './components/StudyTimer'
import SmartScheduler from './components/SmartScheduler'
import { loadSubjects, loadSessions, loadPreferences } from './utils/storage'
import { createUserPreferences } from './types/index'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [subjects, setSubjects] = useState([])
  const [sessions, setSessions] = useState([])
  const [preferences, setPreferences] = useState(null)
  const [activeSession, setActiveSession] = useState(null)

  useEffect(() => {
    // Load data from localStorage on app start
    const loadedSubjects = loadSubjects()
    const loadedSessions = loadSessions()
    const loadedPreferences = loadPreferences()

    setSubjects(loadedSubjects)
    setSessions(loadedSessions)
    setPreferences(loadedPreferences || createUserPreferences())
  }, [])

  const navigation = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'subjects', label: '📚 Subjects', icon: '📚' },
    { id: 'sessions', label: '⏰ Sessions', icon: '⏰' },
    { id: 'scheduler', label: '🤖 Smart Scheduler', icon: '🤖' },
    { id: 'timer', label: '🎯 Study Timer', icon: '🎯' }
  ]

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            subjects={subjects}
            sessions={sessions}
            preferences={preferences}
          />
        )
      case 'subjects':
        return (
          <SubjectManager
            subjects={subjects}
            setSubjects={setSubjects}
          />
        )
      case 'sessions':
        return (
          <SessionManager
            sessions={sessions}
            setSessions={setSessions}
            subjects={subjects}
          />
        )
      case 'scheduler':
        return (
          <SmartScheduler
            sessions={sessions}
            setSessions={setSessions}
            subjects={subjects}
            preferences={preferences}
          />
        )
      case 'timer':
        return (
          <StudyTimer
            sessions={sessions}
            setSessions={setSessions}
            subjects={subjects}
            preferences={preferences}
            activeSession={activeSession}
            setActiveSession={setActiveSession}
          />
        )
      default:
        return <Dashboard subjects={subjects} sessions={sessions} preferences={preferences} />
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧠 Smart Study Scheduler</h1>
        <nav className="app-nav">
          {navigation.map(item => (
            <button
              key={item.id}
              className={`nav-button ${currentView === item.id ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {renderCurrentView()}
      </main>
    </div>
  )
}

export default App

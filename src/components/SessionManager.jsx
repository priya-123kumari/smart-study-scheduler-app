import { useState } from 'react'
import { createStudySession, SESSION_TYPES, DIFFICULTY_LEVELS } from '../types/index'
import { addSession, updateSession, deleteSession } from '../utils/storage'

const SessionManager = ({ sessions, setSessions, subjects }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [formData, setFormData] = useState({
    subjectId: '',
    title: '',
    description: '',
    duration: 25,
    type: 'study',
    difficulty: 'medium',
    deadline: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.subjectId || !formData.title.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (editingSession) {
      // Update existing session
      const updatedSession = {
        ...editingSession,
        ...formData,
        updatedAt: new Date().toISOString()
      }
      
      updateSession(editingSession.id, formData)
      setSessions(prev => prev.map(s => s.id === editingSession.id ? updatedSession : s))
      setEditingSession(null)
    } else {
      // Create new session
      const newSession = createStudySession(
        formData.subjectId,
        formData.title,
        parseInt(formData.duration),
        formData.type
      )
      
      newSession.description = formData.description
      newSession.difficulty = formData.difficulty
      if (formData.deadline) {
        newSession.deadline = formData.deadline
      }
      
      addSession(newSession)
      setSessions(prev => [...prev, newSession])
    }

    // Reset form
    setFormData({
      subjectId: '',
      title: '',
      description: '',
      duration: 25,
      type: 'study',
      difficulty: 'medium',
      deadline: ''
    })
    setShowAddForm(false)
  }

  const handleEdit = (session) => {
    setEditingSession(session)
    setFormData({
      subjectId: session.subjectId,
      title: session.title,
      description: session.description || '',
      duration: session.duration,
      type: session.type,
      difficulty: session.difficulty,
      deadline: session.deadline || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingSession(null)
    setFormData({
      subjectId: '',
      title: '',
      description: '',
      duration: 25,
      type: 'study',
      difficulty: 'medium',
      deadline: ''
    })
  }

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId)
    return subject ? subject.name : 'Unknown Subject'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981'
      case 'in-progress': return '#F59E0B'
      case 'planned': return '#6B7280'
      case 'skipped': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className="session-manager">
      <div className="section-header">
        <h2>Study Sessions</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          + Add Session
        </button>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingSession ? 'Edit Session' : 'Add New Session'}</h3>
              <button className="btn-close" onClick={handleCancel}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="session-form">
              <div className="form-group">
                <label htmlFor="subjectId">Subject *</label>
                <select
                  id="subjectId"
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="title">Session Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Chapter 5 Review"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional description or notes"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duration">Duration (minutes)</label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="5"
                    max="180"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type">Type</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    {Object.entries(SESSION_TYPES).map(([key, type]) => (
                      <option key={key} value={key}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="difficulty">Difficulty</label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                  >
                    {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => (
                      <option key={key} value={key}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="deadline">Deadline (optional)</label>
                <input
                  type="datetime-local"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSession ? 'Update Session' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sessions-list">
        {sessions.length === 0 ? (
          <div className="empty-state">
            <p>No study sessions yet. Create your first session to get started!</p>
          </div>
        ) : (
          <div className="sessions-grid">
            {sessions.map(session => (
              <div key={session.id} className="session-card">
                <div className="session-header">
                  <div className="session-type">
                    <span className="type-icon">
                      {SESSION_TYPES[session.type]?.icon || '📚'}
                    </span>
                    <span className="type-label">
                      {SESSION_TYPES[session.type]?.label || session.type}
                    </span>
                  </div>
                  <div className="session-actions">
                    <button 
                      className="btn-icon"
                      onClick={() => handleEdit(session)}
                      title="Edit session"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => handleDelete(session.id)}
                      title="Delete session"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <h3 className="session-title">{session.title}</h3>
                <p className="session-subject">{getSubjectName(session.subjectId)}</p>
                
                {session.description && (
                  <p className="session-description">{session.description}</p>
                )}
                
                <div className="session-details">
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{formatDuration(session.duration)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Difficulty:</span>
                    <span 
                      className="detail-value difficulty-badge"
                      style={{ color: DIFFICULTY_LEVELS[session.difficulty]?.color }}
                    >
                      {DIFFICULTY_LEVELS[session.difficulty]?.label}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span 
                      className="detail-value status-badge"
                      style={{ color: getStatusColor(session.status) }}
                    >
                      {session.status}
                    </span>
                  </div>
                </div>
                
                {session.deadline && (
                  <div className="session-deadline">
                    <span className="deadline-label">📅 Deadline:</span>
                    <span className="deadline-value">
                      {new Date(session.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionManager

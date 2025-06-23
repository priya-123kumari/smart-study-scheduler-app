import { useState } from 'react'
import { createSubject } from '../types/index'
import { addSubject, updateSubject, deleteSubject } from '../utils/storage'

const SubjectManager = ({ subjects, setSubjects }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    priority: 'medium'
  })

  const predefinedColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Please enter a subject name')
      return
    }

    // Check for duplicate names
    const isDuplicate = subjects.some(subject => 
      subject.name.toLowerCase() === formData.name.toLowerCase() && 
      (!editingSubject || subject.id !== editingSubject.id)
    )

    if (isDuplicate) {
      alert('A subject with this name already exists')
      return
    }

    if (editingSubject) {
      // Update existing subject
      const updatedSubject = {
        ...editingSubject,
        ...formData,
        updatedAt: new Date().toISOString()
      }
      
      updateSubject(editingSubject.id, formData)
      setSubjects(prev => prev.map(s => s.id === editingSubject.id ? updatedSubject : s))
      setEditingSubject(null)
    } else {
      // Create new subject
      const newSubject = createSubject(formData.name, formData.color, formData.priority)
      addSubject(newSubject)
      setSubjects(prev => [...prev, newSubject])
    }

    // Reset form
    setFormData({
      name: '',
      color: '#3B82F6',
      priority: 'medium'
    })
    setShowAddForm(false)
  }

  const handleEdit = (subject) => {
    setEditingSubject(subject)
    setFormData({
      name: subject.name,
      color: subject.color,
      priority: subject.priority
    })
    setShowAddForm(true)
  }

  const handleDelete = (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject? This will also delete all associated sessions.')) {
      deleteSubject(subjectId)
      setSubjects(prev => prev.filter(s => s.id !== subjectId))
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingSubject(null)
    setFormData({
      name: '',
      color: '#3B82F6',
      priority: 'medium'
    })
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴'
      case 'medium': return '🟡'
      case 'low': return '🟢'
      default: return '🟡'
    }
  }

  const formatStudyTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className="subject-manager">
      <div className="section-header">
        <h2>Subjects</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          + Add Subject
        </button>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h3>
              <button className="btn-close" onClick={handleCancel}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="subject-form">
              <div className="form-group">
                <label htmlFor="name">Subject Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Mathematics, History, Programming"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <option value="low">🟢 Low Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="high">🔴 High Priority</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="color">Color</label>
                <div className="color-picker">
                  <input
                    type="color"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="color-input"
                  />
                  <div className="color-presets">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-preset ${formData.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSubject ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="subjects-list">
        {subjects.length === 0 ? (
          <div className="empty-state">
            <p>No subjects yet. Add your first subject to get started!</p>
          </div>
        ) : (
          <div className="subjects-grid">
            {subjects.map(subject => (
              <div key={subject.id} className="subject-card">
                <div className="subject-header">
                  <div 
                    className="subject-color"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div className="subject-priority">
                    {getPriorityIcon(subject.priority)}
                  </div>
                  <div className="subject-actions">
                    <button 
                      className="btn-icon"
                      onClick={() => handleEdit(subject)}
                      title="Edit subject"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => handleDelete(subject.id)}
                      title="Delete subject"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <h3 className="subject-name">{subject.name}</h3>
                
                <div className="subject-stats">
                  <div className="stat-item">
                    <span className="stat-label">Study Time:</span>
                    <span className="stat-value">{formatStudyTime(subject.totalStudyTime)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Sessions:</span>
                    <span className="stat-value">{subject.sessionsCompleted}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Priority:</span>
                    <span className="stat-value">{subject.priority}</span>
                  </div>
                </div>
                
                <div className="subject-dates">
                  <small>Created: {new Date(subject.createdAt).toLocaleDateString()}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SubjectManager

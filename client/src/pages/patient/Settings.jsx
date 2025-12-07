import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { useNavigate } from 'react-router-dom'

function Toggle({ label, checked, onChange, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        {hint && <small style={{ color: 'var(--color-muted)' }}>{hint}</small>}
      </div>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span>{checked ? 'On' : 'Off'}</span>
      </label>
    </div>
  )
}

export default function PatientSettings() {
  const { user, logout, token } = useAuth()
  const navigate = useNavigate()
  const [patientId, setPatientId] = useState('')
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Server-side preferences
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [defaultDoctorId, setDefaultDoctorId] = useState('')

  // Health profile
  const [condition, setCondition] = useState('')
  const [vitals, setVitals] = useState({})

  // Fetch patientId using JWT (avoids stale local userId)
  useEffect(() => {
    if (!token) return
    api.patient.me(undefined, token)
      .then(res => setPatientId(res.patientId))
      .catch(() => setPatientId(''))
  }, [token])

  useEffect(() => { 
    api.patient.doctors().then(setDoctors).catch(() => setDoctors([])) 
  }, [])

  // Load preferences from server
  useEffect(() => {
    if (!token) return
    
    async function loadPreferences() {
      setLoading(true)
      try {
        const prefs = await api.patient.preferences.get(token)
        
        // Set preferences
        setNotifEnabled(prefs.preferences?.notifications ?? false)
        setDarkMode(prefs.preferences?.darkMode ?? false)
        setDefaultDoctorId(prefs.preferences?.defaultDoctorId ?? '')
        
        // Set health profile
        setCondition(prefs.condition ?? '')
        const v = prefs.vitals || {}
        setVitals({
          height: v.heightCm ?? '',
          weight: v.weightKg ?? '',
          bloodPressure: v.bloodPressure ?? '',
          heartRate: v.heartRate ?? ''
        })
        
        // Apply dark mode to DOM
        if (prefs.preferences?.darkMode) {
          document.body.classList.add('dark')
        } else {
          document.body.classList.remove('dark')
        }
        setSaveError('')
      } catch (err) {
        console.error('Failed to load preferences:', err)
        // Fallback to localStorage for migration
        setNotifEnabled(localStorage.getItem('qtrack:pref:notif') === '1')
        setDarkMode(localStorage.getItem('qtrack:pref:dark') === '1')
        setDefaultDoctorId(localStorage.getItem('qtrack:pref:defaultDoctorId') || '')
        setCondition(localStorage.getItem('qtrack:patient:condition') || '')
        try {
          setVitals(JSON.parse(localStorage.getItem('qtrack:patient:vitals') || '{}'))
        } catch {
          setVitals({})
        }
      } finally {
        setLoading(false)
      }
    }
    
    loadPreferences()
  }, [token])

  // Save preferences to server
  async function savePreferences() {
    if (!token || saving) return
    
    setSaving(true)
    try {
      await api.patient.preferences.update(token, {
        condition: condition.trim(),
        vitals: {
          heightCm: Number(vitals.height || 0),
          weightKg: Number(vitals.weight || 0),
          bloodPressure: String(vitals.bloodPressure || ''),
          heartRate: Number(vitals.heartRate || 0)
        },
        preferences: {
          notifications: notifEnabled,
          darkMode,
          defaultDoctorId
        }
      })
      setSaveError('')
      
      // Clear localStorage after successful migration
      localStorage.removeItem('qtrack:pref:notif')
      localStorage.removeItem('qtrack:pref:dark')
      localStorage.removeItem('qtrack:pref:defaultDoctorId')
      localStorage.removeItem('qtrack:patient:condition')
      localStorage.removeItem('qtrack:patient:vitals')
    } catch (err) {
      console.error('Failed to save preferences:', err)
      setSaveError('Save failed. Will retry automatically.')
      // Gentle retry after 2s; auto-save will also kick in
      setTimeout(() => { if (!saving) savePreferences() }, 2000)
    } finally {
      setSaving(false)
    }
  }

  // Auto-save preferences when they change
  useEffect(() => {
    if (!loading && token) {
      const timeoutId = setTimeout(savePreferences, 1000) // Debounce saves
      return () => clearTimeout(timeoutId)
    }
  }, [notifEnabled, darkMode, defaultDoctorId, condition, vitals, loading, token])

  // Apply dark mode immediately
  useEffect(() => {
    try {
      if (darkMode) document.body.classList.add('dark')
      else document.body.classList.remove('dark')
    } catch {}
  }, [darkMode])

  async function exportData() {
    if (!patientId) return
    const [records, visits] = await Promise.all([
      api.patient.records.list(patientId).catch(() => []),
      api.patient.queue.history(patientId).catch(() => []),
    ])
    const out = { user, patientId, records, visits, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qtrack-medical-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function startChatWithDefault() {
    if (!patientId || !defaultDoctorId) return
    const room = await api.chat.createRoom(defaultDoctorId, patientId)
    navigate(`/patient/chat/${room._id}`)
  }

  const defaultDoctor = useMemo(() => doctors.find(d => d.id === defaultDoctorId), [doctors, defaultDoctorId])

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div>Loading preferences...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Settings</div>
            <small style={{ color: 'var(--color-muted)' }}>
              Customize your experience and manage your data.
              {saving && <span style={{ color: '#0ea5e9' }}> • Saving...</span>}
              {saveError && !saving && <span style={{ color: '#ef4444' }}> • {saveError}</span>}
            </small>
          </div>
          <button className="btn" onClick={() => { logout(); navigate('/auth/login') }}>Logout</button>
        </div>
      </div>

      {/* Preferences */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Preferences</div>
        <Toggle 
          label="Enable notifications" 
          checked={notifEnabled} 
          onChange={setNotifEnabled} 
          hint="Get alerts for queue status and messages." 
        />
        <Toggle 
          label="Dark mode" 
          checked={darkMode} 
          onChange={setDarkMode} 
          hint="Reduce eye strain with a darker theme." 
        />
      </div>

      {/* Health Profile */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Health Profile</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Current disease/condition</span>
            <input 
              className="input" 
              placeholder="e.g., Hypertension" 
              value={condition} 
              onChange={e => setCondition(e.target.value)} 
            />
            <small style={{ color: 'var(--color-muted)' }}>Leave empty if healthy.</small>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Height (cm)</span>
              <input 
                className="input" 
                type="number" 
                min="0" 
                step="0.1" 
                placeholder="e.g., 170" 
                value={vitals.height || ''} 
                onChange={e => setVitals(v => ({ ...v, height: e.target.value }))} 
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Weight (kg)</span>
              <input 
                className="input" 
                type="number" 
                min="0" 
                step="0.1" 
                placeholder="e.g., 68.5" 
                value={vitals.weight || ''} 
                onChange={e => setVitals(v => ({ ...v, weight: e.target.value }))} 
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Blood pressure</span>
              <input 
                className="input" 
                placeholder="e.g., 120/80" 
                value={vitals.bloodPressure || ''} 
                onChange={e => setVitals(v => ({ ...v, bloodPressure: e.target.value }))} 
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Heart rate (bpm)</span>
              <input 
                className="input" 
                type="number" 
                min="0" 
                step="1" 
                placeholder="e.g., 72" 
                value={vitals.heartRate || ''} 
                onChange={e => setVitals(v => ({ ...v, heartRate: e.target.value }))} 
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => setVitals({})}>Clear vitals</button>
            <button className="btn btn-primary" onClick={savePreferences} disabled={saving}>
              {saving ? 'Saving...' : 'Save now'}
            </button>
          </div>
          <small style={{ color: 'var(--color-muted)' }}>
            This information is securely stored on the server and automatically saved as you type.
          </small>
        </div>
      </div>

      {/* Default Doctor */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Default Doctor</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select 
            className="input" 
            value={defaultDoctorId} 
            onChange={e => setDefaultDoctorId(e.target.value)} 
            style={{ minWidth: 260 }}
          >
            <option value="">Select a doctor</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
            ))}
          </select>
          <button 
            className="btn" 
            onClick={startChatWithDefault} 
            disabled={!defaultDoctorId || !patientId}
          >
            Start chat
          </button>
        </div>
        {defaultDoctor && (
          <small style={{ color: 'var(--color-muted)' }}>Selected: {defaultDoctor.name}</small>
        )}
      </div>

      {/* Data & Privacy */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Data & Privacy</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={exportData} disabled={!patientId}>
            Export medical data (JSON)
          </button>
          <button 
            className="btn" 
            onClick={() => { 
              localStorage.clear(); 
              sessionStorage.clear(); 
              alert('Session cleared'); 
            }}
          >
            Clear session
          </button>
        </div>
        <small style={{ color: 'var(--color-muted)', display: 'block', marginTop: 8 }}>
          Export includes your health records and clinic visits history.
        </small>
      </div>
    </div>
  )
}
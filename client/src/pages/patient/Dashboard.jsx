import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Skeleton from '../../components/Skeleton.jsx'

export default function PatientDashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [preferencesLoading, setPreferencesLoading] = useState(true)
  
  // Queue timer state
  const [queueInfo, setQueueInfo] = useState(null)
  const [queuePosition, setQueuePosition] = useState(null)
  const [queueStatus, setQueueStatus] = useState('waiting')
  const [remainingMs, setRemainingMs] = useState(0)
  const AVG_MS_PER_PATIENT = 8 * 60 * 1000
  const [initialEstimateMs, setInitialEstimateMs] = useState(0)
  const lastPosRef = useRef(null)

  // Health summary state (from server)
  const [patientId, setPatientId] = useState('')
  const [lastRecord, setLastRecord] = useState(null)
  const [dietRecord, setDietRecord] = useState(null)
  const [condition, setCondition] = useState('')
  const [vitals, setVitals] = useState({})
  const [docSearch, setDocSearch] = useState('')

  const filteredDoctors = useMemo(() => {
    const q = docSearch.trim().toLowerCase()
    if (!q) return doctors
    return doctors.filter(d => (
      (d.name || '').toLowerCase().includes(q) ||
      (d.specialization || '').toLowerCase().includes(q)
    ))
  }, [doctors, docSearch])

  useEffect(() => {
    setLoading(true)
    api.patient.doctors()
      .then(setDoctors)
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false))
  }, [])

  // Load patient preferences from server
  useEffect(() => {
    if (!token) return
    
    async function loadPatientData() {
      setPreferencesLoading(true)
      try {
        // Load preferences from server
        const prefs = await api.patient.preferences.get(token)
        setCondition(prefs.condition ?? '')
        setVitals(prefs.vitals ?? {})
        
        // Get patient ID and records via token
        const me = await api.patient.me(undefined, token)
        const pid = me?.patientId || ''
        setPatientId(pid)
        
        if (pid) {
          const rec = await api.patient.records.list(pid).catch(() => [])
          setLastRecord(Array.isArray(rec) && rec.length > 0 ? rec[0] : null)
          const diet = Array.isArray(rec) ? rec.find(r => {
            const t = (r.type || '').toLowerCase()
            return t.includes('diet') || t.includes('nutrition')
          }) : null
          setDietRecord(diet || null)
        }
      } catch (err) {
        console.error('Failed to load patient data:', err)
        // Fallback to localStorage for migration
        try {
          setCondition(localStorage.getItem('qtrack:patient:condition') || '')
          const vRaw = localStorage.getItem('qtrack:patient:vitals')
          setVitals(vRaw ? JSON.parse(vRaw) : {})
          
          // Try to get patient ID via token
          try {
            const me = await api.patient.me(undefined, token)
            const pid = me?.patientId || ''
            setPatientId(pid)
            if (pid) {
              const rec = await api.patient.records.list(pid).catch(() => [])
              setLastRecord(Array.isArray(rec) && rec.length > 0 ? rec[0] : null)
              const diet = Array.isArray(rec) ? rec.find(r => {
                const t = (r.type || '').toLowerCase()
                return t.includes('diet') || t.includes('nutrition')
              }) : null
              setDietRecord(diet || null)
            }
          } catch {}
        } catch {}
      } finally {
        setPreferencesLoading(false)
      }
    }
    
    loadPatientData()
  }, [token])

  // Queue management
  useEffect(() => {
    let pollInt = null
    let tickInt = null
    try {
      const raw = localStorage.getItem('qtrack:queue:active')
      const active = raw ? JSON.parse(raw) : null
      setQueueInfo(active)
      if (active?.queueId) {
        const poll = async () => {
          try {
            const status = await api.patient.queue.status(active.queueId)
            const pos = status?.position ?? null
            setQueuePosition(pos)
            setQueueStatus(status?.status ?? 'waiting')
            const base = Math.max(0, ((pos ?? 1) - 1) * AVG_MS_PER_PATIENT)
            // Only reset countdown when position changes
            if (lastPosRef.current !== pos) {
              lastPosRef.current = pos
              setRemainingMs(base)
              setInitialEstimateMs(base)
            }
          } catch {}
        }
        poll()
        pollInt = setInterval(poll, 5000)
        tickInt = setInterval(() => setRemainingMs(ms => Math.max(0, ms - 1000)), 1000)
      }
    } catch {}
    return () => {
      if (pollInt) clearInterval(pollInt)
      if (tickInt) clearInterval(tickInt)
    }
  }, [])

  const healthy = !condition || condition.trim() === ''
  const weight = vitals?.weight
  const height = vitals?.height
  const bp = vitals?.bloodPressure
  const heartRate = vitals?.heartRate
  const minutes = Math.floor(remainingMs/60000)
  const seconds = Math.floor((remainingMs%60000)/1000)
  const progress = initialEstimateMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs/initialEstimateMs)) : 0
  const statusStyles = (() => {
    const s = (queueStatus || 'waiting').toLowerCase()
    if (s.includes('wait')) return { bg: '#fef3c7', color: '#92400e' }
    if (s.includes('call') || s.includes('serv')) return { bg: '#dbeafe', color: '#1e3a8a' }
    if (s.includes('done') || s.includes('complete')) return { bg: '#dcfce7', color: '#166534' }
    return { bg: '#f3f4f6', color: '#374151' }
  })()

  return (
    <div>
      <div className="card" style={{ background: 'linear-gradient(180deg, #f9fafb 0%, #ffffff 100%)' }}>
        <h3 style={{ marginTop: 0 }}>Welcome{user?.name ? `, ${user.name}` : ''}</h3>
        <p style={{ color: 'var(--color-muted)' }}>Find doctors, view upcoming appointments, and manage your bookings.</p>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => navigate('/patient/book')}>Book appointment</button>
          <button className="btn" onClick={() => navigate('/patient/ai')}>Ask AI Assistant</button>
        </div>
      </div>

      {/* Queue Timer (Enhanced) */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Your Turn Timer</h3>
          <button className="btn" onClick={() => navigate('/patient/queue')}>Manage</button>
        </div>
        {queueInfo?.queueId ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 16, marginTop: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 999, display: 'grid', placeItems: 'center', fontWeight: 800, background: 'linear-gradient(135deg, #cffafe, #a7f3d0)', color: '#0f766e', boxShadow: 'inset 0 0 0 2px #99f6e4' }}>
              {queuePosition ?? '...'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#64748b' }}>Status:</span>
                <span className="badge" style={{ background: statusStyles.bg, color: statusStyles.color }}>{queueStatus || 'waiting'}</span>
                <span style={{ marginLeft: 'auto', color: '#64748b' }}>ETA:</span>
                <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{minutes}m {String(seconds).padStart(2, '0')}s</strong>
              </div>
              <div className="progress">
                <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <small style={{ color: 'var(--color-muted)' }}>
                Progress updates once your position changes; estimate ~{Math.round(AVG_MS_PER_PATIENT/60000)}m per patient.
              </small>
            </div>
            <div />
          </div>
        ) : (
          <div style={{ color: 'var(--color-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 }}>
            <span>Not in any queue.</span>
            <button className="btn" onClick={() => navigate('/patient/queue')}>Join now</button>
          </div>
        )}
      </div>

      {/* Health Summary */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ marginTop: 0 }}>Health Summary</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => navigate('/patient/settings')}>Update</button>
            <button className="btn" onClick={() => navigate('/patient/records')}>View records</button>
          </div>
        </div>
        
        {preferencesLoading ? (
          <div style={{ marginTop: 12 }}>
            <Skeleton lines={3} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#64748b' }}>Current status:</span>
                {healthy ? (
                  <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>Healthy</span>
                ) : (
                  <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>{condition}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                <span className="badge">Height: {height ? `${height} cm` : 'N/A'}</span>
                <span className="badge">Weight: {weight ? `${weight} kg` : 'N/A'}</span>
                <span className="badge">BP: {bp || 'N/A'}</span>
                <span className="badge">Heart Rate: {heartRate ? `${heartRate} bpm` : 'N/A'}</span>
              </div>
              {!healthy && (
                <small style={{ color: 'var(--color-muted)', display: 'block', marginTop: 8 }}>
                  Data synced from server. Update in Settings to keep your profile current.
                </small>
              )}
            </div>
            <div className="card" style={{ padding: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Last report</div>
              {lastRecord ? (
                <div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="badge">{lastRecord.type}</span>
                    <span className="badge">{lastRecord.date}</span>
                  </div>
                  <div style={{ marginTop: 6, color: '#64748b' }}>Doctor: {lastRecord.doctorName || '-'}</div>
                  {lastRecord.notes && <div style={{ marginTop: 6 }}>{lastRecord.notes}</div>}
                  {lastRecord.fileUrl && (
                    <div style={{ marginTop: 8 }}>
                      <a href={lastRecord.fileUrl} target="_blank" rel="noreferrer">View file</a>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--color-muted)' }}>No reports found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Suggested Diet */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ marginTop: 0 }}>Doctor's Suggested Diet</h3>
          <button className="btn" onClick={() => navigate('/patient/records')}>Open records</button>
        </div>
        {dietRecord ? (
          <div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="badge">{dietRecord.date}</span>
              <span className="badge">{dietRecord.doctorName || 'Doctor'}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              {dietRecord.notes ? dietRecord.notes : <span style={{ color: 'var(--color-muted)' }}>No notes provided.</span>}
            </div>
            {dietRecord.fileUrl && (
              <div style={{ marginTop: 8 }}>
                <a href={dietRecord.fileUrl} target="_blank" rel="noreferrer">View diet plan</a>
              </div>
            )}
            <small style={{ color: 'var(--color-muted)', display: 'block', marginTop: 8 }}>
              Source: latest record tagged "diet" or "nutrition".
            </small>
          </div>
        ) : (
          <div style={{ color: 'var(--color-muted)' }}>
            No diet suggestions found. Upload or ask your doctor to add a diet/nutrition record.
          </div>
        )}
      </div>

      {/* Top Doctors */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ marginTop: 0 }}>Top doctors for you</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="input" placeholder="Search doctors" value={docSearch} onChange={e => setDocSearch(e.target.value)} />
            <button className="btn" onClick={() => navigate('/patient/book')}>Browse all</button>
          </div>
        </div>
        {loading ? (
          <div style={{ marginTop: 12 }}>
            <Skeleton lines={6} />
          </div>
        ) : (
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 12 }}>
            {filteredDoctors.slice(0, 6).map(d => (
              <div key={d.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: '#e2e8f0', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#334155' }}>
                    {(d.name || 'D').slice(0,1).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong>{d.name}</strong>
                    <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>{d.specialization}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <span className="badge">Available</span>
                  <span className="badge">4.8 ★</span>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={() => navigate(`/patient/book?doctorId=${d.id}`)}>Book</button>
                  <button className="btn" onClick={async () => {
                    try {
                      if (!patientId) return
                      const room = await api.chat.createRoom(d.id, patientId)
                      navigate(`/patient/chat/${room._id}`)
                    } catch {}
                  }}>Chat</button>
                </div>
              </div>
            ))}
            {filteredDoctors.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-muted)' }}>No doctors match your search</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
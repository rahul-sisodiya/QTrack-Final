import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function JoinQueue() {
  const { user, token } = useAuth()
  const [doctors, setDoctors] = useState([])
  const [search, setSearch] = useState('')
  const [joiningFor, setJoiningFor] = useState(null)
  const [queueId, setQueueId] = useState('')
  const [position, setPosition] = useState(null)
  const [polling, setPolling] = useState(null)
  const [patientId, setPatientId] = useState('')

  useEffect(() => { api.patient.doctors().then(setDoctors) }, [])

  useEffect(() => {
    if (!token) return
    api.patient.me(undefined, token).then(res => setPatientId(res.patientId)).catch(() => setPatientId(''))
  }, [token])

  useEffect(() => {
    if (!queueId) return
    const intv = setInterval(async () => {
      try {
        const status = await api.patient.queue.status(queueId)
        setPosition(status.position)
        if (status.status !== 'waiting') {
          clearInterval(intv)
          setPolling(null)
        }
      } catch {}
    }, 2000)
    setPolling(intv)
    return () => clearInterval(intv)
  }, [queueId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return doctors
    return doctors.filter(d => (d.name || '').toLowerCase().includes(q) || (d.specialization || '').toLowerCase().includes(q))
  }, [doctors, search])

  async function join(doctorId) {
    setJoiningFor(doctorId)
    try {
      const res = await api.patient.queue.join(doctorId, patientId || undefined)
      setQueueId(res.id)
      setPosition(res.position)
      try {
        localStorage.setItem('qtrack:queue:active', JSON.stringify({ queueId: res.id, doctorId }))
      } catch {}
    } finally {
      setJoiningFor(null)
    }
  }

  async function leave() {
    if (!queueId) return
    await api.patient.queue.leave(queueId)
    if (polling) clearInterval(polling)
    setPolling(null)
    setQueueId('')
    setPosition(null)
    try { localStorage.removeItem('qtrack:queue:active') } catch {}
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input className="input" placeholder="Search by name or specialty" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {queueId && (
        <div style={{ background: '#eff6ff', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <strong>Live Status:</strong>
            <span>Your position in queue is</span>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{position ?? '...'}</span>
            <button className="btn" style={{ marginLeft: 'auto' }} onClick={leave}>Leave Queue</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {filtered.map(d => (
          <div key={d.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: '#e2e8f0', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#334155' }}>
                {(d.name || 'D').slice(0,1).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <div style={{ fontWeight: 700 }}>{d.name}</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>{d.specialization}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn" disabled={joiningFor === d.id} onClick={() => join(d.id)}>
                {joiningFor === d.id ? 'Joining...' : 'Join Queue'}
              </button>
              <button className="btn" onClick={() => window.location.href = `/patient/book?doctorId=${encodeURIComponent(d.id)}`}>Book Appointment</button>
              <button className="btn" onClick={() => window.alert('Ratings coming soon')}>View Ratings</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
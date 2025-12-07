import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { api, API_URL } from '../../lib/api'
import { useNavigate } from 'react-router-dom'
import Skeleton from '../../components/Skeleton.jsx'
import { io } from 'socket.io-client'

export default function DoctorDashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState([
    { label: 'Today Appointments', value: 0 },
    { label: 'Upcoming', value: 0 },
    { label: 'New Patients', value: 0 },
    { label: 'Revenue (This Week)', value: '$0' },
  ])

  const [upcoming, setUpcoming] = useState([])
  const [loadingUpcoming, setLoadingUpcoming] = useState(true)
  const [doctorId, setDoctorId] = useState('')
  const [queue, setQueue] = useState({ items: [], queueLength: 0 })
  const [loadingQueue, setLoadingQueue] = useState(true)
  const [queueActionId, setQueueActionId] = useState('')
  const socketRef = useRef(null)

  useEffect(() => {
    if (!doctorId) return
    loadDashboard()
    const int = setInterval(loadDashboard, 30000)
    return () => clearInterval(int)
  }, [doctorId])

  // Doctor–Patient interconnection state
  const [patients, setPatients] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [visits, setVisits] = useState([])
  const [records, setRecords] = useState([])
  const [loadingPR, setLoadingPR] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({ date: '', type: '', doctorName: user?.name || '', fileUrl: '', notes: '' })

  // Load doctor id and patients
  useEffect(() => {
    const userId = user?.id || (localStorage.getItem('qtrack:user') ? JSON.parse(localStorage.getItem('qtrack:user')).id : '')
    if (userId) api.doctor.me(userId).then(r => setDoctorId(r?.doctorId || '')).catch(() => setDoctorId(''))
  }, [user?.id])
  useEffect(() => {
    api.doctor.patients(token).then(setPatients).catch(() => setPatients([]))
  }, [token])

  // Load live queue when doctorId is available
  useEffect(() => {
    if (!doctorId) return
    reloadQueue()
  }, [doctorId])

  async function reloadQueue() {
    setLoadingQueue(true)
    try {
      const res = await api.doctor.queueCurrent(doctorId)
      setQueue({ items: res.items || [], queueLength: res.queueLength || 0 })
    } catch {
      setQueue({ items: [], queueLength: 0 })
    } finally {
      setLoadingQueue(false)
    }
  }

  useEffect(() => {
    if (!doctorId) return
    const int = setInterval(() => { reloadQueue() }, 15000)
    return () => clearInterval(int)
  }, [doctorId])

  async function serve(id) {
    if (!id) return
    setQueueActionId(id)
    try {
      await api.doctor.queueServe(id)
      await reloadQueue()
    } finally { setQueueActionId('') }
  }
  async function cancelQueueItem(id) {
    if (!id) return
    if (!confirm('Remove this patient from the queue?')) return
    setQueueActionId(id)
    try {
      await api.doctor.queueCancel(id)
      await reloadQueue()
    } finally { setQueueActionId('') }
  }
  async function defer(id) {
    if (!id) return
    setQueueActionId(id)
    try {
      await api.doctor.queueDefer(id)
      await reloadQueue()
    } finally { setQueueActionId('') }
  }

  async function loadDashboard() {
    setLoadingUpcoming(true)
    try {
      const data = await api.doctor.dashboard(doctorId)
      setUpcoming(Array.isArray(data.upcomingItems) ? data.upcomingItems : [])
      const formatted = [
        { label: 'Today Appointments', value: data.todayAppointments || 0 },
        { label: 'Upcoming', value: data.upcomingCount || 0 },
        { label: 'New Patients', value: data.newPatients || 0 },
        { label: 'Revenue (This Week)', value: formatCurrency(data.revenueThisWeek || 0) },
      ]
      setStats(formatted)
    } catch {
      setUpcoming([])
      setStats([
        { label: 'Today Appointments', value: 0 },
        { label: 'Upcoming', value: 0 },
        { label: 'New Patients', value: 0 },
        { label: 'Revenue (This Week)', value: '$0' },
      ])
    } finally {
      setLoadingUpcoming(false)
    }
  }

  function formatCurrency(n) {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
    } catch {
      return `$${Number(n || 0).toFixed(0)}`
    }
  }

  // Load visits and records when a patient is selected
  useEffect(() => {
    if (!selectedId) return
    setLoadingPR(true)
    Promise.all([
      api.patient.queue.history(selectedId).catch(() => []),
      api.patient.records.list(selectedId).catch(() => []),
    ])
      .then(([vis, rec]) => { setVisits(vis); setRecords(rec) })
      .finally(() => setLoadingPR(false))
  }, [selectedId])

  async function openChat() {
    try {
      if (!selectedId || !doctorId) return
      const room = await api.chat.createRoom(doctorId, selectedId)
      navigate(`/doctor/chat/${room._id}`)
    } catch {}
  }

  async function uploadRecord() {
    if (!selectedId) return
    if (!form.date || !form.type) return alert('Date and type are required')
    // Validate fileUrl is a PDF or JPEG URL if provided
    const isAllowedUrl = (url) => {
      if (!url) return true
      try {
        const u = new URL(url)
        const lower = u.pathname.toLowerCase()
        return (lower.endsWith('.pdf') || lower.endsWith('.jpeg') || lower.endsWith('.jpg'))
      } catch { return false }
    }
    if (form.fileUrl && !isAllowedUrl(form.fileUrl)) {
      alert('File URL must be a PDF or JPEG (http/https).')
      return
    }
    setLoadingPR(true)
    try {
      await api.patient.records.upload({ patientId: selectedId, ...form })
      setForm({ date: '', type: '', doctorName: user?.name || '', fileUrl: '', notes: '' })
      const list = await api.patient.records.list(selectedId).catch(() => [])
      setRecords(list)
      setShowUpload(false)
    } finally { setLoadingPR(false) }
  }

  return (
    <div>
      <div className="card-grid">
        {stats.map(s => (
          <div className="card" key={s.label}>
            <div style={{ color: '#64748b', fontSize: 12 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 16 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Upcoming Appointments</h3>
            <button className="btn" onClick={() => navigate('/doctor/appointments')}>View all</button>
          </div>
          {loadingUpcoming ? (
            <div style={{ marginTop: 12 }}><Skeleton lines={4} /></div>
          ) : (
            <table className="table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>No upcoming appointments</td>
                  </tr>
                ) : upcoming.map((a) => (
                  <tr key={a.id}>
                    <td>{a.date}</td>
                    <td>{a.time}</td>
                    <td>{a.patient}</td>
                    <td><span className={`badge ${a.status === 'Scheduled' ? 'badge-warning' : a.status === 'Cancelled' ? 'badge-danger' : 'badge-success'}`}>{a.status}</span></td>
                    <td>
                      <button className="btn" onClick={() => navigate(a.patientId ? `/doctor/patients/${a.patientId}` : '/doctor/appointments')}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Today</h3>
          <div style={{ fontSize: 42, fontWeight: 700 }}>{new Date().toLocaleDateString(undefined, { weekday: 'short' })} {new Date().getDate()}</div>
          <div style={{ color: '#64748b' }}>{new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-primary">Add appointment</button>
          </div>
        </div>
      </div>

      {/* Live Queue */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Live Queue</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge">Waiting: {queue.queueLength}</span>
            <div style={{ width: 120, height: 8, background: '#eef2f7', borderRadius: 999 }}>
              <div style={{ width: `${Math.min(100, queue.queueLength * 12)}%`, height: '100%', background: '#a7f3d0', borderRadius: 999 }} />
            </div>
            <button className="btn" onClick={reloadQueue}>Refresh</button>
          </div>
        </div>
        {loadingQueue ? (
          <div style={{ marginTop: 12 }}><Skeleton lines={3} /></div>
        ) : (
          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Position</th>
                <th>Patient</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.items.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>No patients waiting</td></tr>
              ) : queue.items.map(q => (
                <tr key={q.id}>
                  <td>{q.position}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {(q.patient || 'P').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{q.patient}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>~{Math.max(0, (q.position - 1) * 8)} min</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn" disabled={queueActionId === q.id} onClick={() => navigate(q.patientId ? `/doctor/patients/${q.patientId}` : '/doctor/patients')}>View</button>
                      <button className="btn" disabled={queueActionId === q.id} onClick={() => defer(q.id)}>Wait</button>
                      <button className="btn btn-primary" disabled={queueActionId === q.id} onClick={() => serve(q.id)}>Done</button>
                      <button className="btn" style={{ background: '#fee2e2' }} disabled={queueActionId === q.id} onClick={() => cancelQueueItem(q.id)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Patient History & Records (interconnected) */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Patient History & Records</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="input" value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{ minWidth: 240 }}>
              <option value="">Select patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button className="btn" disabled={!selectedId} onClick={openChat}>Open chat</button>
            <button className="btn btn-primary" disabled={!selectedId} onClick={() => setShowUpload(s => !s)}>{showUpload ? 'Cancel' : 'Add record'}</button>
          </div>
        </div>
        {!selectedId ? (
          <div style={{ color: 'var(--color-muted)', marginTop: 10 }}>Select a patient to view history and records.</div>
        ) : (
          <>
            {showUpload && (
              <div className="card" style={{ padding: 12, marginTop: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  <input className="input" placeholder="Date YYYY-MM-DD" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  <input className="input" placeholder="Type (e.g., lab report)" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} />
                  <input className="input" placeholder="Doctor name" value={form.doctorName} onChange={e => setForm({ ...form, doctorName: e.target.value })} />
                  <input className="input" type="url" pattern="https?://.*\\.(pdf|jpe?g)$" placeholder="File URL (.pdf or .jpeg/.jpg)" value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} />
                   <input className="input" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                 </div>
                 <div style={{ marginTop: 8 }}>
                   <button className="btn btn-primary" onClick={uploadRecord}>Save</button>
                 </div>
               </div>
             )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Clinic Visits</div>
                {loadingPR ? <Skeleton lines={4} /> : (
                  <table className="table">
                    <thead>
                      <tr><th>Doctor</th><th>Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {visits.map(v => (
                        <tr key={v.id}>
                          <td>{v.doctor}</td>
                          <td>{new Date(v.date).toLocaleString()}</td>
                          <td>{v.status}</td>
                        </tr>
                      ))}
                      {visits.length === 0 && (
                        <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>No visits found</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Records</div>
                {loadingPR ? <Skeleton lines={4} /> : (
                  <table className="table">
                    <thead>
                      <tr><th>Date</th><th>Type</th><th>Doctor</th><th>File</th></tr>
                    </thead>
                    <tbody>
                      {records.slice(0, 6).map(r => (
                        <tr key={r.id}>
                          <td>{r.date}</td>
                          <td>{r.type}</td>
                          <td>{r.doctorName || '-'}</td>
                          <td>{r.fileUrl ? <a href={r.fileUrl} target="_blank" rel="noreferrer">View</a> : '-'}</td>
                        </tr>
                      ))}
                      {records.length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>No records found</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
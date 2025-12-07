import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Skeleton from '../../components/Skeleton.jsx'
import { useParams, useNavigate } from 'react-router-dom'

export default function Patients() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()
  const { patientId } = useParams()
  const navigate = useNavigate()

  // View details state
  const [viewingId, setViewingId] = useState('')
  const [viewPatient, setViewPatient] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [visits, setVisits] = useState([])
  const [records, setRecords] = useState([])
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    setLoading(true)
    api.doctor.patients(token)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [token])

  // Auto-open details when route param is present
  useEffect(() => {
    if (!patientId) return
    if (items.length === 0) return
    const p = items.find(i => String(i.id) === String(patientId))
    if (p) {
      openView(p)
    }
  }, [patientId, items])

  async function openView(p) {
    setViewingId(p.id)
    setViewPatient(p)
    setViewLoading(true)
    try {
      const [h, r, a] = await Promise.all([
        api.patient.queue.history(p.id).catch(() => []),
        api.patient.records.list(p.id).catch(() => []),
        api.doctor.appointments(token).catch(() => []),
      ])
      setVisits(h)
      setRecords(r)
      const related = Array.isArray(a) ? a.filter(x => x.patientId === p.id && x.status !== 'Cancelled') : []
      setAppointments(related)
    } finally {
      setViewLoading(false)
    }
  }

  async function openChatWith(p) {
    try {
      const userRaw = localStorage.getItem('qtrack:user')
      const userId = userRaw ? JSON.parse(userRaw).id : ''
      const me = userId ? await api.doctor.me(userId) : null
      const doctorId = me?.doctorId
      if (!doctorId) return
      const room = await api.chat.createRoom(doctorId, p.id)
      navigate(`/doctor/chat/${room._id}`)
    } catch {}
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ marginTop: 0 }}>Patients</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="Search by name" style={{ width: 220 }} />
          <button className="btn btn-primary">Add patient</button>
        </div>
      </div>

      {/* View patient drawer */}
      {viewingId && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700 }}>Patient Details</div>
            <button className="btn" onClick={() => { setViewingId(''); setViewPatient(null); setVisits([]); setRecords([]); setAppointments([]); navigate('/doctor/patients') }}>Close</button>
          </div>
          {viewLoading ? (
            <div style={{ marginTop: 8 }}><Skeleton lines={3} /></div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>Name</div>
                  <div style={{ fontWeight: 600 }}>{viewPatient?.name}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>Age</div>
                  <div style={{ fontWeight: 600 }}>{viewPatient?.age}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>Phone</div>
                  <div style={{ fontWeight: 600 }}>{viewPatient?.phone || '-'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn btn-primary" onClick={() => openChatWith(viewPatient)}>Open chat</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                <div className="card">
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Clinic Visits</div>
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
                        <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>No visits recorded</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="card">
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Records</div>
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
                        <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>No records</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card" style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Upcoming Appointments</div>
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Time</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>No upcoming appointments</td></tr>
                    ) : appointments.map(a => (
                      <tr key={a.id}>
                        <td>{a.date}</td>
                        <td>{a.time}</td>
                        <td><span className={`badge ${a.status === 'Scheduled' ? 'badge-warning' : a.status === 'Cancelled' ? 'badge-danger' : 'badge-success'}`}>{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: 12 }}>
          <Skeleton lines={6} />
        </div>
      ) : (
      <table className="table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Age</th>
            <th>Phone</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-muted)' }}>No patients found</td>
            </tr>
          ) : items.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.age}</td>
              <td>{p.phone}</td>
              <td>
                <button className="btn" onClick={() => { openView(p); navigate(`/doctor/patients/${p.id}`) }}>View</button>
                <button className="btn" style={{ marginLeft: 8 }}>Edit</button>
                <button className="btn btn-primary" style={{ marginLeft: 8 }} onClick={() => openChatWith(p)}>Chat</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Skeleton from '../../components/Skeleton.jsx'

export default function Appointments() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  const [viewingId, setViewingId] = useState('')
  const [viewing, setViewing] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)

  const [rescheduleId, setRescheduleId] = useState('')
  const [form, setForm] = useState({ date: '', time: '' })
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    load()
  }, [token])

  async function load() {
    setLoading(true)
    try {
      const data = await api.doctor.appointments(token)
      setItems(data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  async function openView(id) {
    setViewingId(id)
    setViewing(null)
    setViewLoading(true)
    try {
      const data = await api.doctor.appointment(id)
      setViewing(data)
    } catch {
      setViewing(null)
    } finally {
      setViewLoading(false)
    }
  }

  function openReschedule(id, date, time) {
    setRescheduleId(id)
    setForm({ date: date || '', time: time || '' })
  }

  async function confirmReschedule() {
    if (!rescheduleId || !form.date || !form.time) return
    setActionLoading(true)
    try {
      await api.doctor.rescheduleAppointment(rescheduleId, form.date, form.time)
      setRescheduleId('')
      setForm({ date: '', time: '' })
      await load()
    } finally {
      setActionLoading(false)
    }
  }

  async function cancel(id) {
    if (!id) return
    if (!confirm('Cancel this appointment?')) return
    setActionLoading(true)
    try {
      await api.doctor.cancelAppointment(id)
      await load()
    } catch (err) {
      alert(`Failed to cancel: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ marginTop: 0 }}>Appointments</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="Search by patient" style={{ width: 220 }} />
          <button className="btn">Filter</button>
          <button className="btn btn-primary">New</button>
        </div>
      </div>

      {/* View drawer */}
      {viewingId && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700 }}>Appointment Details</div>
            <button className="btn" onClick={() => { setViewingId(''); setViewing(null) }}>Close</button>
          </div>
          {viewLoading ? (
            <div style={{ marginTop: 8 }}><Skeleton lines={3} /></div>
          ) : viewing ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
              <div>
                <div style={{ color: '#64748b', fontSize: 12 }}>Patient</div>
                <div style={{ fontWeight: 600 }}>{viewing.patient?.name}</div>
                <div style={{ color: '#64748b' }}>{viewing.patient?.phone}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: 12 }}>Date</div>
                <div style={{ fontWeight: 600 }}>{viewing.date}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: 12 }}>Time</div>
                <div style={{ fontWeight: 600 }}>{viewing.time}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: 12 }}>Status</div>
                <span className={`badge ${viewing.status === 'Scheduled' ? 'badge-warning' : viewing.status === 'Cancelled' ? 'badge-danger' : 'badge-success'}`}>{viewing.status}</span>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 8, color: 'var(--color-muted)' }}>Unable to load details</div>
          )}
        </div>
      )}

      {/* Reschedule drawer */}
      {rescheduleId && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700 }}>Reschedule Appointment</div>
            <button className="btn" onClick={() => { setRescheduleId(''); setForm({ date: '', time: '' }) }}>Close</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <div>
              <label>Date</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} />
            </div>
            <div>
              <label>Time</label>
              <input className="input" type="time" value={form.time} onChange={e => setForm(prev => ({ ...prev, time: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-primary" onClick={confirmReschedule} disabled={actionLoading || !form.date || !form.time}>{actionLoading ? 'Saving...' : 'Confirm'}</button>
          </div>
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
            <th>Date</th>
            <th>Time</th>
            <th>Patient</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-muted)' }}>No appointments found</td>
            </tr>
          ) : items.map((a) => (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{a.date}</td>
              <td>{a.time}</td>
              <td>{a.patient}</td>
              <td>
                <span className={`badge ${a.status === 'Scheduled' ? 'badge-warning' : a.status === 'Cancelled' ? 'badge-danger' : 'badge-success'}`}>{a.status}</span>
              </td>
              <td>
                <button className="btn" onClick={() => openView(a.id)}>View</button>
                <button className="btn" style={{ marginLeft: 8 }} onClick={() => openReschedule(a.id, a.date, a.time)}>Reschedule</button>
                <button className="btn btn-danger" style={{ marginLeft: 8 }} onClick={() => cancel(a.id)} disabled={actionLoading || a.status === 'Cancelled'}>{actionLoading ? '...' : 'Cancel'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  )
}
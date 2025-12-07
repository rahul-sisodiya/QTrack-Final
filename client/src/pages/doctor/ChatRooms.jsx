import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'

export default function ChatRooms() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const userRes = await api.doctor.me(localStorage.getItem('qtrack:user') ? JSON.parse(localStorage.getItem('qtrack:user')).id : '')
        const doctorId = userRes?.doctorId
        if (!doctorId) return setRooms([])
        const r = await api.chat.roomsForDoctor(doctorId)
        if (active) setRooms(r)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ marginTop: 0 }}>Chats</h3>
        <div style={{ color: 'var(--color-muted)' }}>{rooms.length} room(s)</div>
      </div>
      {loading ? (
        <div style={{ marginTop: 12 }}>Loading...</div>
      ) : (
      <table className="table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Room</th>
            <th>Patient</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rooms.length === 0 ? (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', color: 'var(--color-muted)' }}>No chat rooms yet</td>
            </tr>
          ) : rooms.map((r) => (
            <tr key={r._id}>
              <td>{String(r._id)}</td>
              <td>{r.patientId?.userId?.name || r.patientId?.phone || 'Patient'}</td>
              <td>
                <button className="btn btn-primary" onClick={() => navigate(`/doctor/chat/${r._id}`)}>Open</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  )
}
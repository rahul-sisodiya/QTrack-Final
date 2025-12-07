import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

export default function PatientChatRooms() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        if (!token) return setRooms([])
        const me = await api.patient.me(undefined, token)
        const patientId = me?.patientId
        if (!patientId) return setRooms([])
        const r = await api.chat.roomsForPatient(patientId)
        if (active) setRooms(r)
      } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [token])

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ marginTop: 0 }}>Your Chats</h3>
        <div style={{ color: 'var(--color-muted)' }}>{rooms.length} room(s)</div>
      </div>
      {loading ? (
        <div style={{ marginTop: 12 }}>Loading...</div>
      ) : (
      <table className="table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Room</th>
            <th>Doctor</th>
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
              <td>{r.doctorId?.userId?.name || 'Doctor'}</td>
              <td>
                <button className="btn btn-primary" onClick={() => navigate(`/patient/chat/${r._id}`)}>Open</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  )
}
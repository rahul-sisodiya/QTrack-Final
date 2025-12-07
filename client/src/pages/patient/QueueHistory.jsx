import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function QueueHistory() {
  const { user, token } = useAuth()
  const [items, setItems] = useState([])
  const [patientId, setPatientId] = useState('')

  useEffect(() => {
    if (!token) return
    api.patient.me(undefined, token).then(res => setPatientId(res.patientId)).catch(() => setPatientId(''))
  }, [token])

  useEffect(() => {
    if (!patientId) return
    api.patient.queue.history(patientId).then(setItems)
  }, [patientId])

  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Queue History</div>
      <table className="table">
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id}>
              <td>{i.doctor}</td>
              <td>{new Date(i.date).toLocaleString()}</td>
              <td>{i.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
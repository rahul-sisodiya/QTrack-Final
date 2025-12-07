import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register, loading } = useAuth()
  const [error, setError] = useState('')

  async function handleRegister(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload = {
      name: form.get('name'),
      role: form.get('role'),
      email: form.get('email'),
      password: form.get('password'),
    }
    setError('')
    try {
      await register(payload)
      navigate('/auth/login')
    } catch (err) {
      setError(err?.message || 'Registration failed')
    }
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
      <form onSubmit={handleRegister} className="card" style={{ width: 420 }}>
        <h3 style={{ marginTop: 0 }}>Create account</h3>
        {error && (
          <div style={{
            margin: '8px 0',
            padding: '8px 10px',
            borderRadius: 8,
            background: '#fee2e2',
            color: '#7f1d1d',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label>Full name</label>
            <input name="name" className="input" placeholder="Dr. Jane Doe" required />
          </div>
          <div>
            <label>Role</label>
            <select name="role" className="input" defaultValue="doctor">
              <option value="doctor">Doctor</option>
              <option value="patient">Patient</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label>Email</label>
            <input name="email" className="input" type="email" placeholder="you@example.com" required />
          </div>
          <div>
            <label>Password</label>
            <input name="password" className="input" type="password" placeholder="••••••••" required />
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Register'}</button>
          <Link to="/auth/login">Log in</Link>
        </div>
      </form>
    </div>
  )
}
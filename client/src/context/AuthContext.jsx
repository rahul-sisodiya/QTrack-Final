import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('qtrack:user')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('qtrack:token') || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) localStorage.setItem('qtrack:user', JSON.stringify(user))
    else localStorage.removeItem('qtrack:user')
  }, [user])

  useEffect(() => {
    if (token) localStorage.setItem('qtrack:token', token)
    else localStorage.removeItem('qtrack:token')
  }, [token])

  // Apply dark mode on app load based on server preferences (fallback to localStorage during migration)
  useEffect(() => {
    async function applyTheme() {
      try {
        if (token) {
          const prefs = await api.patient.preferences.get(token)
          const dm = !!prefs?.preferences?.darkMode
          if (dm) document.body.classList.add('dark')
          else document.body.classList.remove('dark')
          return
        }
      } catch {}
      // Fallback: legacy localStorage value
      try {
        const legacy = localStorage.getItem('qtrack:pref:dark') === '1'
        if (legacy) document.body.classList.add('dark')
        else document.body.classList.remove('dark')
      } catch {}
    }
    applyTheme()
  }, [token])

  async function login(email, password) {
    setLoading(true)
    try {
      const res = await api.login(email, password)
      setToken(res.token)
      setUser(res.user)
      return res.user
    } finally {
      setLoading(false)
    }
  }

  async function register(payload) {
    setLoading(true)
    try {
      const res = await api.register(payload)
      return res
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setToken('')
    setUser(null)
    try { document.body.classList.remove('dark') } catch {}
  }

  const value = useMemo(() => ({ user, token, loading, login, register, logout }), [user, token, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
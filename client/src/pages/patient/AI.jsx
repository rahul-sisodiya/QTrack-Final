import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

function formatReply(text) {
  let t = String(text || '')
  t = t.replace(/\*\*(.*?)\*\*/g, '$1') // remove bold markdown
  t = t.replace(/(^|\n)\s*[*-]\s+/g, (m, p1) => `${p1}– `) // bullets to dash
  t = t.replace(/\*(.*?)\*/g, '$1') // remove italics markdown
  t = t.replace(/\n{3,}/g, '\n\n') // collapse blank lines
  return t.trim()
}

export default function PatientAI() {
  const { token } = useAuth()
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [suggestions] = useState([
    'What can I do for a sore throat?',
    'Is ibuprofen safe daily?',
    'Diet tips for prediabetes',
    'How to improve sleep quality?',
  ])
  const listRef = useRef(null)
  const abortRef = useRef(null)

  // Load chat sessions on mount
  useEffect(() => {
    if (token) {
      loadSessions()
    }
  }, [token])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  async function loadSessions() {
    if (!token) return
    setLoadingSessions(true)
    try {
      const sessionList = await api.ai.sessions.list(token)
      setSessions(sessionList)
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setLoadingSessions(false)
    }
  }

  async function loadSession(sessionId) {
    if (!token || !sessionId) return
    try {
      const sessionMessages = await api.ai.sessions.messages(sessionId, token)
      setMessages(sessionMessages.map(m => ({
        role: m.role === 'ai' ? 'model' : m.role,
        text: m.text,
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })))
      setCurrentSession(sessionId)
      setShowHistory(false)
    } catch (err) {
      console.error('Failed to load session:', err)
      setError('Failed to load chat history')
    }
  }

  async function askAI(prompt) {
    const q = (prompt ?? input).trim()
    if (!q || loading || !token) return
    
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg = { role: 'user', text: q, time: now }
    setMessages((m) => [...m, userMsg])
    setLoading(true)
    setError('')
    
    const controller = new AbortController()
    abortRef.current = controller
    
    try {
      const res = await api.ai.sessions.ask(q, currentSession, token, { signal: controller.signal })
      const reply = formatReply(res?.reply || 'Sorry, I could not generate an answer.')
      const aiMsg = { 
        role: 'model', 
        text: reply, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }
      setMessages((m) => [...m, aiMsg])
      
      // Update current session ID and refresh sessions list
      if (res.sessionId) {
        setCurrentSession(res.sessionId)
        loadSessions() // Refresh to show new/updated session
      }
      
      setInput('')
    } catch (e) {
      if (e.name === 'AbortError') {
        setError('Generation stopped.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  function stopGenerating() {
    if (abortRef.current) {
      abortRef.current.abort()
    }
  }

  function newChat() {
    setMessages([])
    setCurrentSession(null)
    setInput('')
    setError('')
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
      {/* History Sidebar */}
      {showHistory && (
        <div style={{ 
          width: 280, 
          borderRight: '1px solid #e5e7eb', 
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Chat History</h4>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
            {loadingSessions ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>Loading...</div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>No chat history</div>
            ) : (
              sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  style={{
                    width: '100%',
                    padding: 12,
                    marginBottom: 4,
                    border: 'none',
                    borderRadius: 8,
                    background: currentSession === session.id ? '#e0f2fe' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>
                    {session.title || 'Chat'}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>
                    {new Date(session.lastUsedAt).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="card" style={{ 
        display: 'grid', 
        gridTemplateRows: 'auto 1fr auto', 
        flex: 1,
        border: showHistory ? 'none' : undefined,
        borderRadius: showHistory ? 0 : undefined
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 999, background: '#0ea5e9', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>Q</div>
            <h3 style={{ margin: 0 }}>Q</h3>
            <span className="badge">Powered by Gemini</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn" 
              onClick={() => setShowHistory(!showHistory)}
              style={{ background: showHistory ? '#e0f2fe' : undefined }}
            >
              History
            </button>
            {loading ? (
              <button className="btn" onClick={stopGenerating}>Stop</button>
            ) : (
              <button className="btn" onClick={newChat}>New chat</button>
            )}
          </div>
        </div>

        {/* Persona notice */}
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f8fafc', color: '#334155' }}>
          Important: Q provides general health information and suggestions. Q is not a doctor and cannot provide medical advice. If you are concerned about your health, please contact a qualified healthcare professional.
        </div>

        {/* Conversation */}
        <div ref={listRef} style={{ overflow: 'auto', padding: 12 }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#334155' }}>How can I help today?</div>
              <div style={{ marginTop: 8, color: 'var(--color-muted)' }}>Ask about symptoms, medications, side effects, and self-care tips.</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, maxWidth: 720, margin: '16px auto 0' }}>
                {suggestions.map((s, i) => (
                  <button key={i} className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => askAI(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, maxWidth: 720 }}>
                    {m.role !== 'user' && (
                      <div style={{ width: 28, height: 28, borderRadius: 999, background: '#e2e8f0', color: '#334155', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>Q</div>
                    )}
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: m.role === 'user' ? 'linear-gradient(135deg, #7dd3fc, #60a5fa)' : '#f3f4f6',
                      color: m.role === 'user' ? '#0b1020' : '#0f172a',
                      boxShadow: '0 1px 2px rgba(16,24,40,0.06)'
                    }}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                      {m.time && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textAlign: 'right' }}>{m.time}</div>}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 999, background: '#e2e8f0', color: '#334155', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>Q</div>
                  <div style={{ padding: '10px 12px', borderRadius: 12, background: '#f3f4f6' }}>
                    <span className="typing-dots">•••</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
          <textarea
            className="input"
            placeholder="Message Q"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                askAI()
              }
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={newChat} disabled={loading}>New chat</button>
            <button className="btn btn-primary" disabled={loading || !input.trim() || !token} onClick={() => askAI()}>Send</button>
          </div>
        </div>
        {error && <div style={{ color: '#ef4444', marginTop: 6 }}>{error}</div>}
        <small style={{ color: 'var(--color-muted)', marginTop: 6 }}>
          Q provides general health information. Not a substitute for professional medical advice.
        </small>
      </div>
    </div>
  )
}
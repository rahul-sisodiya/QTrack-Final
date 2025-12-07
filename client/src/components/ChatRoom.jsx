import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { api, API_URL } from '../lib/api'

export default function ChatRoom({ roomId, role }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [connecting, setConnecting] = useState(true)
  const [sendError, setSendError] = useState('')
  const socketRef = useRef(null)
  const bottomRef = useRef(null)
  // Add WebRTC state/refs
  const [isCallActive, setIsCallActive] = useState(false)
  const [incomingOffer, setIncomingOffer] = useState(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  useEffect(() => {
    let active = true
    api.chat.messages(roomId).then((m) => { if (active) setMessages(m) })

    // More resilient transports: allow websocket/polling
    const socket = io(API_URL, { transports: ['websocket', 'polling'] })
    socket.emit('join', roomId)
    socket.emit('identify', { role })
    socket.on('message', (msg) => {
      if (msg.roomId !== roomId) return
      setMessages((prev) => {
        const id = msg._id || msg.id
        if (id && prev.some(p => (p._id || p.id) === id)) return prev
        // Fallback dedupe by text+timestamp
        if (!id && prev.some(p => p.text === msg.text && p.createdAt === msg.createdAt)) return prev
        return [...prev, msg]
      })
    })

    // WebRTC signaling handlers
    socket.on('webrtc:offer', async ({ roomId: r, sdp }) => {
      if (r !== roomId) return
      if (role === 'patient') setIncomingOffer(sdp)
    })
    socket.on('webrtc:answer', async ({ roomId: r, sdp }) => {
      if (r !== roomId) return
      try {
        if (pcRef.current) await pcRef.current.setRemoteDescription({ type: 'answer', sdp })
      } catch {}
    })
    socket.on('webrtc:ice-candidate', async ({ roomId: r, candidate }) => {
      if (r !== roomId) return
      try {
        if (pcRef.current && candidate) await pcRef.current.addIceCandidate(candidate)
      } catch {}
    })
    socket.on('webrtc:end', ({ roomId: r }) => {
      if (r !== roomId) return
      endCallCleanup()
    })

    socketRef.current = socket
    setConnecting(false)
    return () => { active = false; socket.disconnect() }
  }, [roomId, role])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const trimmed = text.trim()
    if (!trimmed) return
    // Optimistic add pending message
    const tempId = `temp:${Date.now()}`
    const pendingMsg = { id: tempId, _id: tempId, roomId, senderRole: role, text: trimmed, createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, pendingMsg])
    setText('')
    try {
      const msg = await api.chat.sendMessage(roomId, role, trimmed)
      // Replace pending with actual message
      setMessages(prev => prev.map(m => ((m._id || m.id) === tempId) ? msg : m))
      setSendError('')
    } catch (err) {
      // Remove pending on failure and show error
      setMessages(prev => prev.filter(m => (m._id || m.id) !== tempId))
      setSendError(err?.message || 'Failed to send message')
    }
  }

  function createPeer() {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    pc.onicecandidate = (e) => {
      if (e.candidate) socketRef.current?.emit('webrtc:ice-candidate', { roomId, candidate: e.candidate })
    }
    pc.ontrack = (e) => {
      const [stream] = e.streams
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream
    }
    return pc
  }

  async function ensureLocalStream() {
    if (!localStreamRef.current) {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
      }
    }
  }

  async function startCall() {
    if (role !== 'doctor' || isCallActive) return
    try {
      await ensureLocalStream()
      const pc = createPeer()
      pcRef.current = pc
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current))
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socketRef.current?.emit('webrtc:offer', { roomId, sdp: offer.sdp })
      setIsCallActive(true)
    } catch {}
  }

  async function acceptCall() {
    if (role !== 'patient' || !incomingOffer) return
    try {
      await ensureLocalStream()
      const pc = createPeer()
      pcRef.current = pc
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current))
      await pc.setRemoteDescription({ type: 'offer', sdp: incomingOffer })
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socketRef.current?.emit('webrtc:answer', { roomId, sdp: answer.sdp })
      setIsCallActive(true)
      setIncomingOffer(null)
    } catch {}
  }

  function declineCall() {
    setIncomingOffer(null)
    socketRef.current?.emit('webrtc:end', { roomId })
    endCallCleanup()
  }

  function endCall() {
    socketRef.current?.emit('webrtc:end', { roomId })
    endCallCleanup()
  }

  function endCallCleanup() {
    try { pcRef.current?.getSenders()?.forEach(s => s.track?.stop()) } catch {}
    try { localStreamRef.current?.getTracks()?.forEach(t => t.stop()) } catch {}
    try { pcRef.current?.close() } catch {}
    pcRef.current = null
    setIsCallActive(false)
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current || null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
  }

  // Ensure input bar stays at bottom when no video area
  const rows = (isCallActive || incomingOffer) ? 'auto 1fr auto' : '1fr auto'

  return (
    <div className="card" style={{ display: 'grid', gridTemplateRows: rows, height: '100%' }}>
      {/* Video area */}
      {(isCallActive || incomingOffer) && (
        <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
          <video ref={localVideoRef} muted playsInline autoPlay style={{ width: '50%', background: '#000', borderRadius: 8 }} />
          <video ref={remoteVideoRef} playsInline autoPlay style={{ width: '50%', background: '#000', borderRadius: 8 }} />
        </div>
      )}

      {/* Messages */}
      <div style={{ overflow: 'auto', paddingRight: 8 }}>
        {connecting && <div className="badge">Connecting...</div>}
        {messages.map(m => (
          <div key={m._id || m.id || `${m.senderRole}:${m.text}:${m.createdAt || ''}`} style={{
            display: 'flex',
            justifyContent: m.senderRole === role ? 'flex-end' : 'flex-start',
            margin: '6px 0'
          }}>
            <div className={m.senderRole === role ? 'bubble me' : 'bubble'}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Incoming call prompt (patient) */}
      {(role === 'patient' && incomingOffer) && (
        <div className="card" style={{ padding: 8, marginBottom: 8 }}>
          <div style={{ marginBottom: 8 }}>Incoming video call</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={acceptCall}>Accept</button>
            <button className="btn" onClick={declineCall}>Decline</button>
          </div>
        </div>
      )}

      {/* Input & call controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="input" placeholder="Type a message" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} />
          <button className="btn btn-primary" style={{ height: 36 }} onClick={send}>Send</button>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
          {role === 'doctor' && !isCallActive && (
            <button className="btn" style={{ height: 36 }} onClick={startCall}>Start video call</button>
          )}
          {isCallActive && (
            <button className="btn" style={{ height: 36 }} onClick={endCall}>End call</button>
          )}
        </div>
      </div>
      {sendError && <div style={{ color: '#ef4444', marginTop: 6 }}>{sendError}</div>}
    </div>
  )
}
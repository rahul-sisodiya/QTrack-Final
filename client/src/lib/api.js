export const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:4002'

export function apiFetch(path, { method = 'GET', body, token, signal } = {}) {
  return fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.message || `API error ${res.status}`)
    return data
  })
}

export const api = {
  login: (email, password) => apiFetch('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload) => apiFetch('/api/auth/register', { method: 'POST', body: payload }),
  doctor: {
    appointments: (token) => apiFetch('/api/doctor/appointments', { token }),
    appointment: (id) => apiFetch(`/api/doctor/appointments/${id}`),
    rescheduleAppointment: (id, date, time) => apiFetch(`/api/doctor/appointments/${id}/reschedule`, { method: 'PATCH', body: { date, time } }),
    cancelAppointment: (id) => apiFetch(`/api/doctor/appointments/${id}/cancel`, { method: 'PATCH' }),
    patients: (token) => apiFetch('/api/doctor/patients', { token }),
    saveAvailability: (token, slots) => apiFetch('/api/doctor/availability', { method: 'POST', body: { slots }, token }),
    me: (userId) => apiFetch(`/api/doctor/me?userId=${encodeURIComponent(userId)}`),
    dashboard: (doctorId) => apiFetch(`/api/doctor/dashboard/${doctorId}`),
    queueCurrent: (doctorId) => apiFetch(`/api/queue/doctor/${doctorId}/current`),
    queueServe: (queueId) => apiFetch(`/api/queue/serve/${queueId}`, { method: 'PATCH' }),
    queueCancel: (queueId) => apiFetch(`/api/queue/cancel/${queueId}`, { method: 'PATCH' }),
    queueDefer: (queueId) => apiFetch(`/api/queue/defer/${queueId}`, { method: 'PATCH' }),
  },
  patient: {
    doctors: () => apiFetch('/api/patient/doctors'),
    createAppointment: (payload) => apiFetch('/api/patient/appointments', { method: 'POST', body: payload }),
    me: (userId, token) => {
      const path = userId ? `/api/patient/me?userId=${encodeURIComponent(userId)}` : '/api/patient/me'
      return apiFetch(path, { token })
    },
    preferences: {
      get: (token) => apiFetch('/api/patient/preferences', { token }),
      update: (token, data) => apiFetch('/api/patient/preferences', { method: 'PUT', body: data, token }),
    },
    queue: {
      join: (doctorId, patientId) => {
        const body = { doctorId }
        if (patientId) body.patientId = patientId
        return apiFetch('/api/queue/join', { method: 'POST', body })
      },
      status: (queueId) => apiFetch(`/api/queue/status/${queueId}`),
      leave: (queueId) => apiFetch(`/api/queue/leave/${queueId}`, { method: 'PATCH' }),
      history: (patientId) => apiFetch(`/api/queue/history/patient/${patientId}`),
    },
    records: {
      list: (patientId) => apiFetch(`/api/records/patient/${patientId}`),
      upload: (payload) => apiFetch('/api/records/upload', { method: 'POST', body: payload }),
      remove: (id) => apiFetch(`/api/records/${id}`, { method: 'DELETE' }),
    },
  },
  admin: {
    summary: () => apiFetch('/api/admin/summary'),
  },
  chat: {
    createRoom: (doctorId, patientId) => apiFetch('/api/chat/room', { method: 'POST', body: { doctorId, patientId } }),
    roomsForDoctor: (doctorId) => apiFetch(`/api/chat/rooms/doctor/${doctorId}`),
    roomsForPatient: (patientId) => apiFetch(`/api/chat/rooms/patient/${patientId}`),
    messages: (roomId) => apiFetch(`/api/chat/messages/${roomId}`),
    sendMessage: (roomId, senderRole, text) => apiFetch('/api/chat/messages', { method: 'POST', body: { roomId, senderRole, text } }),
  },
  ai: {
    ask: (prompt, history = [], opts = {}) => apiFetch('/api/ai/ask', { method: 'POST', body: { prompt, history }, ...opts }),
    sessions: {
      list: (token) => apiFetch('/api/ai/sessions', { token }),
      messages: (sessionId, token) => apiFetch(`/api/ai/sessions/${sessionId}/messages`, { token }),
      ask: (prompt, sessionId, token, opts = {}) => apiFetch('/api/ai/ask', { method: 'POST', body: { prompt, sessionId }, token, ...opts }),
    },
  }
}
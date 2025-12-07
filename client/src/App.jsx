import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

import DashboardLayout from './layouts/DashboardLayout.jsx'
import DoctorLayout from './layouts/DoctorLayout.jsx'
import PatientLayout from './layouts/PatientLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PatientAI from './pages/patient/AI.jsx'

// Doctor portal
import DoctorDashboard from './pages/doctor/Dashboard.jsx'
import Appointments from './pages/doctor/Appointments.jsx'
import Patients from './pages/doctor/Patients.jsx'
import Schedule from './pages/doctor/Schedule.jsx'
import Settings from './pages/doctor/Settings.jsx'
import DoctorChatRooms from './pages/doctor/ChatRooms.jsx'
import DoctorChatRoom from './pages/doctor/ChatRoom.jsx'

// Patient portal
import PatientDashboard from './pages/patient/Dashboard.jsx'
import BookAppointment from './pages/patient/BookAppointment.jsx'
import PatientChatRooms from './pages/patient/ChatRooms.jsx'
import PatientChatRoom from './pages/patient/ChatRoom.jsx'
import JoinQueue from './pages/patient/JoinQueue.jsx'
import Records from './pages/patient/Records.jsx'
import QueueHistory from './pages/patient/QueueHistory.jsx'
import MedicalHistory from './pages/patient/MedicalHistory.jsx'
import PatientSettings from './pages/patient/Settings.jsx'

// Admin portal
import AdminDashboard from './pages/admin/Dashboard.jsx'

// Auth
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/RegisterLinkedIn.jsx'
import Landing from './pages/marketing/Landing.jsx'

function App() {
  return (
    <Routes>
      {/* Public Landing */}
      <Route path="/" element={<Landing />} />
      {/* Auth */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />

      {/* Doctor Portal */}
      <Route path="/doctor" element={<ProtectedRoute role="doctor"><DoctorLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="chat" element={<DoctorChatRooms />} />
        <Route path="chat/:roomId" element={<DoctorChatRoom />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/:patientId" element={<Patients />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Patient Portal */}
      <Route path="/patient" element={<ProtectedRoute role="patient"><PatientLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="chat" element={<PatientChatRooms />} />
        <Route path="chat/:roomId" element={<PatientChatRoom />} />
        <Route path="book" element={<BookAppointment />} />
        <Route path="queue" element={<JoinQueue />} />
        <Route path="records" element={<Records />} />
        <Route path="history" element={<QueueHistory />} />
        <Route path="medical-history" element={<MedicalHistory />} />
        <Route path="settings" element={<PatientSettings />} />
        <Route path="ai" element={<PatientAI />} />
      </Route>

      {/* Admin Portal */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/doctor/dashboard" />} />
    </Routes>
  )
}

export default App

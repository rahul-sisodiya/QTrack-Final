import { useParams } from 'react-router-dom'
import ChatRoom from '../../components/ChatRoom.jsx'

export default function PatientChatRoom() {
  const { roomId } = useParams()
  return (
    <div style={{ height: 'calc(100vh - 160px)' }}>
      <ChatRoom roomId={roomId} role="patient" />
    </div>
  )
}
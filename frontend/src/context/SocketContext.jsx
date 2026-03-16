import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useSelector(s => s.auth);
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // ✅ Fix: Use separate SOCKET_URL env variable
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
                       import.meta.env.VITE_API_URL?.replace('/api', '') || 
                       'http://localhost:5000';

    // ✅ Fix: Add credentials and reconnection options
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('register', { userId: user.id, role: user.role });
    });

    socketRef.current.on('notification', (notif) => {
      setNotifications(prev => [{ ...notif, id: Date.now(), seen: false }, ...prev.slice(0, 49)]);
      setUnreadCount(c => c + 1);

      if (notif.type === 'JOB_ACCEPTED') {
        toast.success(notif.message, { icon: '🎉', duration: 5000 });
      } else if (notif.type === 'JOB_COMPLETED') {
        toast(notif.message, { icon: '✅', duration: 5000 });
      } else if (notif.type === 'NEW_MESSAGE') {
        toast(notif.message, { icon: '💬', duration: 3000 });
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [isAuthenticated, user]);

  const joinJobRoom  = (jobId) => socketRef.current?.emit('join_job', jobId);
  const leaveJobRoom = (jobId) => socketRef.current?.emit('leave_job', jobId);
  const sendTyping   = (jobId, senderName) => socketRef.current?.emit('typing', { jobId, senderName });
  const stopTyping   = (jobId) => socketRef.current?.emit('stop_typing', { jobId });
  const markAllRead  = () => { setUnreadCount(0); setNotifications(prev => prev.map(n => ({ ...n, seen: true }))); };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      notifications,
      unreadCount,
      joinJobRoom,
      leaveJobRoom,
      sendTyping,
      stopTyping,
      markAllRead,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
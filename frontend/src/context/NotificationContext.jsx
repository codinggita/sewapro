import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notifications')) || []; }
    catch { return []; }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (message, type = 'info', icon = '🔔') => {
    const notif = { id: Date.now(), message, type, icon, isRead: false, createdAt: new Date().toISOString() };
    setNotifications(prev => [notif, ...prev].slice(0, 20));
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

  const removeNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

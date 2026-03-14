import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { timeAgo } from '../utils/timeAgo';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, removeNotification } = useNotifications();
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen(!open); if (open) markAllRead(); }}
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
        <Bell size={20} className="text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-50">
          <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-700">
            <p className="font-semibold text-gray-800 dark:text-white">Notifications</p>
            <button onClick={markAllRead} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Mark all read</button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0
              ? <p className="text-center text-sm text-gray-400 dark:text-slate-500 py-8">No notifications</p>
              : notifications.slice(0, 5).map(n => (
                <div key={n.id} className={`flex items-start gap-3 p-3 border-b border-gray-50 dark:border-slate-700/50 ${!n.isRead ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}>
                  <span className="text-xl">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{n.message}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button onClick={() => removeNotification(n.id)} className="text-gray-300 dark:text-slate-600 hover:text-red-500 text-xs">✕</button>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};
export default NotificationBell;

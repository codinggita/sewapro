import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LayoutDashboard, Map, PlusSquare, Briefcase, Users, Calendar, IndianRupee, User, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { logout } from '../redux/authSlice';

const adminLinks = [
  { to: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/map', icon: Map, label: 'Live Map' },
  { to: '/admin/post-job', icon: PlusSquare, label: 'Post Job' },
  { to: '/admin/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/admin/workers', icon: Users, label: 'Workers' },
  { to: '/admin/calendar', icon: Calendar, label: 'Calendar' },
];
const workerLinks = [
  { to: '/dashboard/worker', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/worker/earnings', icon: IndianRupee, label: 'Earnings' },
  { to: '/worker/profile', icon: User, label: 'Profile' },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { role, user } = useSelector(s => s.auth);
  const links = role === 'admin' ? adminLinks : workerLinks;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className={`fixed left-0 top-0 h-full ${collapsed ? 'w-16' : 'w-64'} bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-700 flex flex-col transition-all duration-300 z-40`}>
      <div className={`p-4 border-b border-gray-100 dark:border-slate-700 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">🌉 SewaPro</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        {links.map(link => {
          const Icon = link.icon;
          const active = location.pathname === link.to;
          return (
            <Link key={link.to} to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all ${active ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
              <Icon size={18} />
              {!collapsed && <span className="text-sm font-medium">{link.label}</span>}
            </Link>
          );
        })}
        <Link to="/profile/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 ${location.pathname === '/profile/settings' ? 'bg-indigo-600 text-white' : ''}`}>
          <Settings size={18} />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </Link>
      </nav>

      <div className="p-3 border-t border-gray-100 dark:border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{role}</p>
            </div>
          </div>
        )}
        <button onClick={handleLogout}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors w-full ${collapsed ? 'justify-center' : ''}`}>
          <LogOut size={18} />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};
export default Sidebar;

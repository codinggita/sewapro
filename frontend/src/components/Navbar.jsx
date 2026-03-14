import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Moon, Sun, User, LogOut, ChevronDown, Wrench, Menu, X, MapPin } from 'lucide-react';
import { toggleTheme } from '../redux/themeSlice';
import { logout } from '../redux/authSlice';
import { setLang } from '../redux/langSlice';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from './AuthModal';
import { useLang } from '../hooks/useLang';

const Navbar = () => {
  const [authModal, setAuthModal] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, role } = useSelector(s => s.auth);
  const { mode } = useSelector(s => s.theme);
  const { lang } = useSelector(s => s.lang);
  const { t } = useLang();

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { dispatch(logout()); setDropdownOpen(false); navigate('/'); };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 group-hover:scale-105 transition-transform">
              <Wrench size={15} className="text-white"/>
            </div>
            <span className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">Sewa<span className="text-indigo-600">Pro</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">{t('home')}</Link>
            {isAuthenticated && (
              <Link to={role==='client'?'/client/dashboard':role==='admin'?'/admin/dashboard':'/worker/dashboard'}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">{t('dashboard')}</Link>
            )}
            {isAuthenticated && role==='client' && (
              <Link to="/client/nearby" className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all">
                <MapPin size={14}/> {t('nearbyWorkers')}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="hidden md:flex items-center bg-gray-100 dark:bg-slate-800 rounded-xl p-0.5 gap-0.5">
              {[['en','EN'],['hi','हि'],['gu','ગુ']].map(([code,label]) => (
                <button key={code} onClick={() => dispatch(setLang(code))}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${lang===code?'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm':'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>

            <button onClick={() => dispatch(toggleTheme())} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-gray-500">
              {mode==='dark'?<Sun size={17} className="text-amber-400"/>:<Moon size={17}/>}
            </button>

            {!isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <button onClick={() => setAuthModal('login')} className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">{t('login')}</button>
                <button onClick={() => setAuthModal('signup')} className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-none">{t('signup')}</button>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(o=>!o)} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md ${role==='admin'?'bg-gradient-to-br from-red-500 to-rose-600':'bg-gradient-to-br from-indigo-500 to-indigo-700'}`}>
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold text-gray-800 dark:text-white leading-tight">{user?.name}</p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium capitalize">{role}</p>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen?'rotate-180':''}`}/>
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div initial={{opacity:0,y:8,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:0.95}} transition={{duration:0.15}}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden z-50">
                      <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${role==='admin'?'bg-gradient-to-br from-red-500 to-rose-600':'bg-gradient-to-br from-indigo-500 to-indigo-700'}`}>{user?.name?.[0]?.toUpperCase()}</div>
                          <div><p className="text-sm font-bold text-gray-900 dark:text-white">{user?.name}</p><p className="text-xs text-indigo-600 capitalize font-medium">{role}</p></div>
                        </div>
                      </div>
                      <div className="p-2">
                        <Link to={role==='client'?'/client/dashboard':role==='admin'?'/admin/dashboard':'/worker/dashboard'} onClick={()=>setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 rounded-xl transition-all font-medium">
                          <User size={15}/> {t('dashboard')}
                        </Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all font-medium mt-1">
                          <LogOut size={15}/> {t('logout')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all" onClick={()=>setMobileOpen(o=>!o)}>
              {mobileOpen?<X size={18}/>:<Menu size={18}/>}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
              className="md:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pb-4 space-y-1 overflow-hidden">
              <Link to="/" onClick={()=>setMobileOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">{t('home')}</Link>
              <div className="flex gap-1 py-2">
                {[['en','EN'],['hi','हि'],['gu','ગુ']].map(([code,label])=>(
                  <button key={code} onClick={()=>dispatch(setLang(code))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${lang===code?'bg-indigo-600 text-white':'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'}`}>{label}</button>
                ))}
              </div>
              {!isAuthenticated ? (
                <>
                  <button onClick={()=>{setAuthModal('login');setMobileOpen(false);}} className="w-full text-left py-2.5 px-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">{t('login')}</button>
                  <button onClick={()=>{setAuthModal('signup');setMobileOpen(false);}} className="w-full text-left py-2.5 px-3 text-sm font-semibold text-white bg-indigo-600 rounded-xl">{t('signup')}</button>
                </>
              ) : (
                <>
                  <Link to={role==='client'?'/client/dashboard':role==='admin'?'/admin/dashboard':'/worker/dashboard'} onClick={()=>setMobileOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">{t('dashboard')}</Link>
                  <button onClick={handleLogout} className="w-full text-left py-2.5 px-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all">{t('logout')}</button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      {authModal && <AuthModal initialTab={authModal} onClose={()=>setAuthModal(null)}/>}
    </>
  );
};

export default Navbar;

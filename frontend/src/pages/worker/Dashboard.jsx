import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Briefcase, Star, CheckCircle, Clock, LogOut, MapPin,
  XCircle, Phone, List, Map as MapIcon, Wifi, WifiOff,
  IndianRupee, RefreshCw, Wrench, Zap, Hammer,
  Paintbrush2, Award, Settings, MessageCircle, TrendingUp,
  Sun, Moon, Navigation, User, X, Edit, Calendar, Camera,
  BarChart2, QrCode, Download, Plus, Trash2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/axiosInstance';
import { logout } from '../../redux/authSlice';
import { toggleTheme } from '../../redux/themeSlice';
import { useNavigate } from 'react-router-dom';
import ChatModal from '../../components/ChatModal';
import { useLang } from '../../hooks/useLang';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize:[25,41], iconAnchor:[12,41] });
const clientIcon = L.divIcon({ className:'', html:`<div style="width:30px;height:30px;background:#10b981;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;box-shadow:0 4px 12px rgba(16,185,129,.4)">C</div>`, iconSize:[30,30], iconAnchor:[15,15] });

const catIcon = (cat) => ({ Plumber:Wrench, Electrician:Zap, Carpenter:Hammer, Painter:Paintbrush2, Mason:Award, Welder:Settings }[cat] || Briefcase);
const Stars = ({ v=0, size=13 }) => <div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={size} className={i<=Math.round(v||0)?'fill-amber-400 text-amber-400':'text-gray-300 dark:text-gray-600'}/>)}</div>;
const formatAgo = (d) => { const s=Math.floor((Date.now()-new Date(d))/1000); return s<60?'just now':s<3600?Math.floor(s/60)+'m ago':Math.floor(s/3600)+'h ago'; };

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const WorkerDashboard = () => {
  const { user } = useSelector(s => s.auth);
  const { mode } = useSelector(s => s.theme);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t }    = useLang();

  const [nearbyJobs, setNearbyJobs]     = useState([]);
  const [activeJobs, setActiveJobs]     = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [isAvailable, setIsAvailable]   = useState(false);
  const [loading, setLoading]           = useState(true);
  const [earnings, setEarnings]         = useState(0);
  const [viewMode, setViewMode]         = useState('list');
  const [workerLocation, setWorkerLocation] = useState([72.5714, 23.0225]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [profile, setProfile]           = useState(null);
  const [searchRadius, setSearchRadius] = useState(20);
  const [showRadiusPanel, setShowRadiusPanel] = useState(false);
  const [savingRadius, setSavingRadius] = useState(false);
  const [chatJob, setChatJob]           = useState(null);
  const [qrModal, setQrModal]           = useState(null);
  const [analytics, setAnalytics]       = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [editForm, setEditForm]         = useState({});
  const [schedule, setSchedule]         = useState({ monday:true,tuesday:true,wednesday:true,thursday:true,friday:true,saturday:true,sunday:false });
  const [workingHours, setWorkingHours] = useState({ start:'08:00', end:'20:00' });
  const [portfolio, setPortfolio]       = useState([]);
  const [savingEdit, setSavingEdit]     = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const prevJobCount = useRef(0);
  const locInterval  = useRef(null);
  const pollRef      = useRef(null);

  const playNotifSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  const fetchNearby = async () => {
    try {
      const { data } = await api.get('/worker/nearby-jobs');
      const arr = Array.isArray(data) ? data : [];
      if (arr.length > prevJobCount.current) { playNotifSound(); toast('New job nearby!', { icon:'🔔' }); }
      prevJobCount.current = arr.length;
      setNearbyJobs(arr);
    } catch {}
  };

  const fetchData = async () => {
    try {
      const [pR,eR,aR] = await Promise.allSettled([api.get('/worker/profile'),api.get('/worker/earnings'),api.get('/worker/active-jobs')]);
      if (pR.status==='fulfilled') {
        const p=pR.value.data; setProfile(p); setIsAvailable(p.isAvailable);
        setSearchRadius(p.searchRadius||20); setPortfolio(p.portfolio||[]);
        setEditForm({ name:p.name, phone:p.phone, pricePerHour:p.pricePerHour, bio:p.bio||'', experience:p.experience, city:p.city||'' });
        if (p.availabilitySchedule) setSchedule(p.availabilitySchedule);
        if (p.workingHours) setWorkingHours(p.workingHours);
        if (p.liveLocation?.coordinates?.[0]!==0) setWorkerLocation(p.liveLocation.coordinates);
      }
      if (eR.status==='fulfilled') { setEarnings(eR.value.data.totalEarnings||0); setCompletedJobs(eR.value.data.jobs||[]); }
      if (aR.status==='fulfilled') setActiveJobs(aR.value.data||[]);
      await fetchNearby();
    } catch {}
    finally { setLoading(false); }
  };

  const fetchAnalytics = async () => {
    try { const { data } = await api.get('/worker/analytics'); setAnalytics(data); } catch {}
  };

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchNearby, 30000);
    return () => { clearInterval(pollRef.current); clearInterval(locInterval.current); };
  }, []);

  useEffect(() => { if (showAnalytics && !analytics) fetchAnalytics(); }, [showAnalytics]);

  const updateLoc = () => navigator.geolocation?.getCurrentPosition(async (p) => {
    try { const c=[p.coords.longitude,p.coords.latitude]; setWorkerLocation(c); await api.patch('/worker/location',{coordinates:c}); } catch {}
  });

  const handleGoOnline = async () => {
    setLocationLoading(true);
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); setLocationLoading(false); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const c=[pos.coords.longitude,pos.coords.latitude];
        await api.patch('/worker/availability',{isAvailable:true});
        await api.patch('/worker/location',{coordinates:c});
        setIsAvailable(true); setWorkerLocation(c); toast.success('You are Online!');
        fetchNearby();
        if (locInterval.current) clearInterval(locInterval.current);
        locInterval.current = setInterval(updateLoc, 60000);
      } catch { toast.error('Failed to go online'); }
      finally { setLocationLoading(false); }
    }, () => { toast.error('Location permission required'); setLocationLoading(false); });
  };

  const handleGoOffline = async () => {
    try { await api.patch('/worker/availability',{isAvailable:false}); setIsAvailable(false); clearInterval(locInterval.current); toast.success('You are Offline'); } catch {}
  };

  const handleSaveRadius = async () => {
    setSavingRadius(true);
    try { await api.patch('/worker/search-radius',{radius:searchRadius}); toast.success(`Radius: ${searchRadius}km`); setShowRadiusPanel(false); fetchNearby(); } catch { toast.error('Failed'); }
    finally { setSavingRadius(false); }
  };

  const handleAccept = async (id) => {
    try { await api.post(`/worker/jobs/${id}/accept`); toast.success('Job accepted!'); setNearbyJobs(p=>p.filter(j=>j._id!==id)); fetchData(); } catch (err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  const handleReject = async (id) => {
    try { await api.post(`/worker/jobs/${id}/reject`); setNearbyJobs(p=>p.filter(j=>j._id!==id)); toast('Skipped',{icon:'👋'}); } catch {}
  };

  const handleComplete = async (id) => {
    try {
      const { data } = await api.patch(`/worker/jobs/${id}/complete`);
      toast.success('Job completed!');
      if (data.qrCode) setQrModal(data.qrCode);
      fetchData();
    } catch { toast.error('Failed'); }
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try { await api.put('/worker/profile', editForm); toast.success('Profile updated!'); setShowEditProfile(false); fetchData(); } catch { toast.error('Failed'); }
    finally { setSavingEdit(false); }
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try { await api.patch('/worker/schedule',{availabilitySchedule:schedule,workingHours}); toast.success('Schedule saved!'); setShowSchedule(false); } catch { toast.error('Failed'); }
    finally { setSavingSchedule(false); }
  };

  const handleAddPortfolioPhoto = (e) => {
    const file = e.target.files[0]; if(!file) return;
    const caption = prompt('Caption for this photo (optional):') || '';
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try { const { data } = await api.post('/worker/portfolio',{photoUrl:ev.target.result,caption}); setPortfolio(data); toast.success('Photo added!'); } catch { toast.error('Max 6 photos allowed'); }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePortfolioPhoto = async (index) => {
    try { const { data } = await api.delete(`/worker/portfolio/${index}`); setPortfolio(data); toast.success('Photo deleted'); } catch { toast.error('Failed'); }
  };

  const card = "bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm";
  const modal = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm";
  const modalCard = "bg-white dark:bg-slate-900 rounded-3xl p-6 w-full shadow-2xl border border-gray-100 dark:border-slate-800";
  const inp = "w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin"/>
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold shadow-md shrink-0">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user?.name}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wide">{profile?.category}</p>
                {profile?.rating>0&&<span className="text-[10px] text-amber-500 font-bold">{profile.rating.toFixed(1)}★</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button onClick={()=>setShowRadiusPanel(s=>!s)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-all">
              <Navigation size={13}/> {searchRadius}km
            </button>
            <button onClick={isAvailable?handleGoOffline:handleGoOnline} disabled={locationLoading}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isAvailable?'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-none':'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'} disabled:opacity-60`}>
              {locationLoading?<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>:isAvailable?<Wifi size={14}/>:<WifiOff size={14}/>}
              <span className="hidden sm:inline">{locationLoading?'GPS...':isAvailable?t('goOffline'):t('goOnline')}</span>
            </button>
            <button onClick={()=>dispatch(toggleTheme())} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-gray-500">
              {mode==='dark'?<Sun size={16} className="text-amber-400"/>:<Moon size={16}/>}
            </button>
            <button onClick={()=>{dispatch(logout());navigate('/');}} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><LogOut size={16}/></button>
          </div>
        </div>

        {/* Radius panel */}
        <AnimatePresence>
          {showRadiusPanel && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
              className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
                <Navigation size={14} className="text-indigo-500 shrink-0"/>
                <div className="flex-1">
                  <div className="flex justify-between mb-1"><label className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('searchRadius')}</label><span className="text-xs font-bold text-indigo-600">{searchRadius} km</span></div>
                  <input type="range" min={5} max={100} step={5} value={searchRadius} onChange={e=>setSearchRadius(Number(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-600"/>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>5km</span><span>50km</span><span>100km</span></div>
                </div>
                <button onClick={handleSaveRadius} disabled={savingRadius} className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50">
                  {savingRadius?'Saving...':t('save')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label:t('nearby'),    value:nearbyJobs.length,   icon:MapPin,      bg:'bg-amber-50 dark:bg-amber-900/10',    text:'text-amber-500' },
            { label:t('activeJobs'),value:activeJobs.length,   icon:Briefcase,   bg:'bg-indigo-50 dark:bg-indigo-900/10',  text:'text-indigo-600' },
            { label:t('completed'), value:completedJobs.length, icon:CheckCircle, bg:'bg-emerald-50 dark:bg-emerald-900/10', text:'text-emerald-600' },
            { label:t('earnings'),  value:`₹${earnings}`,       icon:IndianRupee, bg:'bg-indigo-50 dark:bg-indigo-900/10',  text:'text-indigo-600' },
          ].map((s,i) => (
            <motion.div key={s.label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
              className={`${card} p-4`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${s.bg}`}><s.icon size={17} className={s.text}/></div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Offline banner */}
        {!isAvailable && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-3.5 flex items-center gap-3">
            <WifiOff size={17} className="text-amber-500 shrink-0"/>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-400 flex-1">You are <strong>Offline</strong> — go Online to receive job requests</p>
            <button onClick={handleGoOnline} disabled={locationLoading} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all">{t('goOnline')}</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Active Jobs */}
            {activeJobs.length>0 && (
              <section>
                <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"/> {t('activeJobs')}
                  <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">{activeJobs.length}</span>
                </h2>
                <div className="space-y-3">
                  {activeJobs.map(job => (
                    <div key={job._id} className={`${card} p-4 border-l-4 border-l-indigo-500`}>
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{job.title}</h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center shrink-0">
                                {job.clientId?.profilePhoto?<img src={job.clientId.profilePhoto} alt="" className="w-6 h-6 rounded-lg object-cover"/>:<User size={11} className="text-emerald-600"/>}
                              </div>
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{job.clientId?.name}</span>
                            </div>
                            {job.clientId?.phone && <a href={`tel:${job.clientId.phone}`} className="flex items-center gap-0.5 text-xs text-emerald-600 font-semibold"><Phone size={11}/> {job.clientId.phone}</a>}
                          </div>
                          {job.location?.address && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><MapPin size={10}/>{job.location.address}</p>}
                          {job.location?.coordinates?.[0]!==0 && (
                            <div className="mt-2 h-28 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700">
                              <MapContainer center={[job.location.coordinates[1],job.location.coordinates[0]]} zoom={13} style={{height:'100%',width:'100%'}} zoomControl={false}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                                <Marker position={[job.location.coordinates[1],job.location.coordinates[0]]} icon={clientIcon}>
                                  <Popup><div className="text-xs font-bold text-emerald-700">Client Location</div></Popup>
                                </Marker>
                              </MapContainer>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button onClick={()=>setChatJob(job)} className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"><MessageCircle size={12}/> {t('chat')}</button>
                          <button onClick={()=>handleComplete(job._id)} className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all"><CheckCircle size={12}/> Done</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Nearby Jobs */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <MapPin size={14} className="text-amber-500"/> Nearby Requests
                  {nearbyJobs.length>0&&<span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-xs font-bold px-2 py-0.5 rounded-full">{nearbyJobs.length}</span>}
                </h2>
                <div className="flex gap-2">
                  <button onClick={async()=>{setRefreshing(true);await fetchNearby();setTimeout(()=>setRefreshing(false),600);}} className={`p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all ${refreshing?'animate-spin':''}`}><RefreshCw size={13}/></button>
                  <div className="flex bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-0.5">
                    <button onClick={()=>setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode==='list'?'bg-indigo-600 text-white':'text-gray-400'}`}><List size={13}/></button>
                    <button onClick={()=>setViewMode('map')}  className={`p-1.5 rounded-lg transition-all ${viewMode==='map'?'bg-indigo-600 text-white':'text-gray-400'}`}><MapIcon size={13}/></button>
                  </div>
                </div>
              </div>

              {viewMode==='map' ? (
                <div className="h-80 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm">
                  <MapContainer center={[workerLocation[1],workerLocation[0]]} zoom={13} style={{height:'100%',width:'100%'}}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                    {nearbyJobs.map(job=>job.location?.coordinates?.[0]!==0&&(
                      <Marker key={job._id} position={[job.location.coordinates[1],job.location.coordinates[0]]}>
                        <Popup><div className="p-1 min-w-[170px]"><p className="font-bold text-sm text-gray-800">{job.title}</p><p className="text-xs text-indigo-600 font-semibold">{job.category}</p><p className="text-xs font-bold text-gray-700 mt-1">₹{job.budget?.min}–₹{job.budget?.max}</p><button onClick={()=>handleAccept(job._id)} className="w-full mt-2 bg-indigo-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-indigo-700 transition-all">Accept</button></div></Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {nearbyJobs.length===0 ? (
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} className={`${card} p-10 text-center border-dashed`}>
                        <div className="w-14 h-14 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3"><Briefcase size={24} className="text-gray-400 dark:text-gray-500"/></div>
                        <p className="font-semibold text-gray-500 dark:text-gray-400 text-sm">{t('noJobsFound').replace('radius',`${searchRadius}km`)}</p>
                        <p className="text-xs text-gray-400 mt-1">{isAvailable?'Auto-refreshing every 30s':'Go Online to see jobs'}</p>
                        <button onClick={()=>setShowRadiusPanel(true)} className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 mx-auto"><Navigation size={11}/> Increase search radius</button>
                      </motion.div>
                    ) : nearbyJobs.map((job,i) => {
                      const CatIcon = catIcon(job.category);
                      return (
                        <motion.div key={job._id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,x:30}} transition={{delay:i*0.04}}
                          className={`${card} p-4 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/40 transition-all group ${job.isEmergency?'border-red-200 dark:border-red-900/30 border-l-4 border-l-red-500':''}`}>
                          <div className="flex gap-3 items-start">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${job.isEmergency?'bg-red-100 dark:bg-red-900/20':'bg-indigo-100 dark:bg-indigo-900/30'}`}>
                              <CatIcon size={18} className={job.isEmergency?'text-red-600':'text-indigo-600 dark:text-indigo-400'}/>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {job.isEmergency&&<span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-600 text-[10px] font-bold rounded-lg uppercase animate-pulse">Emergency</span>}
                                {job.priority==='Urgent'&&!job.isEmergency&&<span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-lg">Urgent</span>}
                                {job.distanceKm&&<span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin size={9}/>{job.distanceKm}km</span>}
                                <span className="text-[10px] text-gray-400">{formatAgo(job.createdAt)}</span>
                              </div>
                              <h3 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-indigo-600 transition-colors truncate">{job.title}</h3>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{job.description}</p>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{job.clientId?.name}</span>
                                {job.location?.address&&<span className="flex items-center gap-0.5 truncate"><MapPin size={9}/>{job.location.address}</span>}
                              </div>
                              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1.5">₹{job.budget?.min} – ₹{job.budget?.max}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                            <button onClick={()=>handleAccept(job._id)} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold transition-all"><CheckCircle size={13}/> {t('acceptJob')}</button>
                            <button onClick={()=>handleReject(job._id)} className="w-10 h-9 bg-gray-100 dark:bg-slate-800 text-gray-500 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/20 rounded-xl transition-all flex items-center justify-center"><XCircle size={16}/></button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Profile card */}
            {profile && (
              <div className={`${card} p-5`}>
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl mb-3 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
                    {profile.profilePhoto?<img src={profile.profilePhoto} alt="" className="w-16 h-16 rounded-2xl object-cover"/>:profile.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1.5 mb-1"><div className={`w-2 h-2 rounded-full ${isAvailable?'bg-emerald-500':'bg-gray-300'}`}/><span className="text-[10px] font-bold text-gray-500 uppercase">{isAvailable?'Online':'Offline'}</span></div>
                  <p className="font-bold text-gray-900 dark:text-white">{profile.name}</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{profile.category}</p>
                  <div className="flex items-center gap-2 mt-2"><Stars v={profile.rating}/><span className="text-sm font-bold text-amber-500">{profile.rating?.toFixed(1)||'0.0'}</span><span className="text-xs text-gray-400">({profile.totalReviews||0})</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[{label:'Jobs Done',v:profile.totalJobsDone||0},{label:'Radius',v:searchRadius+'km'}].map(s=>(
                    <div key={s.label} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-2.5 text-center">
                      <p className="text-base font-bold text-gray-900 dark:text-white">{s.v}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">{s.label}</p>
                    </div>
                  ))}
                </div>
                {/* Sidebar action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label:t('editProfile'), icon:Edit, action:()=>setShowEditProfile(true) },
                    { label:t('schedule'),    icon:Calendar, action:()=>setShowSchedule(true) },
                    { label:t('analytics'),   icon:BarChart2, action:()=>setShowAnalytics(s=>!s) },
                    { label:t('portfolio'),   icon:Camera, action:()=>setShowPortfolio(s=>!s) },
                  ].map(btn=>(
                    <button key={btn.label} onClick={btn.action} className="flex items-center gap-1.5 justify-center bg-gray-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 text-gray-600 dark:text-gray-300 px-2 py-2 rounded-xl text-[10px] font-bold transition-all">
                      <btn.icon size={12}/> {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics */}
            <AnimatePresence>
              {showAnalytics && (
                <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className={`${card} p-4 overflow-hidden`}>
                  <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-3 flex items-center gap-2"><BarChart2 size={14} className="text-indigo-500"/> {t('analytics')}</h3>
                  {analytics ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Earnings (7 days)</p>
                        <ResponsiveContainer width="100%" height={100}>
                          <BarChart data={analytics.earningsByDay}>
                            <XAxis dataKey="date" tick={{fontSize:9}} tickFormatter={d=>d.slice(5)}/>
                            <YAxis tick={{fontSize:9}}/>
                            <Tooltip formatter={v=>`₹${v}`} contentStyle={{fontSize:11}}/>
                            <Bar dataKey="amount" fill="#6366f1" radius={[4,4,0,0]}/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {analytics.ratingTrend?.length>0 && (
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Rating trend</p>
                          <ResponsiveContainer width="100%" height={80}>
                            <LineChart data={analytics.ratingTrend}>
                              <XAxis dataKey="date" hide/>
                              <YAxis domain={[0,5]} tick={{fontSize:9}}/>
                              <Tooltip contentStyle={{fontSize:11}}/>
                              <Line type="monotone" dataKey="rating" stroke="#10b981" dot={false} strokeWidth={2}/>
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/></div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Portfolio */}
            <AnimatePresence>
              {showPortfolio && (
                <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className={`${card} p-4 overflow-hidden`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2"><Camera size={14} className="text-emerald-500"/> {t('portfolio')}</h3>
                    {portfolio.length<6 && (
                      <label className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-indigo-100 transition-all">
                        <Plus size={11}/> Add
                        <input type="file" accept="image/*" className="hidden" onChange={handleAddPortfolioPhoto}/>
                      </label>
                    )}
                  </div>
                  {portfolio.length===0 ? (
                    <p className="text-center text-gray-400 text-xs py-4">No photos yet — showcase your work!</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {portfolio.map((p,i) => (
                        <div key={i} className="relative group">
                          <img src={p.photoUrl} alt={p.caption} className="w-full h-16 object-cover rounded-xl border border-gray-100 dark:border-slate-700"/>
                          <button onClick={()=>handleDeletePortfolioPhoto(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <X size={10}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent Completed */}
            <div className={`${card} p-4`}>
              <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-emerald-500"/> Recent Completed</h3>
              {completedJobs.length===0 ? <p className="text-center text-gray-400 text-xs py-4">No completed jobs yet</p> : (
                <div className="space-y-2.5">
                  {completedJobs.slice(0,5).map(job=>(
                    <div key={job._id} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0"><CheckCircle size={13} className="text-emerald-600"/></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{job.title}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10px] text-emerald-600 font-bold">₹{job.budget?.max||0}</p>
                          {job.rating&&<Stars v={job.rating} size={9}/>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className={modal}>
          <motion.div initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}} className={`${modalCard} max-w-sm`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-gray-900 dark:text-white">{t('editProfile')}</h3>
              <button onClick={()=>setShowEditProfile(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-400"><X size={16}/></button>
            </div>
            <div className="space-y-3">
              {[['name','Name','text'],['phone','Phone','text'],['city','City','text'],['experience','Experience (yrs)','number'],['pricePerHour','Price/hr (₹)','number']].map(([k,label,type])=>(
                <div key={k}><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">{label}</label>
                  <input type={type} value={editForm[k]||''} onChange={e=>setEditForm(f=>({...f,[k]:e.target.value}))} className={inp}/></div>
              ))}
              <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Bio <span className="text-gray-400 font-normal normal-case">({(editForm.bio||'').length}/200)</span></label>
                <textarea value={editForm.bio||''} onChange={e=>setEditForm(f=>({...f,bio:e.target.value.slice(0,200)}))} rows={3} className={inp+' resize-none'}/></div>
            </div>
            <button onClick={handleSaveEdit} disabled={savingEdit} className="w-full mt-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {savingEdit?<><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Saving...</>:t('save')}
            </button>
          </motion.div>
        </div>
      )}

      {/* Schedule Modal */}
      {showSchedule && (
        <div className={modal}>
          <motion.div initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}} className={`${modalCard} max-w-sm`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-gray-900 dark:text-white">{t('schedule')}</h3>
              <button onClick={()=>setShowSchedule(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-400"><X size={16}/></button>
            </div>
            <div className="space-y-3 mb-5">
              {DAYS.map((day,i)=>(
                <div key={day} className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{DAY_LABELS[i]}</span>
                  <button onClick={()=>setSchedule(s=>({...s,[day]:!s[day]}))}
                    className={`w-12 h-6 rounded-full transition-all relative ${schedule[day]?'bg-indigo-600':'bg-gray-200 dark:bg-slate-700'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${schedule[day]?'right-0.5':'left-0.5'}`}/>
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">From</label><input type="time" value={workingHours.start} onChange={e=>setWorkingHours(w=>({...w,start:e.target.value}))} className={inp}/></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Until</label><input type="time" value={workingHours.end} onChange={e=>setWorkingHours(w=>({...w,end:e.target.value}))} className={inp}/></div>
            </div>
            <button onClick={handleSaveSchedule} disabled={savingSchedule} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {savingSchedule?<><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Saving...</>:t('save')}
            </button>
          </motion.div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className={modal}>
          <motion.div initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}} className={`${modalCard} max-w-xs text-center`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><QrCode size={16} className="text-indigo-600"/> Payment QR</h3>
              <button onClick={()=>setQrModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-400"><X size={16}/></button>
            </div>
            <img src={qrModal} alt="QR Code" className="w-48 h-48 mx-auto rounded-2xl border-4 border-indigo-100 dark:border-indigo-900/30 mb-4"/>
            <p className="text-xs text-gray-500 mb-4">Show this QR to collect payment. 10% commission goes to SewaPro.</p>
            <a href={qrModal} download="sewapro-qr.png"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all text-sm">
              <Download size={14}/> Download QR
            </a>
          </motion.div>
        </div>
      )}

      {chatJob && <ChatModal job={chatJob} onClose={()=>setChatJob(null)}/>}
    </div>
  );
};

export default WorkerDashboard;

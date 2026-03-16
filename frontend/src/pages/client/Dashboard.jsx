import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Briefcase, CheckCircle, IndianRupee, MapPin, Phone,
  Star, Trash2, AlertCircle, MessageCircle, LogOut, Sun, Moon,
  User, Clock, Download, X, Filter
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosInstance';
import PostJob from './PostJob';
import RatingModal from '../../components/RatingModal';
import ChatModal from '../../components/ChatModal';
import JobTrackingCard from '../../components/JobTrackingCard';
import { logout } from '../../redux/authSlice';
import { toggleTheme } from '../../redux/themeSlice';
import { generateInvoice } from '../../utils/generateInvoice';
import { useLang } from '../../hooks/useLang';
import toast from 'react-hot-toast';

const statusConfig = {
  Pending:       { label:'Pending',     color:'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400', dot:'bg-amber-400' },
  Accepted:      { label:'Accepted',    color:'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400', dot:'bg-indigo-500' },
  'In-Progress': { label:'In Progress', color:'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', dot:'bg-blue-500' },
  Completed:     { label:'Completed',   color:'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', dot:'bg-slate-400' },
  Cancelled:     { label:'Cancelled',   color:'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400', dot:'bg-red-400' },
};

const CATS = ['All Categories','Plumber','Electrician','Carpenter','Painter','Mason','Welder'];
const Stars = ({ v=0 }) => <div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={10} className={i<=Math.round(v||0)?'fill-amber-400 text-amber-400':'text-gray-200 dark:text-gray-700'}/>)}</div>;

const ClientDashboard = () => {
  const { user }  = useSelector(s => s.auth);
  const { mode }  = useSelector(s => s.theme);
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { t }     = useLang();
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [catFilter, setCatFilter]   = useState('All Categories');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [postOpen, setPostOpen]     = useState(false);
  const [ratingJob, setRatingJob]   = useState(null);
  const [chatJob, setChatJob]       = useState(null);
  const [lightbox, setLightbox]     = useState(null);

  const fetchJobs = async () => {
    try { const { data } = await api.get('/client/jobs'); setJobs(data); }
    catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this job?')) return;
    try { await api.delete(`/client/jobs/${id}`); toast.success('Job cancelled'); fetchJobs(); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot cancel'); }
  };

  const stats = {
    active:    jobs.filter(j=>['Pending','Accepted','In-Progress'].includes(j.status)).length,
    completed: jobs.filter(j=>j.status==='Completed').length,
    spent:     jobs.filter(j=>j.status==='Completed').reduce((s,j)=>s+(j.budget?.max||0),0),
  };

  const filtered = jobs
    .filter(j => filter==='all' || j.status===filter)
    .filter(j => catFilter==='All Categories' || j.category===catFilter)
    .filter(j => !dateFrom || new Date(j.createdAt) >= new Date(dateFrom))
    .filter(j => !dateTo   || new Date(j.createdAt) <= new Date(dateTo+'T23:59:59'));

  const hasFilters = catFilter!=='All Categories' || dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold shadow-md">{user?.name?.[0]?.toUpperCase()}</div>
            <div><p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user?.name}</p><p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wide">Client</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>dispatch(toggleTheme())} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-gray-500">
              {mode==='dark'?<Sun size={16} className="text-amber-400"/>:<Moon size={16}/>}
            </button>
            <button onClick={()=>setPostOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-200 dark:shadow-none">
              <Plus size={15}/> {t('postJob')}
            </button>
            <button onClick={()=>{dispatch(logout());navigate('/');}} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><LogOut size={16}/></button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:t('activeJobs'),  value:stats.active,    icon:Briefcase,  bg:'bg-indigo-50 dark:bg-indigo-900/10',  text:'text-indigo-600' },
            { label:t('completed'),   value:stats.completed,  icon:CheckCircle, bg:'bg-emerald-50 dark:bg-emerald-900/10', text:'text-emerald-600' },
            { label:'Total Spent',    value:`₹${stats.spent}`, icon:IndianRupee, bg:'bg-indigo-50 dark:bg-indigo-900/10',  text:'text-indigo-600' },
          ].map((s,i) => (
            <motion.div key={s.label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${s.bg}`}><s.icon size={17} className={s.text}/></div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap items-center">
          {['all','Pending','Accepted','In-Progress','Completed','Cancelled'].map(f => (
            <button key={f} onClick={()=>setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filter===f?'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none':'bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-800 hover:border-indigo-200'}`}>
              {f==='all'?'All':f} {jobs.filter(j=>f==='all'?true:j.status===f).length>0&&<span className="ml-1 opacity-70">{jobs.filter(j=>f==='all'?true:j.status===f).length}</span>}
            </button>
          ))}
          <button onClick={()=>setShowFilters(s=>!s)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${hasFilters?'bg-emerald-600 text-white':'bg-white dark:bg-slate-900 text-gray-500 border border-gray-100 dark:border-slate-800 hover:border-emerald-200'}`}>
            <Filter size={11}/> Filters {hasFilters&&'●'}
          </button>
        </div>

        {/* Advanced filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
              className="overflow-hidden">
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Category</label>
                  <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
                    className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white">
                    {CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">From Date</label>
                  <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
                    className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">To Date</label>
                  <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
                    className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white"/>
                </div>
                <button onClick={()=>{setCatFilter('All Categories');setDateFrom('');setDateTo('');}}
                  className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Job cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3].map(i=><div key={i} className="bg-white dark:bg-slate-900 rounded-2xl h-48 animate-pulse border border-gray-100 dark:border-slate-800"/>)}
          </div>
        ) : filtered.length===0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertCircle size={28} className="text-gray-400"/></div>
            <p className="font-semibold text-gray-600 dark:text-gray-400">No {filter==='all'?'':filter} jobs found</p>
            <p className="text-sm text-gray-400 mt-1">{hasFilters?'Try clearing filters':'Post a job to get started'}</p>
            {!hasFilters&&<button onClick={()=>setPostOpen(true)} className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all">Post First Job</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((job,i) => {
                const sc = statusConfig[job.status] || statusConfig.Pending;
                const isTracking = ['Accepted','In-Progress'].includes(job.status) && job.acceptedBy;
                const canRate = job.status==='Completed' && !job.isRated && job.acceptedBy;
                const canChat = isTracking;

                if (isTracking) {
                  return (
                    <motion.div key={job._id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{delay:i*0.04}}>
                      <JobTrackingCard job={job}/>
                    </motion.div>
                  );
                }

                return (
                  <motion.div key={job._id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.97}} transition={{delay:i*0.04}}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${sc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>{sc.label}
                          </span>
                          {job.isEmergency && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-lg uppercase animate-pulse">Emergency</span>}
                        </div>
                        <p className="text-[10px] text-gray-400 shrink-0">{new Date(job.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 group-hover:text-indigo-600 transition-colors leading-snug">{job.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{job.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap mb-3">
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg">{job.category}</span>
                        {job.location?.address && <span className="flex items-center gap-1"><MapPin size={10}/>{job.location.address}</span>}
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{job.budget?.min}–₹{job.budget?.max}</span>
                      </div>

                      {/* Worker info */}
                      {job.acceptedBy && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-2.5 border border-indigo-100 dark:border-indigo-900/20 flex items-center gap-2">
                          <div className="w-7 h-7 bg-indigo-200 dark:bg-indigo-800 rounded-lg flex items-center justify-center shrink-0">
                            {job.acceptedBy.profilePhoto?<img src={job.acceptedBy.profilePhoto} alt="" className="w-7 h-7 rounded-lg object-cover"/>:<User size={12} className="text-indigo-600 dark:text-indigo-400"/>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300 truncate">{job.acceptedBy.name}</p>
                            <div className="flex items-center gap-1.5"><Stars v={job.acceptedBy.rating}/><span className="text-[10px] text-indigo-500 font-semibold">{job.acceptedBy.category}</span></div>
                          </div>
                          {job.acceptedBy.phone&&<a href={`tel:${job.acceptedBy.phone}`} className="p-1.5 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-200 rounded-lg transition-all shrink-0"><Phone size={11}/></a>}
                        </div>
                      )}

                      {job.status==='Pending' && <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/>{t('workerNotified')}</div>}

                      {job.isRated && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-1.5"><Stars v={job.rating}/><span className="text-[10px] text-gray-400">Rated {job.rating}/5</span></div>
                          {job.reviewPhotos?.length>0 && (
                            <div className="flex gap-1.5 flex-wrap mt-1">
                              {job.reviewPhotos.map((ph,idx)=>(
                                <img key={idx} src={ph} alt="" onClick={()=>setLightbox(ph)}
                                  className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-all border border-gray-200 dark:border-slate-700"/>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {(canRate||canChat||job.status==='Pending'||job.status==='Completed') && (
                      <div className="border-t border-gray-100 dark:border-slate-800 px-4 py-2.5 flex gap-2 bg-gray-50/50 dark:bg-slate-900/50 flex-wrap">
                        {canChat && <button onClick={()=>setChatJob(job)} className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 text-indigo-600 text-xs font-bold py-2 px-3 rounded-xl transition-all border border-indigo-200 dark:border-indigo-800/30"><MessageCircle size={12}/> {t('chat')}</button>}
                        {canRate && <button onClick={()=>setRatingJob(job)} className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 text-amber-600 text-xs font-bold py-2 px-3 rounded-xl transition-all border border-amber-200 dark:border-amber-800/30"><Star size={11} className="fill-amber-400"/> {t('rateWorker')}</button>}
                        {job.status==='Completed' && <button onClick={()=>generateInvoice(job)} className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 text-emerald-600 text-xs font-bold py-2 px-3 rounded-xl transition-all border border-emerald-200 dark:border-emerald-800/30"><Download size={11}/> {t('downloadInvoice')}</button>}
                        {job.status==='Pending' && <button onClick={()=>handleCancel(job._id)} className="flex items-center gap-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 px-3 py-2 rounded-xl transition-all font-medium ml-auto"><Trash2 size={11}/> {t('cancel')}</button>}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Photo Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={()=>setLightbox(null)}>
            <button className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white"><X size={20}/></button>
            <img src={lightbox} alt="" className="max-w-full max-h-full rounded-2xl object-contain" onClick={e=>e.stopPropagation()}/>
          </motion.div>
        )}
      </AnimatePresence>

      {postOpen  && <PostJob onClose={()=>setPostOpen(false)} onSuccess={fetchJobs}/>}
      {ratingJob && <RatingModal jobId={ratingJob._id} workerName={ratingJob.acceptedBy?.name||'Worker'} onClose={()=>setRatingJob(null)} onSubmit={fetchJobs}/>}
      {chatJob   && <ChatModal job={chatJob} onClose={()=>setChatJob(null)}/>}
    </div>
  );
};

export default ClientDashboard;

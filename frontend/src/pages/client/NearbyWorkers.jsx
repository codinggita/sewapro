import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map as MapIcon, List, Star, ArrowLeft, RefreshCw } from 'lucide-react';
import MapView from '../../components/MapView';
import api from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const categories = ['All','Plumber','Electrician','Carpenter','Painter','Mason','Welder'];

const NearbyWorkers = () => {
  const navigate = useNavigate();
  const [workers, setWorkers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('All');
  const [userLocation, setUserLocation] = useState([23.0225, 72.5714]);
  const [viewMode, setViewMode] = useState('map');

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    try { const { data } = await api.get('/map/workers'); setWorkers(data); }
    catch { toast.error('Failed to fetch nearby workers'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleHire = (worker) => {
    navigate('/client/dashboard', { state: { preSelectedWorker: worker } });
    toast.success(`Opening dashboard to hire ${worker.name}`);
  };

  const filtered = workers.filter(w => category==='All' || w.category===category);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 h-[calc(100vh-80px)]">
      {/* Header with back arrow */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={()=>navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-gray-200 dark:border-slate-700 shrink-0">
            <ArrowLeft size={18}/>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Discover Workers</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Available skilled professionals in SewaPro</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchWorkers} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all border border-gray-100 dark:border-slate-800"><RefreshCw size={15}/></button>
          <div className="flex bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            <button onClick={()=>setViewMode('map')} className={`p-2 rounded-lg transition-all ${viewMode==='map'?'bg-indigo-600 text-white':'text-gray-400 hover:text-gray-600'}`}><MapIcon size={18}/></button>
            <button onClick={()=>setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode==='list'?'bg-indigo-600 text-white':'text-gray-400 hover:text-gray-600'}`}><List size={18}/></button>
          </div>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(c=>(
          <button key={c} onClick={()=>setCategory(c)}
            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${category===c?'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none':'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Map / List view */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 h-[calc(100%-180px)]">
        {viewMode==='map' ? (
          <MapView items={filtered} center={userLocation} onAction={handleHire}/>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 overflow-y-auto h-full">
            {loading ? [1,2,3,4,5,6].map(i=><div key={i} className="h-48 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse"/>) :
            filtered.length===0 ? (
              <div className="col-span-full py-20 text-center">
                <p className="text-gray-500 font-semibold">No {category!=='All'?category:''} workers online right now</p>
                <p className="text-gray-400 text-sm mt-1">Try a different category or check back later</p>
              </div>
            ) : filtered.map(worker=>(
              <motion.div key={worker._id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl flex flex-col items-center text-center border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/40 transition-all group">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-2xl mb-3 border-2 border-white dark:border-slate-700 shadow-md group-hover:scale-105 transition-transform">
                  {worker.profilePhoto?<img src={worker.profilePhoto} alt={worker.name} className="w-16 h-16 rounded-2xl object-cover"/>:worker.name?.[0]?.toUpperCase()}
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">{worker.name}</h3>
                <p className="text-indigo-600 text-xs font-bold mb-1">{worker.category}</p>
                {worker.city&&<p className="text-gray-400 text-xs mb-2">{worker.city}</p>}
                <div className="flex justify-between w-full text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-0.5 font-bold text-amber-500"><Star size={12} className="fill-amber-500"/> {worker.rating?.toFixed(1)||'0.0'}</span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">₹{worker.pricePerHour}/hr</span>
                  <span className="flex items-center gap-1 text-emerald-500 font-bold"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/> Online</span>
                </div>
                {/* Portfolio preview */}
                {worker.portfolio?.length>0 && (
                  <div className="flex gap-1 mb-3 w-full justify-center">
                    {worker.portfolio.slice(0,3).map((p,i)=>(
                      <img key={i} src={p.photoUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-slate-600"/>
                    ))}
                  </div>
                )}
                <button onClick={()=>handleHire(worker)} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-bold py-2.5 rounded-xl transition-all active:scale-95 text-sm">
                  Hire This Worker
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyWorkers;

import { motion } from 'framer-motion';
import { X, MapPin, Crosshair, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';
import api from '../../utils/axiosInstance';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize:[25,41], iconAnchor:[12,41] });

const categories = ['Plumber','Electrician','Carpenter','Painter','Mason','Welder'];

const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({ click(e) { onLocationSelect([e.latlng.lng, e.latlng.lat]); } });
  return null;
};

const PostJob = ({ onClose, onSuccess }) => {
  const [loading, setLoading]       = useState(false);
  const [coords, setCoords]         = useState(null);
  const [mapCenter, setMapCenter]   = useState([23.0225, 72.5714]);
  const [showMap, setShowMap]       = useState(false);
  const [form, setForm] = useState({
    title:'', description:'', category:'', address:'',
    priority:'Normal', isEmergency:false,
    scheduledDate:'', scheduledTime:'',
    estimatedHours:2, budget:{ min:200, max:500 }
  });

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setCoords([pos.coords.longitude, pos.coords.latitude]);
      setMapCenter([pos.coords.latitude, pos.coords.longitude]);
    });
    const handler = (e) => { if (e.key==='Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/client/jobs', {
        ...form,
        location: { address: form.address, type:'Point', coordinates: coords||[0,0] }
      });
      toast.success('Job posted! Workers will be notified');
      onSuccess(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to post job'); }
    finally { setLoading(false); }
  };

  const inp = "w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all mt-1";
  const lbl = "text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target===e.currentTarget) onClose(); }}>
      <motion.div initial={{opacity:0,y:20,scale:0.97}} animate={{opacity:1,y:0,scale:1}}
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-2xl shadow-2xl my-8 border border-gray-100 dark:border-slate-800"
        onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Post a Service Request</h3>
            <p className="text-xs text-gray-500 mt-0.5">Nearby workers will be notified instantly</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 rounded-xl transition-all text-gray-500">
            <X size={18}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={lbl}>Job Title *</label>
              <input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Fix leaking kitchen tap" className={inp}/>
            </div>
            <div>
              <label className={lbl}>Category *</label>
              <select required value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className={inp}>
                <option value="">Select Category</option>
                {categories.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Priority</label>
              <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className={inp}>
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={lbl}>Description *</label>
              <textarea required rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the problem..." className={inp+' resize-none'}/>
            </div>
          </div>

          {/* Emergency toggle */}
          <div className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${form.isEmergency?'border-red-400 bg-red-50 dark:bg-red-900/10':'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50'}`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${form.isEmergency?'bg-red-500':'bg-gray-200 dark:bg-slate-700'}`}><Zap size={16} className={form.isEmergency?'text-white':'text-gray-500'}/></div>
              <div>
                <p className={`text-sm font-bold ${form.isEmergency?'text-red-700 dark:text-red-400':'text-gray-700 dark:text-gray-300'}`}>Emergency Request</p>
                <p className="text-[10px] text-gray-400">Workers prioritize emergency jobs</p>
              </div>
            </div>
            <button type="button" onClick={()=>setForm({...form,isEmergency:!form.isEmergency})}
              className={`w-12 h-6 rounded-full transition-all relative ${form.isEmergency?'bg-red-500':'bg-gray-300 dark:bg-slate-600'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${form.isEmergency?'right-0.5':'left-0.5'}`}/>
            </button>
          </div>

          {/* Location */}
          <div className="border border-gray-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className={lbl+' flex items-center gap-1'}><MapPin size={12}/> Location</label>
              <div className="flex gap-2">
                <button type="button" onClick={()=>navigator.geolocation?.getCurrentPosition(pos=>{setCoords([pos.coords.longitude,pos.coords.latitude]);setMapCenter([pos.coords.latitude,pos.coords.longitude]);toast.success('Location captured!');})}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all">
                  <Crosshair size={11}/> My Location
                </button>
                <button type="button" onClick={()=>setShowMap(s=>!s)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all">
                  <MapPin size={11}/> {showMap?'Hide Map':'Pin on Map'}
                </button>
              </div>
            </div>
            <input required value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Street, Area, City" className={inp.replace('mt-1','')}/>
            {coords&&<p className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"/> Location set: {coords[1].toFixed(4)}, {coords[0].toFixed(4)}</p>}
            {showMap && (
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                <MapContainer center={mapCenter} zoom={14} style={{height:'250px',width:'100%'}}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                  <LocationPicker onLocationSelect={(c)=>{setCoords(c);toast.success('Location pinned!');}}/>
                  {coords&&<Marker position={[coords[1],coords[0]]}/>}
                </MapContainer>
                <p className="text-center text-xs text-gray-400 py-2 bg-gray-50 dark:bg-slate-800">Click on map to pin exact location</p>
              </div>
            )}
          </div>

          {/* Schedule + Budget */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-1"><label className={lbl}>Date *</label><input required type="date" value={form.scheduledDate} onChange={e=>setForm({...form,scheduledDate:e.target.value})} className={inp}/></div>
            <div className="col-span-1"><label className={lbl}>Time *</label><input required type="time" value={form.scheduledTime} onChange={e=>setForm({...form,scheduledTime:e.target.value})} className={inp}/></div>
            <div><label className={lbl}>Min ₹</label><input type="number" value={form.budget.min} onChange={e=>setForm({...form,budget:{...form.budget,min:Number(e.target.value)}})} className={inp}/></div>
            <div><label className={lbl}>Max ₹</label><input type="number" value={form.budget.max} onChange={e=>setForm({...form,budget:{...form.budget,max:Number(e.target.value)}})} className={inp}/></div>
          </div>

          <button type="submit" disabled={loading}
            className={`w-full text-white rounded-2xl py-4 font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg mt-2 ${form.isEmergency?'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none':'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'}`}>
            {loading?<><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Posting...</>:form.isEmergency?'Post Emergency Request':'Post Job Request'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default PostJob;

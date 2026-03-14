import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Phone, MessageCircle, MapPin, Star, Clock, Navigation } from 'lucide-react';
import ChatModal from './ChatModal';
import api from '../utils/axiosInstance';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

// Custom colored divIcon
const makeIcon = (color, label) => L.divIcon({
  className: '',
  html: `<div style="width:36px;height:36px;background:${color};border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.25)">${label}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const workerIcon = makeIcon('#6366f1', 'W');
const clientIcon = makeIcon('#10b981', 'C');

const haversineKm = ([lng1, lat1], [lng2, lat2]) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
};

const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [positions]);
  return null;
};

const Stars = ({ v = 0 }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={11} className={i <= Math.round(v||0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'} />
    ))}
  </div>
);

const JobTrackingCard = ({ job }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [workerLoc, setWorkerLoc] = useState(job.acceptedBy?.liveLocation?.coordinates);
  const timerRef = useRef(null);

  const clientCoords = job.location?.coordinates; // [lng, lat]
  const hasClientLoc = clientCoords && (clientCoords[0] !== 0 || clientCoords[1] !== 0);
  const hasWorkerLoc = workerLoc && (workerLoc[0] !== 0 || workerLoc[1] !== 0);

  const clientLatLng = hasClientLoc ? [clientCoords[1], clientCoords[0]] : null;
  const workerLatLng = hasWorkerLoc ? [workerLoc[1], workerLoc[0]] : null;

  const distance = hasClientLoc && hasWorkerLoc ? haversineKm(clientCoords, workerLoc) : null;

  // Poll worker location every 30s
  useEffect(() => {
    if (!job.acceptedBy?._id) return;
    const poll = async () => {
      try {
        const { data } = await api.get(`/worker/${job.acceptedBy._id}`);
        if (data.liveLocation?.coordinates) setWorkerLoc(data.liveLocation.coordinates);
      } catch (e) {}
    };
    timerRef.current = setInterval(poll, 30000);
    return () => clearInterval(timerRef.current);
  }, [job.acceptedBy?._id]);

  const mapPositions = [clientLatLng, workerLatLng].filter(Boolean);
  const mapCenter = clientLatLng || workerLatLng || [23.0225, 72.5714];
  const worker = job.acceptedBy;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 border-l-4 border-l-indigo-500 shadow-md overflow-hidden">
      {/* Map */}
      <div className="h-52 relative">
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {clientLatLng && (
            <Marker position={clientLatLng} icon={clientIcon}>
              <Popup><div className="text-xs font-bold text-emerald-700">Your Location</div></Popup>
            </Marker>
          )}
          {workerLatLng && (
            <Marker position={workerLatLng} icon={workerIcon}>
              <Popup><div className="text-xs font-bold text-indigo-700">Worker Location</div></Popup>
            </Marker>
          )}
          {clientLatLng && workerLatLng && (
            <Polyline positions={[clientLatLng, workerLatLng]} color="#6366f1" weight={3} dashArray="8 6" opacity={0.8} />
          )}
          {mapPositions.length >= 2 && <FitBounds positions={mapPositions} />}
        </MapContainer>

        {/* Distance badge */}
        {distance !== null && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] bg-white dark:bg-slate-900 rounded-full px-4 py-1.5 text-xs font-bold text-indigo-600 shadow-lg border border-indigo-100 dark:border-slate-700 flex items-center gap-1.5">
            <Navigation size={11} /> {distance} km away
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 truncate">{job.title}</h3>

        {worker && (
          <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-3 mb-3 border border-indigo-100 dark:border-indigo-900/20">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
              {worker.profilePhoto
                ? <img src={worker.profilePhoto} alt="" className="w-10 h-10 rounded-xl object-cover" />
                : worker.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{worker.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Stars v={worker.rating} />
                <span className="text-[10px] text-indigo-600 font-bold">{worker.category}</span>
              </div>
            </div>
            {worker.phone && (
              <a href={`tel:${worker.phone}`}
                className="w-9 h-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0 transition-all">
                <Phone size={14} />
              </a>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {worker && (
            <button onClick={() => setChatOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all">
              <MessageCircle size={13} /> Chat with Worker
            </button>
          )}
          {job.location?.address && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 px-3 py-2.5 rounded-xl">
              <MapPin size={11} /> <span className="truncate max-w-[120px]">{job.location.address}</span>
            </div>
          )}
        </div>
      </div>

      {chatOpen && <ChatModal job={job} onClose={() => setChatOpen(false)} />}
    </div>
  );
};

export default JobTrackingCard;

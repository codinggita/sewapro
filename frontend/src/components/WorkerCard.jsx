import { Star, MapPin, Clock, IndianRupee } from 'lucide-react';
import VerifiedBadge from './VerifiedBadge';

const categoryColors = {
  Plumber: 'bg-blue-100 text-blue-700',
  Electrician: 'bg-yellow-100 text-yellow-700',
  Carpenter: 'bg-amber-100 text-amber-700',
  Painter: 'bg-pink-100 text-pink-700',
  Mason: 'bg-gray-100 text-gray-700',
  Welder: 'bg-orange-100 text-orange-700',
};

const WorkerCard = ({ worker, showDistance = false, showActions = true, onAssign, onViewProfile }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-100 dark:border-slate-700 p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
    <div className="flex items-start gap-3 mb-4">
      <div className="relative">
        <img src={worker.profilePhoto || `https://ui-avatars.com/api/?name=${worker.name}&background=6366f1&color=fff`}
          alt={worker.name} className="w-12 h-12 rounded-full object-cover" />
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${worker.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{worker.name}</p>
          <VerifiedBadge isVerified={worker.isVerified} />
        </div>
        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${categoryColors[worker.category] || 'bg-gray-100 text-gray-700'}`}>
          {worker.category}
        </span>
      </div>
    </div>

    <div className="flex items-center gap-1 mb-2">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={`text-sm ${s <= Math.round(worker.rating) ? 'text-amber-400' : 'text-gray-200 dark:text-slate-600'}`}>★</span>
      ))}
      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({worker.totalReviews} reviews)</span>
    </div>

    <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
      <span className="flex items-center gap-1"><IndianRupee size={12} />₹{worker.pricePerHour}/hr</span>
      <span className="flex items-center gap-1"><Clock size={12} />{worker.experience} yrs</span>
      {showDistance && worker.distance && (
        <span className="flex items-center gap-1"><MapPin size={12} />{worker.distance} km</span>
      )}
    </div>

    {worker.skills?.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-4">
        {worker.skills.slice(0, 3).map(skill => (
          <span key={skill} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs rounded-full">{skill}</span>
        ))}
      </div>
    )}

    {showActions && (
      <div className="flex gap-2">
        <button onClick={() => onViewProfile?.(worker)}
          className="flex-1 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl px-3 py-2 text-xs font-semibold transition-all">
          View Profile
        </button>
        <button onClick={() => onAssign?.(worker)}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95">
          Assign Job
        </button>
      </div>
    )}
  </div>
);
export default WorkerCard;

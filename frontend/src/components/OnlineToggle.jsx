import { useDispatch, useSelector } from 'react-redux';
import { updateWorkerAvailability } from '../redux/workerSlice';
import api from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { useRef } from 'react';

const OnlineToggle = ({ isAvailable, workerId }) => {
  const dispatch = useDispatch();
  const intervalRef = useRef(null);

  const handleToggle = async () => {
    const newStatus = !isAvailable;
    try {
      await api.patch('/workers/availability', { isAvailable: newStatus });
      dispatch(updateWorkerAvailability({ id: workerId, isAvailable: newStatus }));

      if (newStatus) {
        toast.success('You are now Online 🟢');
        if (navigator.geolocation) {
          const updateLocation = () => {
            navigator.geolocation.getCurrentPosition(pos => {
              api.patch('/workers/location', {
                coordinates: [pos.coords.longitude, pos.coords.latitude]
              });
            });
          };
          updateLocation();
          intervalRef.current = setInterval(updateLocation, 30000);
        }
      } else {
        toast.success('You are now Offline 🔴');
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } catch (err) {
      toast.error('Failed to update availability');
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className={`text-sm font-bold ${!isAvailable ? 'text-red-500' : 'text-gray-400 dark:text-slate-500'}`}>OFFLINE</span>
      <button onClick={handleToggle}
        className={`relative w-16 h-8 rounded-full transition-all duration-300 ${isAvailable ? 'bg-green-500' : 'bg-red-400'}`}>
        <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${isAvailable ? 'left-9' : 'left-1'}`} />
      </button>
      <span className={`text-sm font-bold ${isAvailable ? 'text-green-500' : 'text-gray-400 dark:text-slate-500'}`}>ONLINE</span>
    </div>
  );
};
export default OnlineToggle;

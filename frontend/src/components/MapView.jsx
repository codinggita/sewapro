import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const ChangeView = ({ center }) => {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
};

const MapView = ({ items = [], center, onAction }) => {
  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-inner border border-gray-200 dark:border-slate-700">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ChangeView center={center} />
        {items.map((item) => {
          const isJob = !!item.title;
          const coords = isJob 
            ? [item.location?.coordinates[1] || 0, item.location?.coordinates[0] || 0]
            : [item.liveLocation?.coordinates[1] || 0, item.liveLocation?.coordinates[0] || 0];

          if (coords[0] === 0 && coords[1] === 0) return null;

          return (
            <Marker key={item._id} position={coords}>
              <Popup>
                <div className="p-2 min-w-[200px]">
                  {isJob ? (
                    <>
                      <div className="mb-3">
                        <h4 className="font-bold text-gray-800">{item.title}</h4>
                        <p className="text-xs text-indigo-600 font-semibold">{item.category}</p>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{item.description}</p>
                      <div className="flex justify-between text-xs font-bold text-gray-800 mb-4">
                        <span>₹{item.budget?.min} - ₹{item.budget?.max}</span>
                        <span className="text-gray-400">Est: {item.estimatedHours}h</span>
                      </div>
                      <button 
                        onClick={() => onAction(item._id)}
                        className="w-full bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Accept Job
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={item.profilePhoto || 'https://via.placeholder.com/40'} 
                          alt={item.name} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500"
                        />
                        <div>
                          <h4 className="font-bold text-gray-800">{item.name}</h4>
                          <p className="text-xs text-indigo-600 font-semibold">{item.category}</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mb-4">
                        <span>⭐ {item.rating} ({item.totalReviews})</span>
                        <span>₹{item.pricePerHour}/hr</span>
                      </div>
                      <button 
                        onClick={() => onAction(item)}
                        className="w-full bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Hire Now
                      </button>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        {/* Current Location Marker */}
        <Marker position={center}>
            <Popup>Current Location</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapView;

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Wrench, Zap, Hammer, Paintbrush2, Award, Settings,
  MapPin, Shield, Star, Bell, ArrowRight, CheckCircle,
  Users, Briefcase, Building2, TrendingUp, Phone, Clock
} from 'lucide-react';
import AuthModal from '../components/AuthModal';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

const categories = [
  { icon: Wrench, name: 'Plumber', count: '120+', color: 'from-blue-500 to-blue-600' },
  { icon: Zap, name: 'Electrician', count: '95+', color: 'from-amber-500 to-amber-600' },
  { icon: Hammer, name: 'Carpenter', count: '80+', color: 'from-orange-500 to-orange-600' },
  { icon: Paintbrush2, name: 'Painter', count: '70+', color: 'from-pink-500 to-pink-600' },
  { icon: Award, name: 'Mason', count: '60+', color: 'from-emerald-500 to-emerald-600' },
  { icon: Settings, name: 'Welder', count: '50+', color: 'from-violet-500 to-violet-600' },
];

const steps = [
  { icon: MapPin, title: 'Post a Job', desc: 'Describe your problem, drop a pin on the map for exact location.', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
  { icon: Bell, title: 'Workers Notified', desc: 'Nearby verified workers get instant real-time notifications.', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
  { icon: Phone, title: 'Connect & Track', desc: 'Worker accepts → both get each other\'s contact and live location map.', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
  { icon: Star, title: 'Rate & Review', desc: 'Job done? Rate your worker to maintain quality for everyone.', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
];

const stats = [
  { icon: Users, value: '2,400+', label: 'Verified Workers' },
  { icon: Briefcase, value: '18,000+', label: 'Jobs Completed' },
  { icon: Building2, value: '25+', label: 'Cities Covered' },
  { icon: Star, value: '4.8', label: 'Average Rating' },
];

// Dummy worker markers for demo map
const demoWorkers = [
  { id: 1, lat: 23.0275, lng: 72.575, name: 'Rajan Plumber', cat: 'Plumber', rating: 4.8 },
  { id: 2, lat: 23.018, lng: 72.581, name: 'Suresh Elec.', cat: 'Electrician', rating: 4.6 },
  { id: 3, lat: 23.024, lng: 72.568, name: 'Mehul Carpenter', cat: 'Carpenter', rating: 4.9 },
  { id: 4, lat: 23.031, lng: 72.572, name: 'Kamlesh Painter', cat: 'Painter', rating: 4.7 },
];

const Landing = () => {
  const [authModal, setAuthModal] = useState(null);
  const { isAuthenticated, role } = useSelector(s => s.auth);
  const navigate = useNavigate();

  const handleCTA = () => {
    if (isAuthenticated) navigate(role === 'client' ? '/client/dashboard' : '/worker/dashboard');
    else setAuthModal('signup');
  };

  const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

  return (
    <div className="bg-white dark:bg-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 pt-20 pb-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-white/20">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Now live in 25+ cities across Gujarat
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Find Skilled Workers<br />
              <span className="text-emerald-400">Near You, Instantly</span>
            </h1>
            <p className="text-lg text-indigo-200 max-w-2xl mx-auto mb-10 leading-relaxed">
              Connect with verified plumbers, electricians, carpenters and more — with real-time location tracking, instant chat, and transparent pricing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleCTA}
                className="flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/30 text-base active:scale-[0.98]">
                Get Started Free <ArrowRight size={18} />
              </button>
              <button onClick={() => setAuthModal('signup')}
                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-emerald-900/30 text-base active:scale-[0.98]">
                Join as Worker <Wrench size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        <motion.div {...fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-100/60 dark:shadow-slate-900 text-center">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <s.icon size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <motion.div {...fadeUp} className="text-center mb-14">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Process</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mt-2">How SewaPro Works</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto">From posting a job to getting it done — simple, fast, and transparent.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-indigo-200 via-emerald-200 to-indigo-200 dark:from-indigo-900 dark:via-emerald-900 dark:to-indigo-900" />
          {steps.map((step, i) => (
            <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}
              className="relative flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 relative z-10 shadow-lg ${step.color}`}>
                <step.icon size={30} />
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">{i+1}</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">{step.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Category cards */}
      <section className="bg-gray-50 dark:bg-slate-900/50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Services</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mt-2">Browse by Category</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <motion.button key={cat.name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                onClick={handleCTA} whileHover={{ y: -4 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/40 transition-all group text-center">
                <div className={`w-12 h-12 bg-gradient-to-br ${cat.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                  <cat.icon size={22} className="text-white" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{cat.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{cat.count} workers</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Live Map Demo */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <motion.div {...fadeUp} className="text-center mb-10">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Live Map</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mt-2">Workers Near You, Right Now</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto">See all available workers on the live map with their ratings and categories.</p>
        </motion.div>
        <motion.div {...fadeUp} className="rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-2xl h-[420px]">
          <MapContainer center={[23.0225, 72.5714]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {demoWorkers.map(w => (
              <Marker key={w.id} position={[w.lat, w.lng]}>
                <Popup>
                  <div className="p-2 min-w-[160px]">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2">{w.name[0]}</div>
                    <p className="font-bold text-gray-800 text-sm">{w.name}</p>
                    <p className="text-xs text-indigo-600 font-semibold">{w.cat}</p>
                    <p className="text-xs text-amber-500 font-bold mt-1">{w.rating} ★</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </motion.div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 dark:bg-slate-900/50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Features</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mt-2">Why Choose SewaPro?</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Verified Workers', desc: 'All workers are ID-verified and background-checked.', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
              { icon: MapPin, title: 'Live Location Tracking', desc: 'Track worker location on map in real time after acceptance.', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
              { icon: Clock, title: 'Fast Response', desc: 'Average worker response time under 5 minutes.', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
              { icon: TrendingUp, title: 'Transparent Pricing', desc: 'Clear per-hour rates. No hidden fees.', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
              { icon: Star, title: 'Ratings & Reviews', desc: 'Honest reviews after every job. Quality guaranteed.', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
              { icon: Bell, title: 'Instant Notifications', desc: 'Real-time alerts via Socket.io for every update.', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
            ].map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color} group-hover:scale-110 transition-transform`}>
                  <f.icon size={20} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <motion.div {...fadeUp} className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-400 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="relative z-10">
            <CheckCircle size={40} className="text-emerald-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">Join SewaPro today — post jobs, find workers, and get things done.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => setAuthModal('signup')}
                className="bg-white text-indigo-700 font-bold px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-all shadow-lg text-base">
                Get Started — It's Free
              </button>
              <button onClick={() => setAuthModal('signup')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg text-base">
                Join as a Worker
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wrench size={13} className="text-white" />
            </div>
            <span className="font-extrabold text-gray-900 dark:text-white">Sewa<span className="text-indigo-600">Pro</span></span>
          </div>
          <p className="text-sm text-gray-400">© 2025 SewaPro. Made with care in Gujarat.</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>Live</span>
          </div>
        </div>
      </footer>

      {authModal && <AuthModal initialTab={authModal} onClose={() => setAuthModal(null)} />}
    </div>
  );
};

export default Landing;

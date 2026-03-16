import { Routes, Route, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Landing from './pages/Landing';
import ClientDashboard from './pages/client/Dashboard';
import NearbyWorkers from './pages/client/NearbyWorkers';
import WorkerDashboard from './pages/worker/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

const PublicLayout = () => (<><Navbar /><Outlet /></>);
const DashboardLayout = () => <Outlet />;

function App() {
  const { mode } = useSelector(s => s.theme);
  return (
    <div className={`min-h-screen ${mode==='dark'?'dark':''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white transition-colors duration-200">
        <Routes>
          <Route element={<PublicLayout/>}>
            <Route path="/" element={<Landing/>}/>
          </Route>
          <Route element={<DashboardLayout/>}>
            <Route element={<ProtectedRoute allowedRole="client"/>}>
              <Route path="/client/dashboard" element={<ClientDashboard/>}/>
              <Route path="/client/nearby" element={<NearbyWorkers/>}/>
            </Route>
            <Route element={<ProtectedRoute allowedRole="worker"/>}>
              <Route path="/worker/dashboard" element={<WorkerDashboard/>}/>
            </Route>
            <Route element={<ProtectedRoute allowedRole="admin"/>}>
              <Route path="/admin/dashboard" element={<AdminDashboard/>}/>
            </Route>
          </Route>
        </Routes>
      </div>
    </div>
  );
}

export default App;

import { useContext, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
 
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div 
      className="flex h-screen overflow-hidden relative transition-all duration-700"
      style={{
        backgroundImage: `url(${user?.isAdmin ? '/src/assets/backgrounds/admin_bg.png' : '/src/assets/backgrounds/user_bg.png'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dynamic Overlay for depth & readability */}
      <div className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
        user?.isAdmin ? 'bg-indigo-950/20' : 'bg-white/10'
      }`}></div>

      {/* Sidebar - responsive behavior handled inside Sidebar.jsx */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden w-full relative z-10">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProtectedRoute;

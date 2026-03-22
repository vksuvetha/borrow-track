import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  History,
  AlertCircle,
  Scan,
  LogOut,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const adminLinks = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Manage Items', path: '/admin/items', icon: <Package size={20} /> },
    { name: 'Manage Users', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Borrow History', path: '/admin/history', icon: <History size={20} /> },
    { name: 'Overdue Items', path: '/admin/overdue', icon: <AlertCircle size={20} /> },
  ];

  const userLinks = [
    { name: 'Available Items', path: '/', icon: <Package size={20} /> },
    { name: 'My History', path: '/my-history', icon: <History size={20} /> },
    { name: 'Scan QR', path: '/scan', icon: <Scan size={20} /> },
  ];

  const links = user?.isAdmin ? adminLinks : userLinks;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white/80 backdrop-blur-2xl border-r border-white/40 shadow-[4px_0_24px_rgba(0,0,0,0.05)] transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0 lg:bg-white/60 lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-indigo-600 uppercase tracking-wider">BorrowTrack</span>
          <button 
            className="lg:hidden p-1 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="px-4 mt-6">
          <ul className="space-y-2">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
      </div>
    </>
  );
};

export default Sidebar;

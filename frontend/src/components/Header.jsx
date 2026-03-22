import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { UserCircle, LogOut, Menu } from 'lucide-react';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 tracking-tight hidden xs:block">
          Welcome, {user?.name.split(' ')[0]}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 text-gray-700 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
          <UserCircle size={24} className="text-indigo-500" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none">{user?.name}</span>
            <span className="text-xs text-gray-500 mt-1 capitalize">{user?.isAdmin ? 'Administrator' : 'User'}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition shadow-sm font-medium"
          title="Logout"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;

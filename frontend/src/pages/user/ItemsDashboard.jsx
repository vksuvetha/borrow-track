import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { Package, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ItemsDashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchItems = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`/api/items?keyword=${search}`, config);
      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If admin lands on user dashboard, redirect to admin panel
    if (user && user.isAdmin) {
        navigate('/admin');
        return;
    }
    fetchItems();
  }, [user, search, navigate]);

  if (loading) return <div>Loading available items...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-black text-gray-900 tracking-tight">Available Items</h2>
           <p className="text-gray-600 font-medium mt-1">Browse and scan items to borrow.</p>
        </div>
        <div className="relative w-full md:w-auto">
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 pl-11 pr-4 py-3 border border-white/40 bg-white/60 backdrop-blur-md rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm font-medium text-gray-800 placeholder-gray-400"
          />
          <Search className="absolute left-4 top-3.5 text-indigo-400" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item._id} className="glass-card flex flex-col h-full overflow-hidden group">
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-sm ${item.status === 'Available' ? 'bg-green-100/80 text-green-800 border border-green-200' : 'bg-red-100/80 text-red-800 border border-red-200'}`}>
                  {item.status === 'Available' ? `Available (${item.availableCount})` : 'All Borrowed'}
                </div>
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                   <Package size={20} />
                </div>
              </div>
              
              <h3 className="text-xl font-extrabold text-gray-900 mb-2 leading-tight tracking-tight">{item.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-3 font-medium flex-1">{item.description}</p>
            </div>
            
            <div className="p-5 border-t border-white/40 bg-gradient-to-b from-white/30 to-white/60 flex justify-between items-center mt-auto backdrop-blur-sm">
              <div className="text-[10px] font-black text-gray-400 font-mono tracking-wider">ID: {item.qrCodeId.substring(0,8)}</div>
              <button 
                onClick={() => navigate('/scan')}
                className={`text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 ${item.status === 'Available' ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200' : 'bg-gray-200/50 text-gray-400 cursor-not-allowed shadow-none border border-gray-200'}`}
                disabled={item.status !== 'Available'}
              >
                {item.status === 'Available' ? 'Scan to Borrow' : 'Unavailable'}
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center py-20 glass-panel flex flex-col items-center justify-center">
            <Search className="text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-700">No items found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemsDashboard;

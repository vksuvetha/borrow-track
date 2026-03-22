import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { Package, Users, AlertCircle, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const { user } = useContext(AuthContext);

  const fetchStats = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.get('/api/admin/stats', config);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCron = async () => {
    setTestLoading(true);
    setTestMessage('');
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/borrow/test-cron', config);
      setTestMessage(`Success: ${data.summary.totalOverdueFound} Overdue, ${data.summary.totalDueTodayFound} Due Today.`);
    } catch (error) {
      setTestMessage('Test failed. Check backend console.');
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  if (loading) return <div className="text-center mt-10">Loading stats...</div>;

  const statCards = [
    { title: 'Total Items', value: stats?.totalItems, icon: <Package size={24} className="text-blue-500" />, color: 'bg-blue-100/30', border: 'border-blue-200/50' },
    { title: 'Available Items', value: stats?.availableItems, icon: <Package size={24} className="text-green-500" />, color: 'bg-green-100/30', border: 'border-green-200/50' },
    { title: 'Borrowed Items', value: stats?.borrowedItems, icon: <RefreshCw size={24} className="text-yellow-500" />, color: 'bg-yellow-100/30', border: 'border-yellow-200/50' },
    { title: 'Overdue Items', value: stats?.overdueItems, icon: <AlertCircle size={24} className="text-red-500" />, color: 'bg-red-100/30', border: 'border-red-200/50' },
    { title: 'Total Users', value: stats?.totalUsers, icon: <Users size={24} className="text-purple-500" />, color: 'bg-purple-100/30', border: 'border-purple-200/50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Admin Overview</h2>
           <p className="text-white/80 font-medium mt-1">Real-time system statistics.</p>
        </div>
        <div className="flex items-center gap-3">
          {testMessage && <span className="text-[10px] font-black tracking-widest uppercase bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl text-white animate-pulse shadow-sm border border-white/30">{testMessage}</span>}
          <button
            onClick={handleTestCron}
            disabled={testLoading}
            className="px-5 py-3 bg-white/90 text-indigo-900 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-lg shadow-black/10 active:scale-95 disabled:opacity-50 flex items-center gap-2 border border-white"
          >
            <RefreshCw size={14} className={testLoading ? 'animate-spin' : ''} />
            {testLoading ? 'Running Test...' : 'Trigger Notifications'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 text-left">
        {statCards.map((stat, idx) => (
          <div key={idx} className="glass-card p-6 flex flex-col items-center justify-center text-center group">
            <div className="bg-white p-4 rounded-2xl shadow-sm mb-5 group-hover:scale-110 transition-transform duration-300">
              {stat.icon}
            </div>
            <h3 className="text-gray-500 text-xs font-black uppercase tracking-widest mb-2">{stat.title}</h3>
            <p className="text-4xl font-black text-gray-900 drop-shadow-sm">{stat.value !== undefined ? stat.value : '-'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;

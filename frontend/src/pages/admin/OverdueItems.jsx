import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { Mail, AlertCircle } from 'lucide-react';

const OverdueItems = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailLoading, setEmailLoading] = useState(null); // Track which record is sending
  const { user } = useContext(AuthContext);

  const fetchOverdue = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/borrow/overdue', config);
      setRecords(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, [user]);

  const sendReminderEmail = async (recordId) => {
    setEmailLoading(recordId);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`/api/borrow/reminder/${recordId}`, {}, config);
      alert('Reminder email sent successfully!');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to send reminder email.');
    } finally {
      setEmailLoading(null);
    }
  };

  if (loading) return <div>Loading overdue items...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <AlertCircle className="text-red-500" /> Overdue Items
      </h2>

      {records.length === 0 ? (
        <div className="bg-green-50 text-green-700 p-6 rounded-xl border border-green-200 text-center text-lg shadow-sm">
          Great job! There are no overdue items right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((record) => (
            <div key={record._id} className="bg-white rounded-xl shadow-sm border border-red-200 p-6 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-semibold border border-red-100">
                  Overdue
                </div>
                <div className="text-gray-400 text-sm font-mono">ID: {record.item?.qrCodeId?.substring(0,8)}...</div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1">{record.item?.name}</h3>
              
              <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-4 text-sm">
                <p className="text-gray-600 mb-1"><span className="font-semibold text-gray-700">Borrower:</span> {record.user?.name}</p>
                <p className="text-gray-600 mb-1"><span className="font-semibold text-gray-700">Email:</span> {record.user?.email}</p>
                <p className="text-red-600 font-medium"><span className="font-semibold text-gray-700">Due limit:</span> {new Date(record.expectedReturnDate).toLocaleDateString()}</p>
              </div>

              <button
                onClick={() => sendReminderEmail(record._id)}
                disabled={emailLoading === record._id}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors disabled:opacity-50"
              >
                <Mail size={16} /> {emailLoading === record._id ? 'Sending...' : 'Send Quick Reminder'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OverdueItems;

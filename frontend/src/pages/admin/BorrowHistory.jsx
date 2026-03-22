import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { RefreshCcw } from 'lucide-react';

const BorrowHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  const fetchRecords = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/borrow', config);
      setRecords(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const markReturned = async (qrCodeId) => {
    if (window.confirm('Manually mark this item as returned?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.put(`/api/borrow/return/${qrCodeId}`, {}, config);
        fetchRecords();
      } catch (error) {
        alert(error.response?.data?.message || 'Error occurred');
      }
    }
  };

  if (loading) return <div>Loading history...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Global Borrowing History</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item & QR</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrower</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{record.item?.name || 'Deleted Item'}</div>
                  <div className="text-xs text-gray-400 font-mono">ID: {record.item?.qrCodeId || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{record.user?.name || 'Unknown User'}</div>
                  <div className="text-xs text-gray-500">{record.user?.email || ''}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Borrowed: {new Date(record.borrowDate).toLocaleDateString()}</div>
                  <div className={`text-sm ${new Date(record.expectedReturnDate) < new Date() && record.status === 'Borrowed' ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                    Due: {new Date(record.expectedReturnDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'Returned' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {(record.status === 'Borrowed' || record.status === 'Overdue') && record.item?.qrCodeId && (
                    <button
                      onClick={() => markReturned(record.item.qrCodeId)}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end gap-1 w-full"
                    >
                      <RefreshCcw size={16} /> Mark Returned
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BorrowHistory;

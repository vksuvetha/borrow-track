import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { Trash2, UserCheck, UserX } from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  const fetchUsers = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/users', config);
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handleDeleteUser = async (id) => {
    if (window.confirm('Delete this user?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`/api/users/${id}`, config);
        fetchUsers();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const toggleAdminStatus = async (id, currentStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/users/${id}`, { isAdmin: !currentStatus }, config);
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Users</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{u.name} {user._id === u._id && <span className="text-xs text-indigo-500 font-bold ml-2">(You)</span>}</div>
                  <div className="text-sm text-gray-500">{u.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.isAdmin ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                    {u.isAdmin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {user._id !== u._id && (
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => toggleAdminStatus(u._id, u.isAdmin)}
                        className={`${u.isAdmin ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'} p-2 rounded-full transition`}
                        title={u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      >
                        {u.isAdmin ? <UserX size={18} /> : <UserCheck size={18} />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-full transition"
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
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

export default ManageUsers;

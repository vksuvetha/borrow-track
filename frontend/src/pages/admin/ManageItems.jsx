import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Trash2, Edit } from 'lucide-react';

const ManageItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', copies: 1 });
  const [editingItem, setEditingItem] = useState({ id: '', name: '', description: '', copies: 1, originalName: '' });
  
  const { user } = useContext(AuthContext);

  const fetchItems = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/items', config);
      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/items', newItem, config);
      setNewItem({ name: '', description: '', copies: 1 });
      setShowAddModal(false);
      fetchItems();
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (groupItem) => {
    setEditingItem({ id: groupItem._id, name: groupItem.name, description: groupItem.description, copies: groupItem.copiesCount, originalName: groupItem.name });
    setShowEditModal(true);
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/items/${editingItem.id}`, { 
          name: editingItem.name, 
          description: editingItem.description,
          copies: editingItem.copies,
          originalName: editingItem.originalName
      }, config);
      setShowEditModal(false);
      fetchItems();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteGroup = async (group) => {
    if (window.confirm(`Delete ALL copies of ${group.name}?`)) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const matchingItems = items.filter(i => i.qrCodeId === group.qrCodeId);
        for (const item of matchingItems) {
           await axios.delete(`/api/items/${item._id}`, config);
        }
        fetchItems();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const groupedItems = items;

  const downloadQR = (id, name) => {
    const canvas = document.getElementById(`qr-${id}`);
    if (!canvas) return;
    const pngFile = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.download = `QR-${name}.png`;
    downloadLink.href = `${pngFile}`;
    downloadLink.click();
  };

  if (loading) return <div>Loading items...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Items</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
        >
          + Add New Item
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Copies</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groupedItems.map((group) => (
              <tr key={group._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{group.name}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">{group.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{group.copiesCount}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${group.availableCount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {group.availableCount > 0 ? `Available (${group.availableCount})` : 'All Borrowed'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-1 border rounded hidden">
                      <QRCodeCanvas 
                        id={`qr-${group._id}`} 
                        value={`${window.location.protocol}//${window.location.host}/scan?qrId=${group.qrCodeId}`} 
                        size={256} 
                        includeMargin={true} 
                        level="M" 
                        style={{ width: 160, height: 160 }} 
                      />
                    </div>
                    <button
                      onClick={() => downloadQR(group._id, group.name)}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 text-sm bg-indigo-50 px-3 py-1.5 rounded-md"
                      title="Download QR Code"
                    >
                      <Download size={16} /> Download QR
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openEditModal(group)}
                    className="text-indigo-600 hover:text-indigo-900 ml-4 p-2 hover:bg-indigo-50 rounded-full transition"
                    title="Edit Item"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group)}
                    className="text-red-600 hover:text-red-900 ml-2 p-2 hover:bg-red-50 rounded-full transition"
                    title="Delete All Copies"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {groupedItems.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  No items found. Add one to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-100">
            <h3 className="text-xl font-bold mb-4">Add New Item</h3>
            <form onSubmit={handleAddItem}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Item Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Number of Copies</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newItem.copies}
                  onChange={(e) => setNewItem({ ...newItem, copies: e.target.value })}
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium shadow-sm transition"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-100">
            <h3 className="text-xl font-bold mb-4">Edit Item</h3>
            <form onSubmit={handleEditItem}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Item Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Number of Copies</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editingItem.copies}
                  onChange={(e) => setEditingItem({ ...editingItem, copies: e.target.value })}
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium shadow-sm transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageItems;

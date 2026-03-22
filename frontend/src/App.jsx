import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageItems from './pages/admin/ManageItems';
import ManageUsers from './pages/admin/ManageUsers';
import BorrowHistory from './pages/admin/BorrowHistory';
import OverdueItems from './pages/admin/OverdueItems';

import ItemsDashboard from './pages/user/ItemsDashboard';
import MyHistory from './pages/user/MyHistory';
import ScanQR from './pages/user/ScanQR';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* User Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ItemsDashboard />} />
            <Route path="/my-history" element={<MyHistory />} />
            <Route path="/scan" element={<ScanQR />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute adminOnly={true} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/items" element={<ManageItems />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/history" element={<BorrowHistory />} />
            <Route path="/admin/overdue" element={<OverdueItems />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

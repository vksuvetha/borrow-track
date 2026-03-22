import Item from '../models/itemModel.js';
import User from '../models/userModel.js';
import BorrowRecord from '../models/borrowRecordModel.js';

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  const totalItems = await Item.countDocuments();
  const borrowedItems = await Item.countDocuments({ status: 'Borrowed' });
  const availableItems = totalItems - borrowedItems;
  
  const totalUsers = await User.countDocuments();

  const currentDate = new Date();
  const overdueItems = await BorrowRecord.countDocuments({
    $or: [
      { status: 'Overdue' },
      { status: 'Borrowed', expectedReturnDate: { $lt: currentDate } }
    ]
  });

  res.json({
    totalItems,
    borrowedItems,
    availableItems,
    overdueItems,
    totalUsers,
  });
};

export { getAdminStats };

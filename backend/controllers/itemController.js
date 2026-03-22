import Item from '../models/itemModel.js';
import BorrowRecord from '../models/borrowRecordModel.js';
import crypto from 'crypto';

// @desc    Get all items
// @route   GET /api/items
// @access  Private
const getItems = async (req, res) => {
  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const items = await Item.find({ ...keyword }).populate('addedBy', 'name email');
  
  // Group by qrCodeId to show unique books
  const groupedMap = {};
  
  items.forEach(item => {
    const key = item.qrCodeId;
    if (!groupedMap[key]) {
      const itemObj = item.toObject ? item.toObject() : item;
      groupedMap[key] = { 
        ...itemObj, 
        copiesCount: 1,
        availableCount: item.status === 'Available' ? 1 : 0 
      };
    } else {
      groupedMap[key].copiesCount += 1;
      if (item.status === 'Available') {
        groupedMap[key].availableCount += 1;
      }
    }
  });

  // After gathering counts, set overall status for each unique group
  const groupedResult = Object.values(groupedMap).map(item => ({
    ...item,
    status: item.availableCount > 0 ? 'Available' : 'Borrowed'
  }));

  res.json(groupedResult);
};

// @desc    Get item by ID
// @route   GET /api/items/:id
// @access  Private
const getItemById = async (req, res) => {
  const item = await Item.findById(req.params.id);

  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ message: 'Item not found' });
  }
};

// @desc    Get item by QR Code ID
// @route   GET /api/items/qr/:qrCodeId
// @access  Private
const getItemByQrCode = async (req, res) => {
  const allItems = await Item.find({ qrCodeId: req.params.qrCodeId });

  if (allItems.length > 0) {
    const availableCopy = allItems.find(i => i.status === 'Available');
    if (availableCopy) {
       res.json(availableCopy);
    } else {
       const itemIds = allItems.map(i => i._id);
       const soonestRecord = await BorrowRecord.findOne({ 
           item: { $in: itemIds },
           status: { $in: ['Borrowed', 'Overdue'] }
       }).sort({ expectedReturnDate: 1 });

       const itemData = allItems[0].toObject();
       if (soonestRecord) {
           itemData.nextAvailableDate = soonestRecord.expectedReturnDate;
       }
       res.json(itemData);
    }
  } else {
    res.status(404).json({ message: 'Item not found' });
  }
};

// @desc    Create a item
// @route   POST /api/items
// @access  Private/Admin
const createItem = async (req, res) => {
  const { name, description, copies } = req.body;
  const numCopies = parseInt(copies) || 1;
  const itemsToCreate = [];
  const qrCodeId = crypto.randomUUID();

  for (let i = 0; i < numCopies; i++) {
    itemsToCreate.push({
      name: name,
      description: description || '',
      addedBy: req.user._id,
      qrCodeId: qrCodeId,
      status: 'Available',
    });
  }

  const createdItems = await Item.insertMany(itemsToCreate);
  res.status(201).json(createdItems);
};

// @desc    Update a item
// @route   PUT /api/items/:id
// @access  Private/Admin
const updateItem = async (req, res) => {
  const { name, description, status, copies } = req.body;

  const item = await Item.findById(req.params.id);

  if (item) {
    const qrCodeId = item.qrCodeId;
    let allCopies = await Item.find({ qrCodeId });
    
    if (copies !== undefined) {
        const targetCopies = parseInt(copies);
        const currentCopies = allCopies.length;
        
        if (targetCopies > currentCopies) {
            const numToAdd = targetCopies - currentCopies;
            const itemsToCreate = [];
            for (let i = 0; i < numToAdd; i++) {
                itemsToCreate.push({
                    name: name || item.name,
                    description: description !== undefined ? description : item.description,
                    addedBy: item.addedBy,
                    qrCodeId: qrCodeId,
                    status: 'Available',
                });
            }
            await Item.insertMany(itemsToCreate);
        } else if (targetCopies < currentCopies) {
            const numToRemove = currentCopies - targetCopies;
            let removedCount = 0;
            const availableCopies = allCopies.filter(c => c.status === 'Available');
            for (const copy of availableCopies) {
                if (removedCount >= numToRemove) break;
                await Item.deleteOne({ _id: copy._id });
                removedCount++;
            }
        }
    }
    
    await Item.updateMany(
        { qrCodeId },
        { $set: { 
            name: name || item.name, 
            description: description !== undefined ? description : item.description 
        } }
    );
    
    if (status) {
        await Item.updateOne({ _id: req.params.id }, { $set: { status: status } });
    }

    res.json({ message: 'Items updated successfully' });
  } else {
    res.status(404).json({ message: 'Item not found' });
  }
};

// @desc    Delete a item
// @route   DELETE /api/items/:id
// @access  Private/Admin
const deleteItem = async (req, res) => {
  const item = await Item.findById(req.params.id);

  if (item) {
    await Item.deleteOne({ _id: item._id });
    res.json({ message: 'Item removed' });
  } else {
    res.status(404).json({ message: 'Item not found' });
  }
};

export {
  getItems,
  getItemById,
  getItemByQrCode,
  createItem,
  updateItem,
  deleteItem,
};

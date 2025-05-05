const Operation = require('../models/Operation');
const User = require('../models/User');

const createOperation = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const {
      type,
      status,
      notes
    } = req.body;

    const operation = new Operation({
      type,
      status: status || 'pending',
      notes,
      createdBy: req.user._id
    });

    await operation.save();

    res.status(201).json({
      message: 'Operation created successfully',
      operation: await operation.populate('createdBy')
    });
  } catch (error) {
    console.error('Error creating operation:', error);
    res.status(500).json({ message: 'Error creating operation', error: error.message });
  }
};

const getAllOperations = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { type: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const operations = await Operation.find(filter)
      .populate('createdBy')
      .sort({ createdAt: -1 });

    res.json(operations);
  } catch (error) {
    console.error('Error fetching operations:', error);
    res.status(500).json({ message: 'Error fetching operations', error: error.message });
  }
};

const getOperationById = async (req, res) => {
  try {
    const operation = await Operation.findById(req.params.id)
      .populate('createdBy');
    
    if (!operation) {
      return res.status(404).json({ message: 'Operation not found' });
    }

    res.json(operation);
  } catch (error) {
    console.error('Error fetching operation:', error);
    res.status(500).json({ message: 'Error fetching operation', error: error.message });
  }
};

const updateOperation = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const {
      type,
      status,
      notes
    } = req.body;

    const operation = await Operation.findById(req.params.id);
    
    if (!operation) {
      return res.status(404).json({ message: 'Operation not found' });
    }

    if (type) operation.type = type;
    if (status) operation.status = status;
    if (notes) operation.notes = notes;

    operation.updatedAt = new Date();
    operation.updatedBy = req.user._id;
    await operation.save();

    res.json({
      message: 'Operation updated successfully',
      operation: await operation.populate(['createdBy', 'updatedBy'])
    });
  } catch (error) {
    console.error('Error updating operation:', error);
    res.status(500).json({ message: 'Error updating operation', error: error.message });
  }
};

const deleteOperation = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const operation = await Operation.findById(req.params.id);
    
    if (!operation) {
      return res.status(404).json({ message: 'Operation not found' });
    }

    await operation.deleteOne();

    res.json({ message: 'Operation deleted successfully' });
  } catch (error) {
    console.error('Error deleting operation:', error);
    res.status(500).json({ message: 'Error deleting operation', error: error.message });
  }
};

const getOperationsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { status } = req.query;
    
    const filter = { type };
    if (status) filter.status = status;

    const operations = await Operation.find(filter)
      .populate('createdBy')
      .sort({ createdAt: -1 });

    res.json(operations);
  } catch (error) {
    console.error('Error fetching operations by type:', error);
    res.status(500).json({ message: 'Error fetching operations by type', error: error.message });
  }
};

const getOperationsSummary = async (req, res) => {
  try {
    const summary = await Operation.aggregate([
      {
        $group: {
          _id: null,
          totalOperations: { $sum: 1 },
          completedOperations: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          operationTypes: {
            $addToSet: '$type'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalOperations: 1,
          completedOperations: 1,
          operationTypes: 1
        }
      }
    ]);

    res.json(summary[0] || { totalOperations: 0, completedOperations: 0, operationTypes: [] });
  } catch (error) {
    console.error('Error fetching operations summary:', error);
    res.status(500).json({ message: 'Error fetching operations summary', error: error.message });
  }
};

module.exports = {
  createOperation,
  getAllOperations,
  getOperationById,
  updateOperation,
  deleteOperation,
  getOperationsByType,
  getOperationsSummary
}; 
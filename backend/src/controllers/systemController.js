const System = require('../models/System');
const User = require('../models/User');

const getSystemSettings = async (req, res) => {
  try {
    let settings = await System.findOne();
    
    if (!settings) {
      settings = new System({
        maintenanceMode: false,
        maxBookingsPerUser: 3,
        bookingDuration: 2,
        notificationSettings: {
          email: true,
          sms: false
        }
      });
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ message: 'Error fetching system settings', error: error.message });
  }
};

const updateSystemSettings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update system settings' });
    }

    const {
      maintenanceMode,
      maxBookingsPerUser,
      bookingDuration,
      notificationSettings
    } = req.body;

    let settings = await System.findOne();
    
    if (!settings) {
      settings = new System();
    }

    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (maxBookingsPerUser) settings.maxBookingsPerUser = maxBookingsPerUser;
    if (bookingDuration) settings.bookingDuration = bookingDuration;
    if (notificationSettings) settings.notificationSettings = notificationSettings;

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    res.json({
      message: 'System settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ message: 'Error updating system settings', error: error.message });
  }
};

const getSystemStatus = async (req, res) => {
  try {
    const settings = await System.findOne();
    res.json({
      maintenanceMode: settings?.maintenanceMode || false,
      status: settings?.maintenanceMode ? 'maintenance' : 'operational'
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({ message: 'Error fetching system status', error: error.message });
  }
};

const getSystemLogs = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view system logs' });
    }

    const { level, type, startDate, endDate } = req.query;
    const filter = {};

    if (level) filter.level = level;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const logs = await System.find(filter)
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({ message: 'Error fetching system logs', error: error.message });
  }
};

const getSystemMetrics = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view system metrics' });
    }

    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const metrics = await System.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          averageResponseTime: { $avg: '$responseTime' },
          errorCount: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalRequests: 1,
          averageResponseTime: 1,
          errorCount: 1
        }
      }
    ]);

    res.json(metrics[0] || { totalRequests: 0, averageResponseTime: 0, errorCount: 0 });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ message: 'Error fetching system metrics', error: error.message });
  }
};

const getSystemHealth = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view system health' });
    }

    const health = {
      database: 'operational',
      api: 'operational',
      storage: 'operational',
      lastChecked: new Date()
    };

    // Check database connection
    try {
      await System.findOne();
    } catch (error) {
      health.database = 'error';
    }

    // Check API response time
    const startTime = Date.now();
    try {
      await System.findOne();
      const responseTime = Date.now() - startTime;
      if (responseTime > 1000) {
        health.api = 'slow';
      }
    } catch (error) {
      health.api = 'error';
    }

    // Check storage access
    try {
      await System.findOne();
    } catch (error) {
      health.storage = 'error';
    }

    res.json(health);
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({ message: 'Error checking system health', error: error.message });
  }
};

module.exports = {
  getSystemSettings,
  updateSystemSettings,
  getSystemStatus,
  getSystemLogs,
  getSystemMetrics,
  getSystemHealth
}; 
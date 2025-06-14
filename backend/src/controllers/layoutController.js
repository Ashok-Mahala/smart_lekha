const SeatLayout = require( '../models/Layout');

// Save or update layout
const saveLayout = async (req, res) => {
    try {
      const propertyId = req.params.propertyId; // Get from URL params
      const { rows, columns, aisleWidth, seatWidth, seatHeight, gap, layout } = req.body;
      
      console.log('Received layout data:', {
        propertyId,
        rows,
        columns,
        aisleWidth,
        seatWidth,
        seatHeight,
        gap,
        layout
      });
  
      // Validate input
      if (!rows || !columns || !layout) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
  
      // Check if layout exists for this property
      let existingLayout = await SeatLayout.findOne({ propertyId });
  
      if (existingLayout) {
        // Update existing layout
        existingLayout.rows = rows;
        existingLayout.columns = columns;
        existingLayout.aisleWidth = aisleWidth;
        existingLayout.seatWidth = seatWidth;
        existingLayout.seatHeight = seatHeight;
        existingLayout.gap = gap;
        existingLayout.layout = layout;
        existingLayout.updatedAt = Date.now();
        
        await existingLayout.save();
        return res.status(200).json(existingLayout);
      } else {
        // Create new layout
        const newLayout = new SeatLayout({
          propertyId,
          rows,
          columns,
          aisleWidth,
          seatWidth,
          seatHeight,
          gap,
          layout
        });
        
        await newLayout.save();
        return res.status(201).json(newLayout);
      }
    } catch (error) {
      console.error('Error saving layout:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

// Get layout by property
const getLayout = async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    const layout = await SeatLayout.findOne({ propertyId });
    
    if (!layout) {
      return res.status(200).json({ message: 'Layout not found' });
    }
    
    res.status(200).json(layout);
  } catch (error) {
    console.error('Error fetching layout:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
    saveLayout,
    getLayout
}; 
const SeatLayout = require( '../models/Layout');

// Save or update layout
const saveLayout = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const { 
      rows, 
      columns, 
      aisleWidth, 
      seatWidth, 
      seatHeight, 
      gap, 
      showNumbers,
      showStatus,
      numberingDirection,
      layout 
    } = req.body;

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
      existingLayout.aisleWidth = aisleWidth || existingLayout.aisleWidth;
      existingLayout.seatWidth = seatWidth || existingLayout.seatWidth;
      existingLayout.seatHeight = seatHeight || existingLayout.seatHeight;
      existingLayout.gap = gap || existingLayout.gap;
      existingLayout.showNumbers = showNumbers !== undefined ? showNumbers : existingLayout.showNumbers;
      existingLayout.showStatus = showStatus !== undefined ? showStatus : existingLayout.showStatus;
      existingLayout.numberingDirection = numberingDirection || existingLayout.numberingDirection;
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
        aisleWidth: aisleWidth || 2,
        seatWidth: seatWidth || 1,
        seatHeight: seatHeight || 1,
        gap: gap || 1,
        showNumbers: showNumbers !== undefined ? showNumbers : true,
        showStatus: showStatus !== undefined ? showStatus : true,
        numberingDirection: numberingDirection || 'horizontal',
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
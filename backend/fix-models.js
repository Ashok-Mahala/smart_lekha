const fs = require('fs');
const path = require('path');

// Directories to check
const dirsToCheck = [
  path.join(__dirname, 'src', 'controllers'),
  path.join(__dirname, 'src', 'routes'),
  path.join(__dirname, 'src', 'utils'),
  path.join(__dirname, 'src', 'middleware')
];

// Define the correct model paths to use
const correctModelPaths = {
  'student.model': 'Student',
  'booking.model': 'Booking',
  'seat.model': 'Seat',
  'payment.model': 'Payment',
  'operation.model': 'Operation',
  'report.model': 'Report',
  'financial.model': 'Financial',
  'system.model': 'System'
};

let fixedFiles = 0;
let totalFiles = 0;

console.log('Scanning files for model import issues...');

// Process each directory
dirsToCheck.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist, skipping...`);
    return;
  }

  const files = fs.readdirSync(dir).filter(file => file.endsWith('.js'));
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    totalFiles++;
    
    // Check and fix each model import
    Object.entries(correctModelPaths).forEach(([oldModelName, newModelName]) => {
      // Fix model imports
      const importRegex = new RegExp(`require\\(['\"]\\.\\.\/models\/${oldModelName}['\"]\\)`, 'g');
      content = content.replace(importRegex, `require('../models/${newModelName}')`);
      
      // Fix destructured imports
      const destructuredImportRegex = new RegExp(`\\{ .* \\} = require\\(['\"]\\.\\.\/models\/${oldModelName}['\"]\\)`, 'g');
      content = content.replace(destructuredImportRegex, (match) => {
        // Extract the destructured part
        const destructuredPart = match.match(/\{ (.*) \}/)[1];
        return `${destructuredPart} = require('../models/${newModelName}')`;
      });
    });
    
    // Write back if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed model imports in ${filePath}`);
      fixedFiles++;
    }
  });
});

console.log(`\nFixed model imports in ${fixedFiles} out of ${totalFiles} files.`); 
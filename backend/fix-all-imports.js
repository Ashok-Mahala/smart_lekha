const fs = require('fs');
const path = require('path');

console.log('Starting comprehensive import fixes...');

// Define paths to check
const dirsToCheck = [
  path.join(__dirname, 'src', 'controllers'),
  path.join(__dirname, 'src', 'routes'),
  path.join(__dirname, 'src', 'middleware'),
  path.join(__dirname, 'src', 'utils'),
  path.join(__dirname, 'src')
];

// Define model naming mappings
const modelMappings = {
  // Standardize on the capitalized model names
  'student.model': 'Student',
  'booking.model': 'Booking',
  'seat.model': 'Seat',
  'payment.model': 'Payment',
  'operation.model': 'Operation',
  'report.model': 'Report',
  'financial.model': 'Financial',
  'system.model': 'System',
  'attendance.model': 'Attendance'
};

// Define route file mappings (standardize on the .routes.js format)
const routeMappings = {
  'studentRoutes': 'student.routes',
  'seatRoutes': 'seat.routes',
  'bookingRoutes': 'booking.routes',
  'attendanceRoutes': 'attendance.routes',
  'paymentRoutes': 'payment.routes',
  'reportRoutes': 'report.routes',
  'operationRoutes': 'operation.routes',
  'authRoutes': 'auth.routes',
  'financialRoutes': 'financial.routes',
  'systemRoutes': 'system.routes'
};

// Define controller file mappings
const controllerMappings = {
  'studentController': 'student.controller',
  'seatController': 'seat.controller',
  'bookingController': 'booking.controller',
  'attendanceController': 'attendance.controller',
  'paymentController': 'payment.controller',
  'reportController': 'report.controller',
  'operationController': 'operation.controller',
  'authController': 'auth.controller',
  'financialController': 'financial.controller',
  'systemController': 'system.controller'
};

let fixedFiles = 0;
let totalFiles = 0;

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
    
    // Fix model imports
    Object.entries(modelMappings).forEach(([oldModelName, newModelName]) => {
      // Fix regular imports
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
    
    // Fix route imports
    Object.entries(routeMappings).forEach(([oldRouteName, newRouteName]) => {
      const importRegex = new RegExp(`require\\(['\"]\\.\\.\/routes\/${oldRouteName}['\"]\\)`, 'g');
      content = content.replace(importRegex, `require('../routes/${newRouteName}')`);
    });
    
    // Fix controller imports
    Object.entries(controllerMappings).forEach(([oldControllerName, newControllerName]) => {
      const importRegex = new RegExp(`require\\(['\"]\\.\\.\/controllers\/${oldControllerName}['\"]\\)`, 'g');
      content = content.replace(importRegex, `require('../controllers/${newControllerName}')`);
    });
    
    // Fix asyncHandler imports
    const asyncHandlerRegex = /const asyncHandler = require\(['"]\.\.\/utils\/asyncHandler['"]\)/g;
    content = content.replace(asyncHandlerRegex, "const { asyncHandler } = require('../utils/asyncHandler')");
    
    // Fix error handler imports
    const errorHandlerRegex = /const errorHandler = require\(['"]\.\.\/middleware\/error['"]\)/g;
    content = content.replace(errorHandlerRegex, "const { errorHandler } = require('../middleware/errorHandler')");
    
    // Write back if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed imports in ${filePath}`);
      fixedFiles++;
    }
  });
});

console.log(`\nFixed imports in ${fixedFiles} out of ${totalFiles} files.`);

// Update the app.js file to use the correct route file names
const appFilePath = path.join(__dirname, 'src', 'app.js');
if (fs.existsSync(appFilePath)) {
  let appContent = fs.readFileSync(appFilePath, 'utf8');
  let originalAppContent = appContent;
  
  // Fix route imports in app.js
  Object.entries(routeMappings).forEach(([oldRouteName, newRouteName]) => {
    const importRegex = new RegExp(`require\\(['\"]\\.\\/routes\\/${oldRouteName}['\"]\\)`, 'g');
    appContent = appContent.replace(importRegex, `require('./routes/${newRouteName}')`);
  });
  
  if (appContent !== originalAppContent) {
    fs.writeFileSync(appFilePath, appContent);
    console.log(`✅ Fixed route imports in app.js`);
  }
}

// Update the server.js file to use the correct index.js path
const serverFilePath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverFilePath)) {
  let serverContent = fs.readFileSync(serverFilePath, 'utf8');
  
  // Fix require path if it's './index' to './src/index'
  if (serverContent.includes("require('./index')")) {
    serverContent = serverContent.replace("require('./index')", "require('./src/index')");
    fs.writeFileSync(serverFilePath, serverContent);
    console.log(`✅ Fixed index.js import in server.js`);
  }
}

console.log('\nAll import fixes applied. Try running the server now!') 
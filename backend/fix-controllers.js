const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'src', 'controllers');
const files = fs.readdirSync(controllersDir).filter(file => file.endsWith('.js'));

let fixedCount = 0;

console.log('Scanning controller files for asyncHandler import issues...');

files.forEach(file => {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if there's an incorrect import
  if (content.includes('const asyncHandler = require(\'../utils/asyncHandler\')')) {
    // Replace with correct import
    content = content.replace(
      'const asyncHandler = require(\'../utils/asyncHandler\')',
      'const { asyncHandler } = require(\'../utils/asyncHandler\')'
    );
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed asyncHandler import in ${file}`);
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} controller files.`);
console.log(`No issues found in ${files.length - fixedCount} controller files.`); 
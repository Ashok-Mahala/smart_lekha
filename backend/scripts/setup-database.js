const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 MongoDB Atlas Setup Guide\n');

console.log('Please follow these steps:');
console.log('1. Go to https://www.mongodb.com/cloud/atlas');
console.log('2. Sign up for a free account');
console.log('3. Create a new cluster (choose FREE tier)');
console.log('4. Choose your preferred cloud provider and region');
console.log('5. Click "Create Cluster"\n');

console.log('Once your cluster is created:');
console.log('1. Click "Database Access" in the left sidebar');
console.log('2. Click "Add New Database User"');
console.log('3. Choose "Password" authentication');
console.log('4. Enter a username and password');
console.log('5. For privileges, select "Atlas admin"');
console.log('6. Click "Add User"\n');

console.log('Then configure network access:');
console.log('1. Click "Network Access" in the left sidebar');
console.log('2. Click "Add IP Address"');
console.log('3. Click "Allow Access from Anywhere" (for development)');
console.log('4. Click "Confirm"\n');

console.log('Finally, get your connection string:');
console.log('1. Click "Connect" on your cluster');
console.log('2. Choose "Connect your application"');
console.log('3. Copy the connection string\n');

const questions = [
  {
    question: 'Enter your MongoDB connection string: ',
    key: 'MONGODB_URI'
  },
  {
    question: 'Enter your JWT secret (or press Enter to generate one): ',
    key: 'JWT_SECRET'
  }
];

const answers = {};

function askQuestion(index) {
  if (index === questions.length) {
    // Generate random JWT secret if not provided
    if (!answers.JWT_SECRET) {
      answers.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
    }

    // Create .env file
    const envContent = `MONGODB_URI=${answers.MONGODB_URI}
JWT_SECRET=${answers.JWT_SECRET}
JWT_EXPIRATION=1d
NODE_ENV=development
`;

    fs.writeFileSync(path.join(__dirname, '../../.env'), envContent);

    console.log('\n✅ MongoDB setup completed!');
    console.log('📝 Created .env file with your configuration');
    console.log('\nNext steps:');
    console.log('1. Run: npm run init-db');
    console.log('2. The default admin credentials will be:');
    console.log('   Email: admin@seatflow.com');
    console.log('   Password: admin123');
    console.log('\n⚠️ Make sure to change the default admin password in production!');

    rl.close();
    return;
  }

  rl.question(questions[index].question, (answer) => {
    answers[questions[index].key] = answer;
    askQuestion(index + 1);
  });
}

askQuestion(0); 
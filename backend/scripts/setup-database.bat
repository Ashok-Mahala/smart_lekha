@echo off
echo 🚀 Setting up MongoDB database...

echo 📝 Please follow these steps to set up your MongoDB Atlas database:
echo 1. Go to https://www.mongodb.com/cloud/atlas
echo 2. Sign up for a free account
echo 3. Create a new cluster (choose FREE tier)
echo 4. Choose your preferred cloud provider and region
echo 5. Click "Create Cluster"

echo.
echo 🔐 Once your cluster is created:
echo 1. Click "Database Access" in the left sidebar
echo 2. Click "Add New Database User"
echo 3. Choose "Password" authentication
echo 4. Enter a username and password
echo 5. For privileges, select "Atlas admin"
echo 6. Click "Add User"

echo.
echo 🌐 Then configure network access:
echo 1. Click "Network Access" in the left sidebar
echo 2. Click "Add IP Address"
echo 3. Click "Allow Access from Anywhere" (for development)
echo 4. Click "Confirm"

echo.
echo 🔗 Finally, get your connection string:
echo 1. Click "Connect" on your cluster
echo 2. Choose "Connect your application"
echo 3. Copy the connection string
echo 4. Replace <password> with your database user password
echo 5. Replace <dbname> with "seatflow"

echo.
echo 📝 Create a new file named .env with the following content:
echo MONGODB_URI=your_connection_string
echo JWT_SECRET=your_secret_key
echo JWT_EXPIRATION=1d
echo NODE_ENV=development

echo.
echo ✅ Database setup instructions completed!
echo 📌 Make sure to save your database credentials securely! 
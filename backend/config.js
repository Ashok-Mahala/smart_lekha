// /root/pg_node/smart_lekha/SB2-Library-/backend/config.js
require('dotenv').config();

const config = {
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/seatflow',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
//  jwtExpiration: process.env.JWT_EXPIRES_IN || '1m',
// refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '2m',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '30d',

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,  
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_BUCKET
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  }
};

module.exports = { config }; 
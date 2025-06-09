/**
 * Application Configuration
 * 
 * Loads environment variables based on NODE_ENV and provides a centralized
 * configuration object for the application.
 */

const path = require('path');
const fs = require('fs');

// Determine which .env file to load based on NODE_ENV
const NODE_ENV = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${NODE_ENV}`);

// Load environment-specific .env file if it exists, otherwise fall back to .env
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  require('dotenv').config({ path: envPath });
} else {
  console.log('Environment-specific .env file not found, using default .env');
  require('dotenv').config();
}

// Configuration object with all settings
const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: NODE_ENV,
  
  // MongoDB configuration
  mongoURI: `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DATABASE}?authSource=admin`,
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || (NODE_ENV === 'production' 
    ? 'https://seatflow-frontend.example.com' 
    : 'http://62.72.58.243:5173'),
  
  // File upload configuration
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  
  // Rate limiting configuration
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || (NODE_ENV === 'production' ? 50 : 100),
  
  // Backup and logging configuration
  backupDir: process.env.BACKUP_DIR || 'backups',
  logDir: process.env.LOG_DIR || 'logs',
  
  // Email configuration (if needed)
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@seatflow.com'
  },
  
  // Stripe configuration (if needed)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  }
};

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  
  // Only exit in production; in development/test, we can use defaults
  if (NODE_ENV === 'production') {
    console.error('Cannot start application in production without required environment variables');
    process.exit(1);
  } else {
    console.warn('Using default values for missing environment variables in non-production environment');
  }
}

// Log configuration details (sanitized for sensitive information)
const logConfig = JSON.parse(JSON.stringify(config));
// Sanitize sensitive information
if (logConfig.jwtSecret) logConfig.jwtSecret = '********';
if (logConfig.smtp && logConfig.smtp.pass) logConfig.smtp.pass = '********';
if (logConfig.stripe && logConfig.stripe.secretKey) logConfig.stripe.secretKey = '********';
if (logConfig.stripe && logConfig.stripe.webhookSecret) logConfig.stripe.webhookSecret = '********';

console.log(`Application configuration for ${NODE_ENV} environment:`, logConfig);

module.exports = { config }; 
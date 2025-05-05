const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SeatFlow SB2 Admin API',
      version: '1.0.0',
      description: 'API documentation for SeatFlow SB2 Admin System - A complete solution for library and study space management',
      contact: {
        name: 'SeatFlow Support',
        email: 'support@seatflow.com',
        url: 'https://seatflow.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'API Server'
      },
      {
        url: '{protocol}://{hostname}:{port}',
        description: 'Custom Server',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: 'http'
          },
          hostname: {
            default: 'localhost'
          },
          port: {
            default: '5000'
          }
        }
      }
    ],
    tags: [
      {
        name: 'Students',
        description: 'Student management endpoints'
      },
      {
        name: 'Seats',
        description: 'Seat management endpoints'
      },
      {
        name: 'Shifts',
        description: 'Shift scheduling endpoints'
      },
      {
        name: 'Bookings',
        description: 'Booking management endpoints'
      },
      {
        name: 'Attendance',
        description: 'Attendance tracking endpoints'
      },
      {
        name: 'Payments',
        description: 'Payment processing endpoints'
      },
      {
        name: 'Reports',
        description: 'Reporting and analytics endpoints'
      },
      {
        name: 'Files',
        description: 'File upload and management endpoints'
      },
      {
        name: 'Users',
        description: 'User authentication and management'
      },
      {
        name: 'Operations',
        description: 'Administrative operations'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      // Moved schemas to their respective YAML files
    }
  },
  apis: [
    path.join(__dirname, '../docs/*.yaml'),
    path.join(__dirname, '../routes/*.js')
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs; 
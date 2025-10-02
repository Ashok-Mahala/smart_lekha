# Seatflow SB2 Admin API Documentation

This directory contains the Swagger/OpenAPI documentation for the Seatflow SB2 Admin API.

## Overview

The API documentation is organized into multiple YAML files, each focusing on a specific resource or feature of the API. This modular approach makes the documentation easier to maintain and update.

## Documentation Files

- `student.yaml` - Student resource API endpoints
- `attendance.yaml` - Attendance management endpoints
- `booking.yaml` - Booking management endpoints
- `seat.yaml` - Seat resource endpoints
- `shifts.yaml` - Shift scheduling endpoints
- `payment.yaml` - Payment processing endpoints
- `operation.yaml` - Administrative operations endpoints
- `report.yaml` - Reporting endpoints
- `files.yaml` - File upload and management endpoints
- `errors.yaml` - Common error responses and schemas
- `user.yaml` - User management endpoints

## How to Access the Documentation

The Swagger documentation is available at `/smlekha-docs` when the server is running. For example:

- Development: `http://172.20.10.3:5000/smlekha-docs`
- Production: `https://yourdomain.com/smlekha-docs`

## Authentication

Most API endpoints require authentication. The API uses JWT (JSON Web Token) for authentication. To authenticate:

1. Obtain a token by sending a POST request to `/smlekha/auth/login` with your credentials.
2. Include the token in the Authorization header of subsequent requests: `Authorization: bearer YOUR_TOKEN`

## Common Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": [ ... ]
  }
}
```

## Adding New Documentation

When adding new endpoints or resources:

1. Create a new YAML file or modify an existing one
2. Follow the OpenAPI 3.0 specification
3. Reference common schemas from existing files when appropriate
4. Make sure to document all parameters, request bodies, and responses
5. Include authentication requirements where applicable

## Testing the Documentation

After making changes to the documentation, you can validate it by:

1. Starting the server
2. Accessing the Swagger UI at `/smlekha-docs`
3. Testing the documented endpoints directly through the UI

## Best Practices

- Keep the documentation up-to-date with code changes
- Document all possible response codes
- Include examples where helpful
- Use consistent naming conventions
- Reference common schemas instead of duplicating them 
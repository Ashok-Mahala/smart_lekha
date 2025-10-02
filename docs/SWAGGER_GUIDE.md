# Swagger Documentation Guide

This guide explains how to use the Swagger/OpenAPI documentation for the Seatflow SB2 Admin API.

## Accessing the Documentation

The Swagger documentation provides an interactive UI to explore, understand, and test the API. To access it:

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://10.242.95.105:5000/smlekha-docs
   ```

## Using the Swagger UI

### Overview

The Swagger UI is divided into several sections:

1. **API Information**: Located at the top, providing basic information about the API.
2. **API Endpoints**: Grouped by tags (Students, Seats, Shifts, etc.).
3. **Models**: Schema definitions for request and response objects.

### Exploring Endpoints

1. Click on a tag (e.g., "Students") to expand and see all endpoints related to that resource.
2. Each endpoint is color-coded by HTTP method:
   - GET: Blue
   - POST: Green
   - PUT: Orange
   - DELETE: Red

3. Click on an endpoint to expand it and see detailed information:
   - Description
   - Parameters
   - Request body schema
   - Response formats
   - Example responses

### Testing Endpoints

You can test endpoints directly from the Swagger UI:

1. Expand the endpoint you want to test.
2. Fill in the required parameters and request body.
3. Click "Execute" to send the request.
4. The response will be displayed below with status code, headers, and body.

### Authentication

For endpoints that require authentication:

1. Click the "Authorize" button at the top of the page.
2. Enter your JWT token in the format: `bearer your-token-here`
3. Click "Authorize" and close the modal.
4. All subsequent requests will include this token.

## Understanding Schemas

The "Schemas" section at the bottom of the page describes the data models used across the API:

- Click a schema to expand and see all properties.
- Required properties are marked with an asterisk (*).
- Each property shows its type, format, and description.

## Common Parameters

Many endpoints support common query parameters:

- `page`: Page number for pagination (default: 1)
- `limit`: Number of items per page (default: 10, max: 100)
- `search`: Text search across relevant fields
- `sort`: Field to sort by (prefix with "-" for descending order)
- `status`: Filter items by status

## Error Responses

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "affected_field",
        "message": "Field-specific error message"
      }
    ]
  }
}
```

Common error codes:

- `BAD_REQUEST`: Invalid parameters or request body
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Input validation failed
- `CONFLICT`: Operation conflicts with existing state
- `SERVER_ERROR`: Internal server error

## Development Tips

### Adding New Endpoints

When developing new API endpoints:

1. Document them in the appropriate YAML file in `backend/src/docs/`.
2. Follow the existing patterns for consistency.
3. Use references (`$ref`) to common schemas where appropriate.
4. Include examples for request and response.
5. Document all possible response codes.

### Validating Documentation

After making changes to the documentation:

1. Start the server and check the Swagger UI.
2. Verify that your new endpoints appear and are correctly documented.
3. Test the endpoints through the UI to ensure the documentation matches the implementation.

## Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [Swagger Editor](https://editor.swagger.io/) - Useful for validating YAML files 
# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Health Check Endpoints

### GET /health
Health check endpoint - returns server status and system metrics.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-26T12:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "0.0.0",
  "memory": { ... },
  "cpu": { ... }
}
```

### GET /ready
Readiness check endpoint - indicates if server is ready to accept requests.

**Response:**
```json
{
  "status": "ready",
  "timestamp": "2026-10-26T12:00:00.000Z"
}
```

## Metrics Endpoint

### GET /metrics
Prometheus metrics endpoint for monitoring.

**Response:** Prometheus metrics format (text/plain)

## Identity Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "status": "ACTIVE"
  }
}
```

### POST /auth/login
Login with email and password. Optionally include tenantId for tenant-scoped token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "tenantId": "uuid" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "sessionId": "uuid",
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "tenantId": "uuid" // optional
  }
}
```

### POST /auth/logout
Logout and invalidate session.

**Request Body:**
```json
{
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

## Tenant Endpoints

### POST /tenants
Create a new tenant (company/organization).

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "ownerUserId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tenantId": "uuid",
    "name": "Acme Corporation",
    "status": "ACTIVE"
  }
}
```

### POST /memberships
Add a user to a tenant with a specific role.

**Request Body:**
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "role": "ADMIN" // or "MEMBER", "GUEST"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "membershipId": "uuid",
    "userId": "uuid",
    "tenantId": "uuid",
    "role": "ADMIN"
  }
}
```

### GET /users/:userId/memberships
List all tenant memberships for a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "memberships": [
      {
        "membershipId": "uuid",
        "tenantId": "uuid",
        "role": "ADMIN",
        "isActive": true,
        "joinedAt": "2026-10-26T12:00:00.000Z"
      }
    ]
  }
}
```

### POST /tenants/switch
Validate and prepare for tenant switching.

**Request Body:**
```json
{
  "userId": "uuid",
  "tenantId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "tenantId": "uuid",
    "role": "ADMIN",
    "isActive": true
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Invalid input (400)
- `NOT_FOUND_ERROR` - Resource not found (404)
- `UNAUTHORIZED_ERROR` - Authentication required (401)
- `FORBIDDEN_ERROR` - Permission denied (403)
- `CONFLICT_ERROR` - Resource conflict (409)
- `INTERNAL_ERROR` - Server error (500)

## Feature Flags

The following endpoints are controlled by environment variables:

- `USE_IDENTITY=true` - Enables Identity endpoints
- `USE_TENANT=true` - Enables Tenant endpoints
- `USE_AUTHORIZATION=true` - Enables Authorization endpoints

## Authentication

Most endpoints require JWT authentication via `Authorization: Bearer <token>` header.

JWT tokens include:
- `userId` - User ID
- `tenantId` - Tenant ID (optional, for tenant-scoped operations)

## Rate Limiting

API requests are rate-limited to prevent abuse.

Default limits:
- 100 requests per 15 minutes per IP

## Security

- All passwords are hashed using bcrypt
- JWT tokens expire after 15 minutes (access) or 7 days (refresh)
- Input validation using Zod schemas
- Security headers via Helmet
- CORS configured

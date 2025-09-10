# CampSpot Backend API Documentation

## 📋 **Overview**
The CampSpot Backend API provides authentication, user management, and camping-related services for the CampSpot platform.

**Base URL**: `http://localhost:5000/api`  
**Authentication**: Bearer Token (JWT)  
**Content-Type**: `application/json`

---

## 🔧 **Server Information**

### Health Check
**GET** `/api/health`

Check if the API server is running and healthy.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-08-30T01:24:31.000Z",
  "mongodb": "connected",
  "port": 5000,
  "environment": "development"
}
```

---

## 🔐 **Authentication Endpoints**

### 1. User Registration
**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `name`: Required, string
- `email`: Required, valid email format, must be unique
- `password`: Required, minimum 6 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "user-1234567890",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "",
    "role": "user",
    "preferences": {
      "notifications": true,
      "location": false
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
```json
// Missing fields (400)
{
  "success": false,
  "error": "Name, email, and password are required"
}

// Password too short (400)
{
  "success": false,
  "error": "Password must be at least 6 characters long"
}

// Email already exists (400)
{
  "success": false,
  "error": "An account with this email already exists"
}
```

---

### 2. User Login
**POST** `/api/auth/login`

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user-1234567890",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "role": "user",
    "preferences": {
      "notifications": true,
      "location": false
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
```json
// Missing credentials (400)
{
  "success": false,
  "error": "Email and password are required"
}

// Invalid credentials (401)
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Demo Note:** For testing purposes, any password will work with the pre-loaded test accounts.

---

### 3. Get User Profile
**GET** `/api/auth/profile`

Get the current user's profile information.

**Headers Required:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "_id": "user-1234567890",
  "email": "john@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "user",
  "preferences": {
    "notifications": true,
    "location": false
  },
  "createdAt": "2025-08-30T01:24:31.000Z"
}
```

**Error Responses:**
```json
// No token (401)
{
  "error": "Access denied. No token provided."
}

// Invalid token (401)
{
  "error": "Invalid token"
}

// User not found (404)
{
  "error": "User not found"
}
```

---

### 4. Update User Profile
**PATCH** `/api/auth/profile`

Update the current user's profile information.

**Headers Required:**
```
Authorization: Bearer {token}
```

**Request Body (partial updates allowed):**
```json
{
  "name": "John Smith",
  "phone": "+1987654321",
  "preferences": {
    "notifications": false,
    "location": true
  }
}
```

**Allowed Fields:**
- `name`: string
- `phone`: string
- `preferences`: object with `notifications` and `location` booleans

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "user-1234567890",
    "email": "john@example.com",
    "name": "John Smith",
    "phone": "+1987654321",
    "role": "user",
    "preferences": {
      "notifications": false,
      "location": true
    }
  }
}
```

---

## 🏕️ **Camping & Booking Endpoints**

### 5. Get Campsites
**GET** `/api/campsites`

Retrieve list of available campsites.

**Success Response (200):**
```json
{
  "success": true,
  "campsites": [],
  "message": "Campsites endpoint working"
}
```

---

### 6. Get Activities  
**GET** `/api/activities`

Retrieve list of available activities.

**Success Response (200):**
```json
{
  "success": true,
  "activities": [],
  "message": "Activities endpoint working"
}
```

---

### 7. Get Equipment
**GET** `/api/equipment`

Retrieve list of available equipment for rent.

**Success Response (200):**
```json
{
  "success": true,
  "equipment": [],
  "message": "Equipment endpoint working"
}
```

---

### 8. Get User Bookings
**GET** `/api/bookings`

Get all bookings for the authenticated user.

**Headers Required:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "bookings": [],
  "message": "Bookings endpoint working"
}
```

---

## 🧪 **Test Accounts**

### Pre-loaded Test Users:

#### Regular User:
```
📧 Email: user@test.com
🔑 Password: (any password works for demo)
👤 Name: Demo User  
🎭 Role: user
```

#### Admin User:
```
📧 Email: admin@campspot.com
🔑 Password: (any password works for demo)
👤 Name: Admin User
🎭 Role: admin
```

---

## 🔑 **Authentication Flow**

### 1. Login/Register Process:
```
1. POST /api/auth/login OR /api/auth/register
2. Receive JWT token in response
3. Store token in localStorage/sessionStorage
4. Include token in Authorization header for protected routes
```

### 2. Protected Route Access:
```
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

### 3. Token Structure:
```json
{
  "userId": "user-1234567890",
  "email": "user@example.com", 
  "role": "user",
  "iat": 1640995200,
  "exp": 1641081600
}
```

---

## 📝 **Request Examples**

### Using cURL:

#### Register New User:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Get Profile:
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Update Profile:
```bash
curl -X PATCH http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "phone": "+1234567890"
  }'
```

---

### Using JavaScript Fetch:

#### Login Example:
```javascript
const loginUser = async (email, password) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store token
      localStorage.setItem('token', data.token);
      console.log('Login successful:', data.user);
    } else {
      console.error('Login failed:', data.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

#### Authenticated Request Example:
```javascript
const getUserProfile = async () => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const profile = await response.json();
    console.log('User profile:', profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
  }
};
```

---

## ⚠️ **Error Handling**

### HTTP Status Codes:
- **200**: Success
- **201**: Created (registration)
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid credentials/token)
- **404**: Not Found (user/resource not found)
- **500**: Internal Server Error

### Common Error Response Format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Authentication Errors:
```json
// Missing token
{
  "error": "Access denied. No token provided."
}

// Invalid token
{
  "error": "Invalid token"
}

// Expired token
{
  "error": "Token expired"
}
```

---

## 🛠️ **Server Configuration**

### CORS Settings:
```javascript
origin: [
  'http://localhost:3000',
  'http://localhost:5173', 
  'http://localhost:5174'
],
credentials: true
```

### JWT Configuration:
- **Secret**: Environment variable or fallback
- **Expiration**: 24 hours
- **Algorithm**: HS256

### Supported Methods:
- GET, POST, PUT, PATCH, DELETE, OPTIONS

---

## 🧪 **Testing Guide**

### 1. Using PowerShell (Windows):
```powershell
# Test login
$body = @{
    email = "user@test.com"
    password = "test123"
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
```

### 2. Using Browser Developer Console:
```javascript
// Test login from browser console
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@test.com',
    password: 'test123'
  })
})
.then(r => r.json())
.then(data => console.log(data));
```

### 3. Using Frontend Application:
Simply use the login form at http://localhost:5173

---

## 📊 **Database Schema**

### User Model:
```javascript
{
  id: String,           // Unique identifier
  _id: String,          // MongoDB ObjectId
  name: String,         // User's full name
  email: String,        // Email (unique)
  password: String,     // Hashed password
  role: String,         // 'user' or 'admin'
  phone: String,        // Phone number (optional)
  preferences: {
    notifications: Boolean,  // Email notifications
    location: Boolean       // Location services
  },
  createdAt: Date,      // Registration timestamp
  lastLogin: Date       // Last login timestamp
}
```

---

## 🚀 **Quick Start**

### 1. Start the Server:
```bash
cd backend
node stable-server.js
```

### 2. Test Health:
```bash
curl http://localhost:5000/api/health
```

### 3. Register a User:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### 4. Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 🔒 **Security Features**

### Password Security:
- ✅ Passwords hashed with bcrypt (salt rounds: 10)
- ✅ Plain text passwords never stored
- ✅ Password validation on registration

### JWT Token Security:
- ✅ Tokens expire after 24 hours
- ✅ Tokens include user role for authorization
- ✅ Secret key used for signing
- ✅ Token validation on protected routes

### CORS Security:
- ✅ Restricted to specific frontend origins
- ✅ Credentials allowed for authenticated requests
- ✅ Proper headers configuration

---

## 📱 **Frontend Integration**

### ApiService Usage:
```javascript
import apiService from '../services/apiService';

// Login
const response = await apiService.login(email, password);

// Register  
const response = await apiService.register(name, email, password);

// Get profile
const profile = await apiService.getCurrentUser();

// Update profile
const response = await apiService.updateProfile(updates);
```

### Token Management:
- Tokens automatically stored in `localStorage`
- Tokens automatically included in API requests
- Tokens cleared on logout

---

## 🐛 **Troubleshooting**

### Common Issues:

#### "Failed to fetch" Error:
```
Cause: Backend server not running or CORS issues
Solution: 
1. Check if backend is running on port 5000
2. Verify CORS allows frontend origin
3. Check network connectivity
```

#### "Invalid token" Error:
```
Cause: Token expired or malformed
Solution:
1. Re-login to get new token
2. Check token format in request headers
3. Verify JWT secret matches
```

#### "Cannot GET /api/auth/" Error:
```
Cause: Accessing auth route with GET method directly
Solution: Use proper endpoints:
- POST /api/auth/login
- POST /api/auth/register  
- GET /api/auth/profile
```

### Debug Mode:
The server logs all requests in the console:
```
📝 2025-08-30T01:24:31.000Z - POST /api/auth/login
   Body: { "email": "user@test.com", "password": "***" }
🔐 Processing login request...
✅ Login successful: user@test.com (user)
```

---

## 🌐 **Environment Configuration**

### Required Environment Variables:
```bash
PORT=5000                    # Server port
JWT_SECRET=your-secret-key   # JWT signing secret
MONGODB_URI=mongodb://...    # MongoDB connection string
```

### Default Values (if env not set):
- Port: 5000
- JWT Secret: 'campspot-secret-key-2024'
- MongoDB: Mock in-memory database

---

## 📋 **API Endpoint Summary**

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/health` | ❌ | Server health check |
| GET | `/` | ❌ | API information |
| POST | `/api/auth/register` | ❌ | Create new account |
| POST | `/api/auth/login` | ❌ | User authentication |
| GET | `/api/auth/profile` | ✅ | Get user profile |
| PATCH | `/api/auth/profile` | ✅ | Update user profile |
| GET | `/api/campsites` | ❌ | List campsites |
| GET | `/api/activities` | ❌ | List activities |
| GET | `/api/equipment` | ❌ | List equipment |
| GET | `/api/bookings` | ✅ | User bookings |

---

## 📞 **Support**

### Server Status:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173
- **Swagger Docs**: *Coming soon*

### Test Credentials:
- **User**: user@test.com / (any password)
- **Admin**: admin@campspot.com / (any password)

---

## 🎯 **Next Steps**

### Future Enhancements:
1. **Complete Booking System**: Full CRUD operations
2. **File Upload**: Image handling for profiles/listings
3. **Advanced Search**: Filtering and sorting
4. **Payment Integration**: Stripe/PayPal support
5. **Real-time Features**: Socket.io notifications
6. **Email Services**: Welcome emails, confirmations
7. **Admin Dashboard**: User management, analytics

---

*Last Updated: August 30, 2025*  
*Version: 1.0.0*  
*Status: ✅ Fully Operational*
# 🚀 CampSpot API - Quick Reference

## 📍 **Server URLs**
- **Backend API**: http://localhost:5000
- **Frontend App**: http://localhost:5173 or http://localhost:5174

---

## 🔥 **Quick Test Commands**

### PowerShell Testing:

#### 1. Health Check:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health"
```

#### 2. Register New User:
```powershell
$user = @{
    name = "Test User"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $user -ContentType "application/json"
```

#### 3. Login:
```powershell
$login = @{
    email = "user@test.com"
    password = "anything"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $login -ContentType "application/json"
```

---

## 🧪 **Test Accounts**

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| `user@test.com` | Any password | user | Pre-loaded demo user |
| `admin@campspot.com` | Any password | admin | Pre-loaded admin user |
| `newuser@test.com` | `password123` | user | Already tested working |

---

## 🎯 **Key Endpoints**

| Method | URL | Purpose | Auth |
|--------|-----|---------|------|
| GET | `/api/health` | Server status | ❌ |
| POST | `/api/auth/login` | User login | ❌ |
| POST | `/api/auth/register` | Create account | ❌ |
| GET | `/api/auth/profile` | Get user data | ✅ |
| PATCH | `/api/auth/profile` | Update profile | ✅ |

---

## 🔐 **Authentication Headers**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## ⚡ **Start Servers**

### Backend:
```bash
cd backend
node stable-server.js
```

### Frontend:
```bash
cd frontend  
npm run dev
```

---

## 🎮 **Frontend App Access**
**Go to**: http://localhost:5173

**NOT**: http://localhost:5000 (that's just the API)

---

*Quick Reference v1.0 - August 30, 2025*

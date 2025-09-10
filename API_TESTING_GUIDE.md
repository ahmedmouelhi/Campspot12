# 🧪 CampSpot API Testing Guide

## 🎯 Live API Documentation & Testing

**🔗 Swagger UI**: https://campspot-production.up.railway.app/api-docs

## ⚡ Quick API Tests

### 1. Health Check (No Auth Required)
```bash
GET https://campspot-production.up.railway.app/api/health
```
**Expected Response**: `200 OK` with system health information

### 2. Get Camping Sites (Public)
```bash
GET https://campspot-production.up.railway.app/api/camping-sites
```
**Expected Response**: Array of camping sites

### 3. Get Activities (Public)
```bash
GET https://campspot-production.up.railway.app/api/activities  
```
**Expected Response**: Array of available activities

### 4. Get Equipment (Public)
```bash  
GET https://campspot-production.up.railway.app/api/equipment
```
**Expected Response**: Array of available equipment

## 🔐 Authentication Testing

### Step 1: Register a New User
```bash
POST https://campspot-production.up.railway.app/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com", 
  "password": "password123"
}
```

### Step 2: Login to Get JWT Token
```bash
POST https://campspot-production.up.railway.app/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123" 
}
```
**Save the `token` from response for authenticated requests**

### Step 3: Test Protected Endpoints
Use the token in Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

## 📋 Complete API Endpoints

### 🏕️ **Camping Sites**
- `GET /api/camping-sites` - Get all sites
- `GET /api/camping-sites/:id` - Get specific site  
- `GET /api/camping-sites/search` - Search sites
- `POST /api/camping-sites` - Create site (Admin)
- `PUT /api/camping-sites/:id` - Update site (Admin)
- `DELETE /api/camping-sites/:id` - Delete site (Admin)

### 👤 **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (Auth required)
- `PUT /api/auth/profile` - Update profile (Auth required)

### 📅 **Bookings**
- `GET /api/bookings` - Get user bookings (Auth required)
- `POST /api/bookings` - Create booking (Auth required)
- `GET /api/bookings/:id` - Get booking details (Auth required)
- `PUT /api/bookings/:id` - Update booking (Auth required)
- `DELETE /api/bookings/:id` - Cancel booking (Auth required)

### 🚴 **Activities**
- `GET /api/activities` - Get all activities
- `GET /api/activities/:id` - Get specific activity
- `POST /api/activities` - Create activity (Admin)
- `PUT /api/activities/:id` - Update activity (Admin)
- `DELETE /api/activities/:id` - Delete activity (Admin)

### 🎒 **Equipment** 
- `GET /api/equipment` - Get all equipment
- `GET /api/equipment/:id` - Get specific equipment
- `POST /api/equipment` - Create equipment (Admin)
- `PUT /api/equipment/:id` - Update equipment (Admin)
- `DELETE /api/equipment/:id` - Delete equipment (Admin)

### 🛒 **Shopping Cart**
- `GET /api/cart` - Get cart items (Auth required)
- `POST /api/cart/add` - Add item to cart (Auth required)
- `PUT /api/cart/update/:id` - Update cart item (Auth required)
- `DELETE /api/cart/remove/:id` - Remove from cart (Auth required)
- `POST /api/cart/checkout` - Checkout cart (Auth required)

### 📝 **Blog**
- `GET /api/blog` - Get all blog posts
- `GET /api/blog/:id` - Get specific blog post
- `POST /api/blog` - Create blog post (Admin)
- `PUT /api/blog/:id` - Update blog post (Admin)
- `DELETE /api/blog/:id` - Delete blog post (Admin)

### 📊 **Admin**
- `GET /api/admin/dashboard` - Admin dashboard stats (Admin)
- `GET /api/admin/users` - Get all users (Admin)
- `PUT /api/admin/users/:id` - Update user (Admin)
- `DELETE /api/admin/users/:id` - Delete user (Admin)

### 🔔 **Notifications**
- `GET /api/notifications` - Get notifications (Auth required)
- `POST /api/notifications` - Create notification (Admin)
- `PUT /api/notifications/:id/read` - Mark as read (Auth required)

## 🧪 Using Swagger UI for Testing

### **Step 1**: Visit Swagger Interface
Go to: https://campspot-production.up.railway.app/api-docs

### **Step 2**: Select Server
- Choose "Production server" from the dropdown
- This ensures all requests go to the live API

### **Step 3**: Test Public Endpoints
- Click on any endpoint (e.g., `GET /api/health`)
- Click "Try it out"
- Click "Execute" 
- View the response

### **Step 4**: Test Authentication
1. Go to `POST /api/auth/register` or `POST /api/auth/login`
2. Click "Try it out"
3. Enter your credentials in the request body
4. Click "Execute"
5. Copy the JWT token from the response

### **Step 5**: Authorize for Protected Endpoints  
1. Click the "Authorize" button at the top
2. Enter: `Bearer YOUR_JWT_TOKEN_HERE`
3. Click "Authorize"
4. Now you can test protected endpoints

### **Step 6**: Test All Endpoints
- Try different endpoints with various parameters
- Test error scenarios (invalid data, unauthorized access)
- Verify response formats and status codes

## ✅ API Testing Checklist

### Public Endpoints ✓
- [ ] Health check returns 200 OK
- [ ] Camping sites list loads
- [ ] Activities list loads  
- [ ] Equipment list loads
- [ ] Blog posts load
- [ ] Individual resource endpoints work

### Authentication ✓
- [ ] User registration works
- [ ] User login returns JWT token
- [ ] Profile retrieval with token works
- [ ] Invalid credentials rejected
- [ ] Expired/invalid tokens rejected

### Protected Endpoints ✓
- [ ] Bookings CRUD operations
- [ ] Cart operations
- [ ] Profile updates
- [ ] Admin endpoints (with admin user)
- [ ] Notifications

### Error Handling ✓
- [ ] 404 for non-existent resources
- [ ] 401 for unauthorized requests  
- [ ] 400 for invalid data
- [ ] 500 errors handled gracefully

### Performance ✓
- [ ] Response times under 2 seconds
- [ ] Pagination works for large datasets
- [ ] Search functionality works
- [ ] Rate limiting active

## 🎯 Sample Test Data

### User Registration
```json
{
  "name": "John Camper",
  "email": "john@example.com",
  "password": "securepass123"
}
```

### Booking Creation
```json
{
  "campingSiteId": "site_id_here",
  "checkInDate": "2024-07-15",
  "checkOutDate": "2024-07-20", 
  "guests": 4,
  "totalPrice": 250.00
}
```

### Equipment Addition
```json
{
  "name": "2-Person Tent",
  "description": "Lightweight camping tent", 
  "pricePerDay": 15.99,
  "category": "shelter",
  "availability": true
}
```

## 🚀 **Your Live API is Ready!**

**Main API URL**: https://campspot-production.up.railway.app
**Documentation**: https://campspot-production.up.railway.app/api-docs
**Health Check**: https://campspot-production.up.railway.app/api/health

**Test away and enjoy your fully functional CampSpot API! 🏕️✨**

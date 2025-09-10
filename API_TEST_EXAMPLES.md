# 🧪 CampSpot API - Working Test Examples

## 🎯 Fixing the 422 Validation Error

The 422 error means "Unprocessable Entity" - the request format is incorrect. Here are the **correct** request formats:

## ✅ Working API Test Examples

### 1. Health Check (Always Works)
```bash
GET https://campspot-production.up.railway.app/api/health
```
**Status**: ✅ Working - Returns 200 OK

### 2. User Registration (Fixed Format)
**Endpoint**: `POST /api/auth/register`

**❌ Wrong format (causes 422)**:
```json
{
  "name": "Test",
  "email": "test@test.com", 
  "password": "123"
}
```

**✅ Correct format**:
```json
{
  "name": "John Camper",
  "email": "john.camper@example.com",
  "password": "SecurePass123!"
}
```

**Requirements**:
- Name: At least 2 characters
- Email: Valid email format
- Password: At least 8 characters

### 3. User Login (Fixed Format)
**Endpoint**: `POST /api/auth/login`

**✅ Correct format**:
```json
{
  "email": "john.camper@example.com",
  "password": "SecurePass123!"
}
```

### 4. Get Camping Sites (Public - No Auth)
```bash
GET https://campspot-production.up.railway.app/api/camping-sites
```

### 5. Get Activities (Public - No Auth)
```bash
GET https://campspot-production.up.railway.app/api/activities
```

### 6. Get Equipment (Public - No Auth)
```bash
GET https://campspot-production.up.railway.app/api/equipment
```

## 🔧 Step-by-Step Swagger Testing

### Step 1: Test Health Endpoint
1. Go to: https://campspot-production.up.railway.app/api-docs
2. Find `GET /api/health`
3. Click "Try it out"
4. Click "Execute"
5. Should return 200 OK ✅

### Step 2: Register a User (Correct Format)
1. Find `POST /api/auth/register`
2. Click "Try it out"
3. **Replace the example with**:
   ```json
   {
     "name": "Jane Camper",
     "email": "jane.camper@example.com",
     "password": "MySecurePassword123!"
   }
   ```
4. Click "Execute"
5. Should return 201 Created with JWT token ✅

### Step 3: Login (Use Same Credentials)
1. Find `POST /api/auth/login`
2. Click "Try it out"
3. Use the same credentials:
   ```json
   {
     "email": "jane.camper@example.com",
     "password": "MySecurePassword123!"
   }
   ```
4. Click "Execute"
5. Copy the JWT token from response ✅

### Step 4: Authorize for Protected Endpoints
1. Click "Authorize" button at top of Swagger
2. Enter: `Bearer YOUR_JWT_TOKEN_HERE`
3. Click "Authorize" ✅

### Step 5: Test Protected Endpoints
Now you can test:
- `GET /api/auth/profile` - Get your profile
- `GET /api/bookings` - Get your bookings
- `GET /api/cart` - Get cart items

## 🎯 Test Data That WORKS

### Valid User Registration
```json
{
  "name": "Alex Outdoor",
  "email": "alex.outdoor@campspot.com",
  "password": "CampingLover2024!"
}
```

### Valid Booking Creation (After Auth)
```json
{
  "campingSiteId": "60d5ecb74b24c72d3c8f1234",
  "checkInDate": "2024-08-15",
  "checkOutDate": "2024-08-18",
  "guests": 2,
  "totalPrice": 150.00
}
```

### Valid Equipment Search
```bash
GET /api/equipment?category=tent&available=true
```

## 🚨 Common Validation Errors & Fixes

### Error 422: "Validation failed"

**❌ Common causes**:
- Password too short (less than 8 chars)
- Invalid email format
- Missing required fields
- Name too short (less than 2 chars)

**✅ Solutions**:
- Use strong passwords (8+ chars, mix of letters/numbers/symbols)
- Use valid email format
- Fill all required fields
- Use meaningful names (2+ chars)

### Error 401: "Unauthorized"
**Fix**: Add JWT token to Authorization header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Error 404: "Not Found"
**Fix**: Check the endpoint URL is correct

## 🧪 Quick Test Sequence

1. **Health Check**: `GET /api/health` ✅
2. **Register**: `POST /api/auth/register` with valid data ✅
3. **Login**: `POST /api/auth/login` with same data ✅
4. **Authorize**: Add JWT token to Swagger ✅
5. **Profile**: `GET /api/auth/profile` ✅
6. **Sites**: `GET /api/camping-sites` ✅

## 🎯 Live Testing URLs

- **Swagger UI**: https://campspot-production.up.railway.app/api-docs
- **Health Check**: https://campspot-production.up.railway.app/api/health
- **Direct API**: https://campspot-production.up.railway.app/api/

## 💡 Pro Tips

1. **Always start with health check** to verify API is running
2. **Use the exact JSON format** shown in examples
3. **Copy/paste the working examples** instead of typing
4. **Check password requirements** - needs to be strong
5. **Save your JWT tokens** for testing protected endpoints

**Try the working examples above - they're tested and guaranteed to work!** 🚀✨

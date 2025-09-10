# 🛠️ Railway Deployment Fix Instructions

## Issue Identified
The Railway CLI environment variables got corrupted, causing Docker build failures.

## Manual Fix Required

### Step 1: Access Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Sign in to your account
3. Open your project `gregarious-wonder`

### Step 2: Fix Backend Service
1. Click on `camping-backend` service
2. Go to **Variables** tab
3. **DELETE** these corrupted variables:
   - `.ONGODB_URI`
   - `.ORS_ORIGINS` 
   - Any variable with malformed names

4. **ADD** these correct variables:
   ```
   MONGODB_URI=mongodb+srv://ahmed:15963@cluster0.6ookgvr.mongodb.net/camping-app?retryWrites=true&w=majority&appName=Cluster0
   CORS_ORIGINS=https://camping-frontend-production.up.railway.app
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=b-86R9KOZbbWiCf9xd-9rIps-aCaqohz
   ```

5. **Click "Deploy" button** to redeploy with fixed variables

### Step 3: Fix Frontend Service
1. Click on `camping-frontend` service  
2. Go to **Variables** tab
3. **DELETE** these corrupted variables:
   - `.ITE_API_BASE_URL`
   - `.ITE_APP_NAME`
   - `.ITE_ENVIRONMENT`
   - Any variable with malformed names

4. **ADD** these correct variables:
   ```
   VITE_API_BASE_URL=https://camping-backend-production-8e38.up.railway.app/api
   VITE_APP_NAME=CampSpot
   VITE_ENVIRONMENT=production
   ```

5. **Click "Deploy" button** to redeploy with fixed variables

### Step 4: Verify URLs
After both deployments complete (5-10 minutes):

**Backend API**: https://camping-backend-production-8e38.up.railway.app/api/health
**Frontend App**: https://camping-frontend-production.up.railway.app

### Step 5: Test Connection
1. Open frontend URL in browser
2. Check browser console for any API connection errors
3. Test basic functionality like viewing camping sites

## Alternative: CLI Fix (if above doesn't work)

If the manual dashboard fix doesn't work, try this CLI approach:

```powershell
# Delete corrupted variables
railway service camping-backend
railway variables --unset .ONGODB_URI
railway variables --unset .ORS_ORIGINS

# Set correct variables
railway variables --set "MONGODB_URI=mongodb+srv://ahmed:15963@cluster0.6ookgvr.mongodb.net/camping-app?retryWrites=true&w=majority&appName=Cluster0"
railway variables --set "CORS_ORIGINS=https://camping-frontend-production.up.railway.app"

# Switch to frontend
railway service camping-frontend
railway variables --unset .ITE_API_BASE_URL
railway variables --unset .ITE_APP_NAME  
railway variables --unset .ITE_ENVIRONMENT

# Set correct variables
railway variables --set "VITE_API_BASE_URL=https://camping-backend-production-8e38.up.railway.app/api"
railway variables --set "VITE_APP_NAME=CampSpot"
railway variables --set "VITE_ENVIRONMENT=production"
```

## Expected Results
- ✅ Backend health check returns 200 status
- ✅ Frontend loads without console errors  
- ✅ Frontend can communicate with backend API
- ✅ Database connection works
- ✅ Authentication system functional

## Troubleshooting
If services still fail:
1. Check Railway build logs in dashboard
2. Verify GitHub repository has latest code
3. Ensure MongoDB Atlas allows Railway IP addresses
4. Check service domains are correctly generated

---
**Once fixed, both services should be fully functional!** 🎉

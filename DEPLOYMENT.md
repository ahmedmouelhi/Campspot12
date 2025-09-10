# 🏕️ CampSpot Deployment Guide

## Overview
This guide covers various deployment options for the CampSpot camping application.

## Prerequisites
- Node.js 18+ installed
- Docker and Docker Compose (for containerized deployment)
- MongoDB database (local or cloud)
- Git repository access

## Quick Start (Local Docker)

1. **Clone and setup**:
   ```bash
   git clone <your-repo>
   cd camping11-app
   cp .env.production .env
   ```

2. **Update environment variables** in `.env`:
   - Set your MongoDB connection string
   - Update CORS origins with your domain
   - Generate a secure JWT secret

3. **Deploy with Docker**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Access your application**:
   - Frontend: http://localhost
   - API: http://localhost:5000/api
   - API Docs: http://localhost/api-docs

## Cloud Deployment Options

### 1. Railway (Recommended for beginners)

1. **Setup**:
   - Sign up at [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Deploy both frontend and backend as separate services

2. **Environment Variables** (set in Railway dashboard):
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   CORS_ORIGINS=https://your-frontend-url.railway.app
   ```

3. **Database**:
   - Add MongoDB service in Railway
   - Or use MongoDB Atlas (recommended)

### 2. Render

1. **Setup**:
   - Sign up at [render.com](https://render.com)
   - Connect your GitHub repository
   - Use the included `render.yaml` for configuration

2. **Deploy**:
   - Backend will auto-deploy as a web service
   - Frontend will auto-deploy as a static site
   - Database will be created automatically

### 3. Vercel + Railway (Frontend + Backend)

1. **Frontend on Vercel**:
   - Deploy frontend to Vercel
   - Set build command: `npm run build`
   - Set output directory: `dist`

2. **Backend on Railway**:
   - Deploy backend to Railway
   - Set environment variables
   - Update frontend to point to Railway backend URL

### 4. Heroku

1. **Preparation**:
   ```bash
   # Install Heroku CLI
   npm install -g heroku
   
   # Login to Heroku
   heroku login
   ```

2. **Deploy Backend**:
   ```bash
   cd backend
   heroku create camping-backend
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   git subtree push --prefix backend heroku main
   ```

3. **Deploy Frontend**:
   ```bash
   cd frontend
   heroku create camping-frontend
   heroku buildpacks:set heroku/nodejs
   # Update API URL to point to backend
   git subtree push --prefix frontend heroku main
   ```

## Environment Variables

### Backend Required Variables:
- `NODE_ENV` - Set to 'production'
- `PORT` - Server port (usually 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `CORS_ORIGINS` - Allowed frontend origins

### Frontend Required Variables:
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_APP_NAME` - Application name
- `VITE_ENVIRONMENT` - Environment (production)

## Database Setup

### MongoDB Atlas (Recommended)
1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a new cluster
3. Create database user
4. Get connection string
5. Update `MONGODB_URI` environment variable

### Local MongoDB
```bash
# Install MongoDB locally
# Update MONGODB_URI to: mongodb://localhost:27017/camping-app
```

## Health Checks

The application includes health check endpoints:
- Backend: `/api/health`
- Overall status: Returns server uptime, database connection status

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **JWT Secret**: Use a strong, randomly generated secret
3. **Database**: Restrict database access to application servers only
4. **CORS**: Configure CORS to only allow your frontend domain
5. **HTTPS**: Always use HTTPS in production

## Monitoring

### Basic Monitoring
- Check `/api/health` endpoint regularly
- Monitor application logs
- Set up uptime monitoring (UptimeRobot, Pingdom)

### Advanced Monitoring
- Application Performance Monitoring (APM)
- Error tracking (Sentry)
- Log aggregation (LogDNA, Papertrail)

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**:
   - Verify MONGODB_URI is correct
   - Check network access to database
   - Ensure database user has proper permissions

2. **CORS Errors**:
   - Update CORS_ORIGINS with your frontend URL
   - Ensure protocol (http/https) matches

3. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are listed in package.json
   - Check for environment-specific code

4. **API Not Accessible**:
   - Verify backend is running on correct port
   - Check firewall settings
   - Ensure health check endpoint returns 200

### Logs
```bash
# Docker logs
docker-compose logs -f

# Railway logs (via CLI)
railway logs

# Render logs (via dashboard)
# Check logs section in Render dashboard
```

## Scaling

### Horizontal Scaling
- Use load balancers
- Deploy multiple backend instances
- Implement database connection pooling

### Vertical Scaling
- Increase server resources (RAM, CPU)
- Optimize database queries
- Implement caching strategies

## Backup Strategy

1. **Database Backups**:
   - Set up automated MongoDB backups
   - Test restore procedures regularly

2. **Code Backups**:
   - Use Git for version control
   - Implement CI/CD pipelines
   - Tag stable releases

## Support

For deployment issues:
1. Check logs for error messages
2. Verify all environment variables are set
3. Test health check endpoints
4. Contact support with specific error messages

## Updates and Maintenance

1. **Regular Updates**:
   - Keep dependencies updated
   - Monitor security advisories
   - Test updates in staging environment

2. **Database Maintenance**:
   - Monitor database performance
   - Implement index optimization
   - Regular data cleanup if needed

---

**🎉 Your CampSpot application is ready for the world!**

Choose the deployment method that best fits your needs and technical expertise. Railway and Render are great for beginners, while Docker gives you more control and flexibility.

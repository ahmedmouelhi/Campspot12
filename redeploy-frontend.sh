#!/bin/bash
set -e

echo "🚀 Starting frontend redeployment to connect with backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="https://campspot12-backend.herokuapp.com"
FRONTEND_PROJECT_NAME="campspot12"

echo -e "${BLUE}📋 Frontend Redeploy Configuration:${NC}"
echo -e "  Backend URL: ${BACKEND_URL}"
echo -e "  Vercel Project: ${FRONTEND_PROJECT_NAME}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  You are not logged in to Vercel${NC}"
    echo "Please run: vercel login"
    vercel login
fi

echo -e "${GREEN}✅ Vercel CLI is ready${NC}"

# Navigate to frontend directory
cd frontend

# Update environment variables for production
echo -e "${BLUE}🔧 Updating production environment variables...${NC}"
cat > .env.production << EOF
VITE_API_BASE_URL=${BACKEND_URL}/api
VITE_APP_NAME=CampSpot
VITE_NODE_ENV=production
EOF

echo -e "${GREEN}✅ Updated .env.production${NC}"

# Update vercel.json to include environment variables
echo -e "${BLUE}🔧 Updating Vercel configuration...${NC}"
cat > vercel.json << EOF
{
  "version": 2,
  "name": "campspot12",
  "builds": [
    {
      "src": "dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/\$1"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "${BACKEND_URL}/api",
    "VITE_APP_NAME": "CampSpot",
    "VITE_NODE_ENV": "production"
  },
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
EOF

echo -e "${GREEN}✅ Updated vercel.json${NC}"

# Build the frontend with new environment
echo -e "${BLUE}🔨 Building frontend with new backend URL...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Deploy to Vercel
echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
vercel --prod --yes

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls ${FRONTEND_PROJECT_NAME} | grep "https://" | head -1 | awk '{print $2}')

if [ -z "$DEPLOYMENT_URL" ]; then
    echo -e "${YELLOW}⚠️  Could not retrieve deployment URL automatically${NC}"
    echo -e "${BLUE}Please check your deployment at: https://vercel.com/dashboard${NC}"
else
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
    echo -e "${BLUE}Frontend URL: ${DEPLOYMENT_URL}${NC}"
    
    # Test the deployment
    echo -e "${BLUE}🧪 Testing frontend deployment...${NC}"
    if curl -f "${DEPLOYMENT_URL}" &> /dev/null; then
        echo -e "${GREEN}✅ Frontend is responding${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend might still be starting up${NC}"
    fi
    
    # Update backend CORS to include new frontend URL
    echo -e "${BLUE}🔧 Updating backend CORS configuration...${NC}"
    cd ../backend
    if [ -d .git ]; then
        # Update CORS origins in backend
        heroku config:set CORS_ORIGINS="${DEPLOYMENT_URL},https://campspot12-h6zhy2uue-ahmedmouelhis-projects.vercel.app" --app campspot12-backend
        echo -e "${GREEN}✅ Updated backend CORS configuration${NC}"
    fi
    cd ../frontend
fi

echo -e "${GREEN}🎉 Frontend redeployment completed!${NC}"
echo ""
echo -e "${BLUE}📋 Your application URLs:${NC}"
echo -e "  🖥️  Frontend: ${DEPLOYMENT_URL:-'Check Vercel dashboard'}"
echo -e "  ⚙️  Backend:  ${BACKEND_URL}"
echo -e "  📚 API Docs: ${BACKEND_URL}/api-docs"
echo -e "  🔍 Health:   ${BACKEND_URL}/api/health"
echo ""
echo -e "${BLUE}🔧 Useful commands:${NC}"
echo -e "  vercel logs                    # View deployment logs"
echo -e "  vercel ls                      # List deployments"
echo -e "  vercel --prod                  # Redeploy to production"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "1. Test your application end-to-end"
echo "2. Check that API calls are working properly"
echo "3. Monitor both frontend and backend for any issues"

#!/bin/bash
set -e

echo "🚀 Starting Heroku deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_APP_NAME="campspot12-backend"
FRONTEND_URL="https://campspot12-h6zhy2uue-ahmedmouelhis-projects.vercel.app"
MONGODB_URI="mongodb+srv://ahmed:15963@cluster0.6ookgvr.mongodb.net/camping-app?retryWrites=true&w=majority&appName=Cluster0"
JWT_SECRET="b-86R9KOZbbWiCf9xd-9rIps-aCaqohz"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo -e "  Backend App: ${BACKEND_APP_NAME}"
echo -e "  Frontend URL: ${FRONTEND_URL}"
echo -e "  Database: MongoDB Atlas"
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku CLI is not installed${NC}"
    echo "Please install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  You are not logged in to Heroku${NC}"
    echo "Please run: heroku login"
    exit 1
fi

echo -e "${GREEN}✅ Heroku CLI is ready${NC}"

# Navigate to backend directory
cd backend

# Check if Heroku app exists, create if not
if ! heroku apps:info $BACKEND_APP_NAME &> /dev/null; then
    echo -e "${YELLOW}📱 Creating Heroku app: $BACKEND_APP_NAME${NC}"
    heroku create $BACKEND_APP_NAME --region us
else
    echo -e "${GREEN}✅ Heroku app already exists: $BACKEND_APP_NAME${NC}"
fi

# Set environment variables
echo -e "${BLUE}🔧 Setting environment variables...${NC}"
heroku config:set NODE_ENV=production --app $BACKEND_APP_NAME
heroku config:set PORT=\$PORT --app $BACKEND_APP_NAME  # Heroku will set this automatically
heroku config:set MONGODB_URI="$MONGODB_URI" --app $BACKEND_APP_NAME
heroku config:set JWT_SECRET="$JWT_SECRET" --app $BACKEND_APP_NAME
heroku config:set CORS_ORIGINS="$FRONTEND_URL" --app $BACKEND_APP_NAME

# Add Heroku buildpack for Node.js
echo -e "${BLUE}🔨 Setting Node.js buildpack...${NC}"
heroku buildpacks:set heroku/nodejs --app $BACKEND_APP_NAME

# Create or update Procfile
echo -e "${BLUE}📝 Creating Procfile...${NC}"
cat > Procfile << 'EOF'
web: npm run start:prod
EOF

# Ensure package.json has correct scripts
echo -e "${BLUE}🔧 Updating package.json scripts...${NC}"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['start:prod'] = 'node dist/server.js';
pkg.scripts['postinstall'] = 'npm run build';
pkg.engines = pkg.engines || {};
pkg.engines.node = '18.x';
pkg.engines.npm = '9.x';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Updated package.json');
"

# Initialize git repo if not exists
if [ ! -d .git ]; then
    echo -e "${BLUE}🔄 Initializing Git repository...${NC}"
    git init
    heroku git:remote -a $BACKEND_APP_NAME
else
    echo -e "${GREEN}✅ Git repository already exists${NC}"
    # Add Heroku remote if not exists
    if ! git remote get-url heroku &> /dev/null; then
        heroku git:remote -a $BACKEND_APP_NAME
    fi
fi

# Add all files and commit
echo -e "${BLUE}📦 Committing changes...${NC}"
git add .
git commit -m "Deploy backend to Heroku - $(date)" || echo "No changes to commit"

# Deploy to Heroku
echo -e "${BLUE}🚀 Deploying to Heroku...${NC}"
git push heroku main --force

# Wait for deployment and get app URL
echo -e "${BLUE}⏳ Waiting for deployment to complete...${NC}"
sleep 10

BACKEND_URL="https://$BACKEND_APP_NAME.herokuapp.com"

# Test the deployment
echo -e "${BLUE}🧪 Testing backend deployment...${NC}"
if curl -f "$BACKEND_URL/api/health" &> /dev/null; then
    echo -e "${GREEN}✅ Backend is responding at: $BACKEND_URL${NC}"
else
    echo -e "${YELLOW}⚠️  Backend might still be starting up. You can check logs with:${NC}"
    echo -e "   heroku logs --tail --app $BACKEND_APP_NAME"
fi

# Show app info
echo -e "${BLUE}📊 Deployment Summary:${NC}"
heroku apps:info $BACKEND_APP_NAME

# Update frontend environment to use new backend URL
cd ../frontend
echo -e "${BLUE}🔧 Updating frontend environment...${NC}"

# Update .env.production
cat > .env.production << EOF
VITE_API_BASE_URL=$BACKEND_URL/api
VITE_APP_NAME=CampSpot
VITE_NODE_ENV=production
EOF

echo -e "${GREEN}✅ Frontend environment updated with backend URL: $BACKEND_URL${NC}"

# Update CORS in backend with both URLs
cd ../backend
echo -e "${BLUE}🔧 Updating CORS configuration...${NC}"
heroku config:set CORS_ORIGINS="$FRONTEND_URL,https://campspot12.vercel.app" --app $BACKEND_APP_NAME

cd ..

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📋 Your application URLs:${NC}"
echo -e "  🖥️  Frontend: $FRONTEND_URL"
echo -e "  ⚙️  Backend:  $BACKEND_URL"
echo -e "  📚 API Docs: $BACKEND_URL/api-docs"
echo -e "  🔍 Health:   $BACKEND_URL/api/health"
echo ""
echo -e "${BLUE}🔧 Management commands:${NC}"
echo -e "  heroku logs --tail --app $BACKEND_APP_NAME    # View logs"
echo -e "  heroku ps --app $BACKEND_APP_NAME             # View process status"
echo -e "  heroku config --app $BACKEND_APP_NAME         # View environment vars"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "1. Test your application at the URLs above"
echo "2. Update your frontend deployment (if needed) to use the new backend URL"
echo "3. Monitor logs for any issues"

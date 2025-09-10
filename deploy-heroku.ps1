# CampSpot Heroku Deployment Script for PowerShell
param(
    [string]$BackendAppName = "campspot12-backend"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Heroku deployment process..." -ForegroundColor Blue

# Configuration
$FRONTEND_URL = "https://campspot12-h6zhy2uue-ahmedmouelhis-projects.vercel.app"
$MONGODB_URI = "mongodb+srv://ahmed:15963@cluster0.6ookgvr.mongodb.net/camping-app?retryWrites=true&w=majority&appName=Cluster0"
$JWT_SECRET = "b-86R9KOZbbWiCf9xd-9rIps-aCaqohz"

Write-Host "📋 Deployment Configuration:" -ForegroundColor Blue
Write-Host "  Backend App: $BackendAppName" -ForegroundColor White
Write-Host "  Frontend URL: $FRONTEND_URL" -ForegroundColor White
Write-Host "  Database: MongoDB Atlas" -ForegroundColor White
Write-Host ""

# Check if Heroku CLI is installed
try {
    heroku --version | Out-Null
    Write-Host "✅ Heroku CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku CLI is not installed" -ForegroundColor Red
    Write-Host "Please install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in to Heroku
try {
    heroku auth:whoami | Out-Null
    Write-Host "✅ Logged in to Heroku" -ForegroundColor Green
} catch {
    Write-Host "⚠️  You are not logged in to Heroku" -ForegroundColor Yellow
    Write-Host "Please run: heroku login" -ForegroundColor Yellow
    exit 1
}

# Navigate to backend directory
Set-Location backend

# Check if Heroku app exists, create if not
try {
    heroku apps:info $BackendAppName | Out-Null
    Write-Host "✅ Heroku app already exists: $BackendAppName" -ForegroundColor Green
} catch {
    Write-Host "📱 Creating Heroku app: $BackendAppName" -ForegroundColor Yellow
    heroku create $BackendAppName --region us
}

# Set environment variables
Write-Host "🔧 Setting environment variables..." -ForegroundColor Blue
heroku config:set NODE_ENV=production --app $BackendAppName
heroku config:set MONGODB_URI="$MONGODB_URI" --app $BackendAppName
heroku config:set JWT_SECRET="$JWT_SECRET" --app $BackendAppName
heroku config:set CORS_ORIGINS="$FRONTEND_URL" --app $BackendAppName

# Add Heroku buildpack for Node.js
Write-Host "🔨 Setting Node.js buildpack..." -ForegroundColor Blue
heroku buildpacks:set heroku/nodejs --app $BackendAppName

# Create or update Procfile
Write-Host "📝 Creating Procfile..." -ForegroundColor Blue
"web: npm run start:prod" | Out-File -FilePath "Procfile" -Encoding utf8

# Update package.json
Write-Host "🔧 Updating package.json..." -ForegroundColor Blue
$packageJson = Get-Content "package.json" | ConvertFrom-Json

if (-not $packageJson.scripts) {
    $packageJson.scripts = @{}
}
$packageJson.scripts."start:prod" = "node dist/server.js"
$packageJson.scripts."postinstall" = "npm run build"

if (-not $packageJson.engines) {
    $packageJson.engines = @{}
}
$packageJson.engines.node = "18.x"
$packageJson.engines.npm = "9.x"

$packageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "package.json" -Encoding utf8
Write-Host "✅ Updated package.json" -ForegroundColor Green

# Initialize git repo if not exists
if (-not (Test-Path ".git")) {
    Write-Host "🔄 Initializing Git repository..." -ForegroundColor Blue
    git init
    heroku git:remote -a $BackendAppName
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
    try {
        git remote get-url heroku | Out-Null
    } catch {
        heroku git:remote -a $BackendAppName
    }
}

# Add all files and commit
Write-Host "📦 Committing changes..." -ForegroundColor Blue
git add .
try {
    git commit -m "Deploy backend to Heroku - $(Get-Date)"
} catch {
    Write-Host "No changes to commit" -ForegroundColor Yellow
}

# Deploy to Heroku
Write-Host "🚀 Deploying to Heroku..." -ForegroundColor Blue
git push heroku main --force

# Wait for deployment
Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Blue
Start-Sleep -Seconds 10

$BACKEND_URL = "https://$BackendAppName.herokuapp.com"

# Test the deployment
Write-Host "🧪 Testing backend deployment..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/health" -Method Get -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is responding at: $BACKEND_URL" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Backend might still be starting up. Check logs with:" -ForegroundColor Yellow
    Write-Host "   heroku logs --tail --app $BackendAppName" -ForegroundColor White
}

# Show app info
Write-Host "📊 Deployment Summary:" -ForegroundColor Blue
heroku apps:info $BackendAppName

# Update frontend environment
Set-Location ../frontend
Write-Host "🔧 Updating frontend environment..." -ForegroundColor Blue

$frontendEnv = @"
VITE_API_BASE_URL=$BACKEND_URL/api
VITE_APP_NAME=CampSpot
VITE_NODE_ENV=production
"@

$frontendEnv | Out-File -FilePath ".env.production" -Encoding utf8
Write-Host "✅ Frontend environment updated with backend URL: $BACKEND_URL" -ForegroundColor Green

# Update CORS configuration
Set-Location ../backend
Write-Host "🔧 Updating CORS configuration..." -ForegroundColor Blue
heroku config:set CORS_ORIGINS="$FRONTEND_URL,https://campspot12.vercel.app" --app $BackendAppName

Set-Location ..

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Your application URLs:" -ForegroundColor Blue
Write-Host "  🖥️  Frontend: $FRONTEND_URL" -ForegroundColor White
Write-Host "  ⚙️  Backend:  $BACKEND_URL" -ForegroundColor White
Write-Host "  📚 API Docs: $BACKEND_URL/api-docs" -ForegroundColor White
Write-Host "  🔍 Health:   $BACKEND_URL/api/health" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Management commands:" -ForegroundColor Blue
Write-Host "  heroku logs --tail --app $BackendAppName    # View logs" -ForegroundColor White
Write-Host "  heroku ps --app $BackendAppName             # View process status" -ForegroundColor White
Write-Host "  heroku config --app $BackendAppName         # View environment vars" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Next steps:" -ForegroundColor Yellow
Write-Host "1. Test your application at the URLs above"
Write-Host "2. Update your frontend deployment (if needed) to use the new backend URL"
Write-Host "3. Monitor logs for any issues"

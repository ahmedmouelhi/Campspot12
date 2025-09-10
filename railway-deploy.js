#!/usr/bin/env node

/**
 * Railway Deployment Automation Script
 * This script helps automate Railway deployment if Railway CLI is available
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CampSpot Railway Deployment Script');
console.log('=====================================\n');

// Check if Railway CLI is installed
function checkRailwayCLI() {
  try {
    execSync('railway --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Deploy backend service
function deployBackend() {
  console.log('📦 Deploying Backend Service...');
  
  const backendEnv = `NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://ahmed:15963@cluster0.6ookgvr.mongodb.net/camping-app?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=1ef823bd73e24e9bd38483580f5d0092f680adb3c16d96146c5107ed472a93449d7b82642beeccc03a3ad450cb2c0180309acb5b4f39c411f24dceb632942ff5`;

  try {
    // Create new project
    console.log('Creating Railway project...');
    execSync('railway login', { stdio: 'inherit' });
    execSync('railway new campspot-backend', { stdio: 'inherit' });
    
    // Navigate to backend and deploy
    process.chdir('./backend');
    
    // Set environment variables
    const envVars = backendEnv.split('\n').filter(line => line.trim());
    envVars.forEach(envVar => {
      const [key, value] = envVar.split('=');
      execSync(`railway variables set ${key}="${value}"`, { stdio: 'inherit' });
    });
    
    // Deploy
    execSync('railway up', { stdio: 'inherit' });
    
    console.log('✅ Backend deployed successfully!');
    process.chdir('..');
    
  } catch (error) {
    console.error('❌ Backend deployment failed:', error.message);
    return false;
  }
  
  return true;
}

// Deploy frontend service
function deployFrontend(backendUrl) {
  console.log('🎨 Deploying Frontend Service...');
  
  try {
    // Create new service for frontend
    execSync('railway new campspot-frontend', { stdio: 'inherit' });
    
    // Navigate to frontend
    process.chdir('./frontend');
    
    // Set environment variable
    execSync(`railway variables set VITE_API_BASE_URL="${backendUrl}/api"`, { stdio: 'inherit' });
    
    // Deploy
    execSync('railway up', { stdio: 'inherit' });
    
    console.log('✅ Frontend deployed successfully!');
    process.chdir('..');
    
  } catch (error) {
    console.error('❌ Frontend deployment failed:', error.message);
    return false;
  }
  
  return true;
}

// Main deployment function
async function main() {
  if (!checkRailwayCLI()) {
    console.log('❌ Railway CLI not found.');
    console.log('\n📋 Manual Deployment Required:');
    console.log('1. Go to https://railway.app');
    console.log('2. Sign up with GitHub');
    console.log('3. Deploy from GitHub repo: ahmedmouelhi/Campspot12');
    console.log('4. Follow the instructions in DEPLOY_INSTRUCTIONS.md');
    console.log('\n🔧 To install Railway CLI:');
    console.log('npm install -g @railway/cli');
    return;
  }
  
  console.log('✅ Railway CLI found, starting automated deployment...\n');
  
  // Deploy backend
  if (!deployBackend()) {
    console.log('❌ Deployment failed at backend step');
    return;
  }
  
  // Get backend URL (simplified - in real scenario you'd need to fetch this)
  const backendUrl = 'https://your-backend-domain.railway.app';
  console.log(`Backend URL: ${backendUrl}`);
  
  // Deploy frontend
  if (!deployFrontend(backendUrl)) {
    console.log('❌ Deployment failed at frontend step');
    return;
  }
  
  console.log('\n🎉 Deployment completed successfully!');
  console.log('📋 Next steps:');
  console.log('1. Update backend CORS with frontend URL');
  console.log('2. Initialize database: railway run npm run db:init');
  console.log('3. Test your live application!');
}

if (require.main === module) {
  main().catch(console.error);
}

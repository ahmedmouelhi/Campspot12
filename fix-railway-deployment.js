#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Railway Deployment Fix Script');
console.log('==================================\n');

// Create clean environment files
function createEnvironmentFiles() {
  console.log('📝 Creating clean environment files...');
  
  // Backend .env file
  const backendEnv = `NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://ahmed:15963@cluster0.6ookgvr.mongodb.net/camping-app?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=b-86R9KOZbbWiCf9xd-9rIps-aCaqohz
CORS_ORIGINS=https://camping-frontend-production.up.railway.app`;

  fs.writeFileSync('./backend/.env.production', backendEnv);
  console.log('✅ Backend environment file created');

  // Frontend .env file  
  const frontendEnv = `VITE_API_BASE_URL=https://camping-backend-production-8e38.up.railway.app/api
VITE_APP_NAME=CampSpot
VITE_ENVIRONMENT=production`;

  fs.writeFileSync('./frontend/.env.production', frontendEnv);
  console.log('✅ Frontend environment file created');
}

// Create Railway nixpacks config to use env files
function createNixpacksConfig() {
  console.log('📦 Creating Nixpacks configuration...');
  
  const backendNixpacks = `providers = ["node"]
[phases.build]
cmd = "npm install && npm run build"

[phases.start]
cmd = "npm start"

[variables]
NODE_ENV = "production"`;

  fs.writeFileSync('./backend/nixpacks.toml', backendNixpacks);
  console.log('✅ Backend nixpacks config created');

  const frontendNixpacks = `providers = ["node", "...", "static"]
[phases.build]
cmd = "npm install && npm run build"

[phases.install]
cmd = "npm install"

[static]
dir = "dist"`;

  fs.writeFileSync('./frontend/nixpacks.toml', frontendNixpacks);
  console.log('✅ Frontend nixpacks config created');
}

// Create Railway service configs
function createRailwayConfigs() {
  console.log('🚂 Creating Railway service configurations...');
  
  const backendConfig = {
    "name": "camping-backend",
    "build": {
      "command": "npm run build"
    },
    "start": {
      "command": "npm start"
    },
    "env": {
      "NODE_ENV": "production",
      "PORT": "5000"
    }
  };

  const frontendConfig = {
    "name": "camping-frontend", 
    "build": {
      "command": "npm run build"
    },
    "static": {
      "dir": "dist"
    }
  };

  fs.writeFileSync('./backend/railway.json', JSON.stringify(backendConfig, null, 2));
  fs.writeFileSync('./frontend/railway.json', JSON.stringify(frontendConfig, null, 2));
  console.log('✅ Railway configs created');
}

// Deploy using alternative method
function deployServices() {
  console.log('🚀 Deploying services...');
  
  try {
    console.log('📤 Committing changes...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Fix Railway deployment with environment files"', { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log('✅ Changes pushed to GitHub');

    console.log('\n📋 Next steps:');
    console.log('1. Go to https://railway.app');
    console.log('2. Delete current corrupted services');
    console.log('3. Create new services from GitHub repo');
    console.log('4. Railway will use the environment files automatically');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Main execution
async function main() {
  try {
    createEnvironmentFiles();
    createNixpacksConfig();
    createRailwayConfigs();
    deployServices();
    
    console.log('\n🎉 Fix script completed!');
    console.log('\nYour app URLs will be:');
    console.log('🌐 Frontend: https://camping-frontend-production.up.railway.app');
    console.log('🔌 Backend: https://camping-backend-production-8e38.up.railway.app/api/health');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

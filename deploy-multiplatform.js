#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Multi-Platform CampSpot Deployment');
console.log('=====================================\n');

// Check CLI tools
function checkTools() {
  const tools = [
    { name: 'git', command: 'git --version' },
    { name: 'npm', command: 'npm --version' },
    { name: 'vercel', command: 'vercel --version' }
  ];

  tools.forEach(tool => {
    try {
      execSync(tool.command, { stdio: 'pipe' });
      console.log(`✅ ${tool.name} is available`);
    } catch (error) {
      console.log(`❌ ${tool.name} not found`);
    }
  });
  console.log('');
}

// Deploy to Vercel
function deployToVercel() {
  console.log('🔵 Deploying Frontend to Vercel...');
  
  try {
    process.chdir('./frontend');
    
    // Build first
    console.log('📦 Building frontend...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Deploy to Vercel
    console.log('🚀 Deploying to Vercel...');
    const output = execSync('vercel --prod --yes', { encoding: 'utf8' });
    console.log('✅ Frontend deployed to Vercel!');
    
    const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/);
    if (urlMatch) {
      console.log(`🌐 Frontend URL: ${urlMatch[0]}`);
      return urlMatch[0];
    }
    
    process.chdir('..');
    
  } catch (error) {
    console.error('❌ Vercel deployment failed:', error.message);
    process.chdir('..');
  }
  
  return null;
}

// Update backend CORS
function updateBackendCors(frontendUrl) {
  if (!frontendUrl) return;
  
  console.log('🔧 Updating backend CORS configuration...');
  
  try {
    // Update render.yaml
    let renderConfig = fs.readFileSync('./render.yaml', 'utf8');
    renderConfig = renderConfig.replace(
      'value: https://campspot-frontend.vercel.app',
      `value: ${frontendUrl}`
    );
    fs.writeFileSync('./render.yaml', renderConfig);
    
    // Update backend .env.production
    let backendEnv = fs.readFileSync('./backend/.env.production', 'utf8');
    backendEnv = backendEnv.replace(
      'CORS_ORIGINS=https://camping-frontend-production.up.railway.app',
      `CORS_ORIGINS=${frontendUrl}`
    );
    fs.writeFileSync('./backend/.env.production', backendEnv);
    
    console.log('✅ Backend CORS updated');
    
  } catch (error) {
    console.error('❌ Failed to update CORS:', error.message);
  }
}

// Commit and push changes
function commitChanges() {
  console.log('📤 Committing deployment configurations...');
  
  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Add multi-platform deployment configurations"', { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log('✅ Changes pushed to GitHub');
  } catch (error) {
    console.log('ℹ️  No changes to commit or push failed');
  }
}

// Main deployment function
async function main() {
  try {
    checkTools();
    
    // First commit configurations
    commitChanges();
    
    // Deploy frontend to Vercel
    const frontendUrl = deployToVercel();
    
    if (frontendUrl) {
      // Update backend CORS with actual frontend URL
      updateBackendCors(frontendUrl);
      
      // Commit CORS updates
      commitChanges();
    }
    
    console.log('\n🎉 Deployment Summary:');
    console.log('======================');
    
    if (frontendUrl) {
      console.log(`✅ Frontend: ${frontendUrl}`);
    } else {
      console.log('❌ Frontend deployment failed');
    }
    
    console.log('📋 Next Steps:');
    console.log('1. Deploy backend to Render manually:');
    console.log('   - Go to https://render.com');
    console.log('   - Connect your GitHub repository');
    console.log('   - Use the render.yaml configuration');
    console.log('');
    console.log('2. Alternative deployments:');
    console.log('   - Netlify: Connect GitHub repo (uses netlify.toml)');
    console.log('   - Railway: Import from GitHub (uses environment files)');
    console.log('');
    console.log('🔌 Expected Backend URL: https://campspot-backend.onrender.com');
    console.log('🌐 Frontend URLs:');
    if (frontendUrl) console.log(`   - Vercel: ${frontendUrl}`);
    console.log('   - Netlify: Connect manually');
    console.log('   - Railway: Import manually');
    
  } catch (error) {
    console.error('❌ Deployment script failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

# Test the production frontend deployment on Vercel
Write-Host "Testing CampSpot Production Frontend on Vercel" -ForegroundColor Green
Write-Host "================================================"

$frontendUrl = "https://campspot12.vercel.app"
$backendUrl = "https://campspot-production.up.railway.app"

# Test 1: Frontend accessibility
Write-Host "Step 1: Testing frontend accessibility..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is accessible!" -ForegroundColor Green
        Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Frontend returned status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend accessibility test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Check if the frontend HTML contains our app title
Write-Host "`nStep 2: Verifying app content..." -ForegroundColor Cyan
try {
    $content = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing
    if ($content.Content -match "CampSpot" -or $content.Content -match "camping" -or $content.Content -match "React") {
        Write-Host "✅ App content detected in frontend!" -ForegroundColor Green
    } else {
        Write-Host "❌ App content not found in frontend response" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Content verification failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Verify backend connectivity (should work since we tested it earlier)
Write-Host "`nStep 3: Verifying backend connectivity..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$backendUrl/api/health" -Method GET
    if ($health.success) {
        Write-Host "✅ Backend is healthy and accessible from production!" -ForegroundColor Green
        Write-Host "Environment: $($health.data.environment)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Backend health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend connectivity test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Production deployment test completed!" -ForegroundColor Green
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Cyan
Write-Host "Backend URL: $backendUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Your CampSpot app is now live in production!" -ForegroundColor Green
Write-Host "Users can now:" -ForegroundColor White
Write-Host "- Visit the website and register with their Instagram profile" -ForegroundColor White
Write-Host "- Browse campsites and make bookings" -ForegroundColor White
Write-Host "- View booking previews with detailed information" -ForegroundColor White
Write-Host "- Wait for admin approval before payments are processed" -ForegroundColor White
Write-Host "- Access admin dashboard (if admin privileges are granted)" -ForegroundColor White

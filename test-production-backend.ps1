# Test the production backend deployment on Railway
Write-Host "Testing CampSpot Production Backend on Railway" -ForegroundColor Green
Write-Host "================================================="

$productionUrl = "https://campspot-production.up.railway.app"

# Test 1: Health check
Write-Host "Step 1: Testing health endpoint..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$productionUrl/api/health" -Method GET
    Write-Host "✅ Health check successful!" -ForegroundColor Green
    $health | ConvertTo-Json -Depth 2
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Test user registration
Write-Host "`nStep 2: Testing user registration..." -ForegroundColor Cyan
try {
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    $registerBody = @{
        name = "Production Test User"
        email = "testuser$timestamp@example.com"
        password = "TestPass123!"
        instagramUrl = "https://www.instagram.com/testuser"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$productionUrl/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    
    if ($registerResponse.success) {
        Write-Host "✅ User registration successful!" -ForegroundColor Green
        Write-Host "User ID: $($registerResponse.data.user.id)" -ForegroundColor Yellow
        $token = $registerResponse.data.token
    } else {
        Write-Host "❌ Registration failed: $($registerResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Registration error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Test camping sites endpoint
Write-Host "`nStep 3: Testing camping sites endpoint..." -ForegroundColor Cyan
try {
    $sites = Invoke-RestMethod -Uri "$productionUrl/api/camping-sites" -Method GET
    
    if ($sites.success -and $sites.data) {
        Write-Host "✅ Camping sites loaded successfully!" -ForegroundColor Green
        Write-Host "Found $($sites.data.length) campsites" -ForegroundColor Yellow
    } else {
        Write-Host "❌ No camping sites found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error fetching campsites: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Production backend testing completed!" -ForegroundColor Green
Write-Host "Backend URL: $productionUrl" -ForegroundColor Cyan

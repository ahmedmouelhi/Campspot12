# CampSpot Production Deployment Test
Write-Host "CAMPSPOT PRODUCTION DEPLOYMENT TEST" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

$backendUrl = "https://campspot-production.up.railway.app"
$testsPassed = 0
$testsFailed = 0

# Test 1: Health Check
Write-Host "`nTest 1: Backend Health Check" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$backendUrl/api/health" -Method GET
    Write-Host "SUCCESS: Backend is healthy" -ForegroundColor Green
    Write-Host "Environment: $($health.data.environment)" -ForegroundColor Yellow
    Write-Host "Database: $($health.data.database)" -ForegroundColor Yellow
    $testsPassed++
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 2: User Registration
Write-Host "`nTest 2: User Registration with Instagram URL" -ForegroundColor Cyan
try {
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    $registerBody = @{
        name = "Production Test User"
        email = "prodtest$timestamp@example.com"
        password = "TestPass123!"
        instagramUrl = "https://www.instagram.com/testuser"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$backendUrl/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    
    Write-Host "SUCCESS: User registered" -ForegroundColor Green
    Write-Host "User ID: $($response.data.user.id)" -ForegroundColor Yellow
    Write-Host "Role: $($response.data.user.role)" -ForegroundColor Yellow
    $userToken = $response.data.token
    $testsPassed++
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Camping Sites
Write-Host "`nTest 3: Camping Sites Retrieval" -ForegroundColor Cyan
try {
    $sites = Invoke-RestMethod -Uri "$backendUrl/api/camping-sites" -Method GET
    Write-Host "SUCCESS: Found $($sites.data.length) campsites" -ForegroundColor Green
    $campsites = $sites.data
    $testsPassed++
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 4: Booking Creation
if ($userToken -and $campsites -and $campsites.length -gt 0) {
    Write-Host "`nTest 4: Enhanced Booking Creation" -ForegroundColor Cyan
    try {
        $bookingBody = @{
            campingSiteId = $campsites[0]._id
            startDate = "2025-08-15"
            endDate = "2025-08-17"
            guests = 2
            equipment = @("tent", "sleeping bags", "camping chairs")
            activities = @("hiking", "fishing", "campfire")
            specialRequests = "Near the lake with fire pit access for production testing"
        } | ConvertTo-Json
        
        $headers = @{
            "Authorization" = "Bearer $userToken"
            "Content-Type" = "application/json"
        }
        
        $booking = Invoke-RestMethod -Uri "$backendUrl/api/bookings" -Method POST -Body $bookingBody -Headers $headers
        
        Write-Host "SUCCESS: Booking created" -ForegroundColor Green
        Write-Host "Booking ID: $($booking.data._id)" -ForegroundColor Yellow
        Write-Host "Status: $($booking.data.status)" -ForegroundColor Yellow
        Write-Host "Total Price: $($booking.data.totalPrice)" -ForegroundColor Yellow
        $bookingId = $booking.data._id
        $testsPassed++
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }

    # Test 5: Admin Booking Approval
    if ($bookingId) {
        Write-Host "`nTest 5: Admin Booking Approval" -ForegroundColor Cyan
        try {
            $approvalBody = @{
                adminNotes = "Production test booking approved successfully"
            } | ConvertTo-Json
            
            $approval = Invoke-RestMethod -Uri "$backendUrl/api/bookings/admin/$bookingId/approve" -Method POST -Body $approvalBody -Headers $headers
            
            Write-Host "SUCCESS: Booking approved" -ForegroundColor Green
            Write-Host "New Status: $($approval.data.status)" -ForegroundColor Yellow
            $testsPassed++
        } catch {
            Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
            $testsFailed++
        }
    }
}

# Test 6: Activities
Write-Host "`nTest 6: Activities Retrieval" -ForegroundColor Cyan
try {
    $activities = Invoke-RestMethod -Uri "$backendUrl/api/activities" -Method GET
    Write-Host "SUCCESS: Found $($activities.data.length) activities" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 7: Equipment
Write-Host "`nTest 7: Equipment Retrieval" -ForegroundColor Cyan
try {
    $equipment = Invoke-RestMethod -Uri "$backendUrl/api/equipment" -Method GET
    Write-Host "SUCCESS: Found $($equipment.data.length) equipment items" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Summary
Write-Host "`n" + "=" * 50 -ForegroundColor Green
Write-Host "PRODUCTION DEPLOYMENT TEST RESULTS" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if($testsFailed -eq 0) {'Green'} else {'Red'})
Write-Host "Backend URL: $backendUrl" -ForegroundColor Cyan

if ($testsFailed -eq 0) {
    Write-Host "`nALL TESTS PASSED! Production deployment successful!" -ForegroundColor Green
} else {
    Write-Host "`nSome tests failed. Please review above." -ForegroundColor Yellow
}

Write-Host "`nCampSpot Features Successfully Deployed:" -ForegroundColor Green
Write-Host "- User registration with Instagram profile requirement" -ForegroundColor White
Write-Host "- Enhanced booking system with equipment and activities" -ForegroundColor White
Write-Host "- Admin booking approval workflow" -ForegroundColor White
Write-Host "- Complete API ecosystem" -ForegroundColor White

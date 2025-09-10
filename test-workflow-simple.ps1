# Test the complete booking workflow with authentication
Write-Host "Testing CampSpot Booking Workflow" -ForegroundColor Green
Write-Host "=================================="

# Test 1: Register a new user
Write-Host "Step 1: Registering new user..." -ForegroundColor Cyan
try {
    $registerBody = @{
        name = "John Doe"
        email = "johndoe.test$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
        password = "securepassword123"
        instagramUrl = "https://instagram.com/johndoe"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    
    if ($registerResponse.success) {
        Write-Host "User registered successfully!" -ForegroundColor Green
        $token = $registerResponse.data.token
        Write-Host "User ID: $($registerResponse.data.user._id)" -ForegroundColor Yellow
    } else {
        Write-Host "Registration failed: $($registerResponse.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Registration error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Get camping sites
Write-Host "Step 2: Fetching camping sites..." -ForegroundColor Cyan
try {
    $sites = Invoke-RestMethod -Uri "http://localhost:5000/api/camping-sites" -Method GET
    
    if ($sites.success -and $sites.data.length -gt 0) {
        $firstSite = $sites.data[0]
        Write-Host "Found $($sites.data.length) campsites!" -ForegroundColor Green
        Write-Host "Using campsite: $($firstSite.name)" -ForegroundColor Yellow
    } else {
        Write-Host "No camping sites found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error fetching campsites: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Create a booking
Write-Host "Step 3: Creating booking..." -ForegroundColor Cyan
try {
    $bookingBody = @{
        campingSiteId = $firstSite._id
        startDate = "2025-08-15"
        endDate = "2025-08-17"
        guests = 2
        equipment = @("tent", "sleeping bags", "camping chairs")
        activities = @("hiking", "fishing", "campfire")
        specialRequests = "Near the lake with fire pit access"
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $booking = Invoke-RestMethod -Uri "http://localhost:5000/api/bookings" -Method POST -Body $bookingBody -Headers $headers
    
    if ($booking.success) {
        Write-Host "Booking created successfully!" -ForegroundColor Green
        Write-Host "Booking ID: $($booking.data._id)" -ForegroundColor Yellow
        Write-Host "Status: $($booking.data.status)" -ForegroundColor Yellow
        Write-Host "Total Price: $($booking.data.totalPrice)" -ForegroundColor Yellow
        $bookingId = $booking.data._id
    } else {
        Write-Host "Booking creation failed: $($booking.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Booking error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Test 4: Approve the booking as admin
Write-Host "Step 4: Approving booking as admin..." -ForegroundColor Cyan
try {
    $approvalBody = @{
        adminNotes = "Booking looks great! Customer has good profile."
    } | ConvertTo-Json
    
    $approvalResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/bookings/admin/$bookingId/approve" -Method POST -Body $approvalBody -Headers $headers
    
    if ($approvalResponse.success) {
        Write-Host "Booking approved successfully!" -ForegroundColor Green
        Write-Host "New status: $($approvalResponse.data.status)" -ForegroundColor Yellow
        Write-Host "Admin notes: $($approvalResponse.data.adminNotes)" -ForegroundColor Yellow
    } else {
        Write-Host "Booking approval failed: $($approvalResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "Approval error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 5: Get booking stats
Write-Host "Step 5: Getting booking statistics..." -ForegroundColor Cyan
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:5000/api/bookings/admin/stats" -Method GET -Headers $headers
    
    if ($stats.success) {
        Write-Host "Booking statistics retrieved!" -ForegroundColor Green
        Write-Host "Total bookings: $($stats.data.totalBookings)" -ForegroundColor Yellow
        Write-Host "Pending bookings: $($stats.data.pendingBookings)" -ForegroundColor Yellow
        Write-Host "Approved bookings: $($stats.data.approvedBookings)" -ForegroundColor Yellow
        Write-Host "Total revenue: $($stats.data.totalRevenue)" -ForegroundColor Yellow
    } else {
        Write-Host "Failed to get booking stats: $($stats.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "Stats error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Booking workflow test completed!" -ForegroundColor Green
Write-Host "Frontend is available at: http://localhost:5174" -ForegroundColor Cyan
Write-Host "Backend is running at: http://localhost:5000" -ForegroundColor Cyan

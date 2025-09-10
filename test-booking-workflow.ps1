# Test the complete booking workflow with authentication
Write-Host "🚀 Testing CampSpot Booking Workflow" -ForegroundColor Green
Write-Host "=" * 50

# Test 1: Register a new user
Write-Host "📝 Step 1: Registering new user..." -ForegroundColor Cyan
try {
    $registerBody = @{
        name = "John Doe"
        email = "johndoe.test@example.com"
        password = "securepassword123"
        instagramUrl = "https://instagram.com/johndoe"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    
    if ($registerResponse.success) {
        Write-Host "✅ User registered successfully!" -ForegroundColor Green
        $token = $registerResponse.data.token
        Write-Host "User ID: $($registerResponse.data.user._id)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Registration failed: $($registerResponse.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Registration error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Get camping sites
Write-Host "`n🏕️ Step 2: Fetching camping sites..." -ForegroundColor Cyan
try {
    $sites = Invoke-RestMethod -Uri "http://localhost:5000/api/camping-sites" -Method GET
    
    if ($sites.success -and $sites.data.length -gt 0) {
        $firstSite = $sites.data[0]
        Write-Host "✅ Found $($sites.data.length) campsites!" -ForegroundColor Green
        Write-Host "Using campsite: $($firstSite.name) (ID: $($firstSite._id))" -ForegroundColor Yellow
    } else {
        Write-Host "❌ No camping sites found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error fetching campsites: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Create a booking
Write-Host "`n📅 Step 3: Creating booking..." -ForegroundColor Cyan
try {
    $bookingBody = @{
        campingSiteId = $firstSite._id
        startDate = "2025-08-15"
        endDate = "2025-08-17"
        guests = 2
        equipment = @("tent", "sleeping bags", "camping chairs")
        activities = @("hiking", "fishing", "campfire")
        specialRequests = "Near the lake with fire pit access, quiet area preferred"
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $booking = Invoke-RestMethod -Uri "http://localhost:5000/api/bookings" -Method POST -Body $bookingBody -Headers $headers
    
    if ($booking.success) {
        Write-Host "✅ Booking created successfully!" -ForegroundColor Green
        Write-Host "Booking ID: $($booking.data._id)" -ForegroundColor Yellow
        Write-Host "Status: $($booking.data.status)" -ForegroundColor Yellow
        Write-Host "Total Price: `$$($booking.data.totalPrice)" -ForegroundColor Yellow
        $bookingId = $booking.data._id
    } else {
        Write-Host "❌ Booking creation failed: $($booking.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Booking error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Test 4: Get all bookings for admin
Write-Host "`n👨‍💼 Step 4: Testing admin booking management..." -ForegroundColor Cyan
try {
    $allBookings = Invoke-RestMethod -Uri "http://localhost:5000/api/bookings/admin/all" -Method GET -Headers $headers
    
    if ($allBookings.success) {
        Write-Host "✅ Retrieved all bookings for admin!" -ForegroundColor Green
        Write-Host "Total bookings: $($allBookings.data.length)" -ForegroundColor Yellow
        
        # Find our booking
        $ourBooking = $allBookings.data | Where-Object { $_._id -eq $bookingId }
        if ($ourBooking) {
            Write-Host "Found our booking with status: $($ourBooking.status)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Failed to get admin bookings: $($allBookings.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Admin booking query error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Approve the booking as admin
Write-Host "`n✅ Step 5: Approving booking as admin..." -ForegroundColor Cyan
try {
    $approvalBody = @{
        adminNotes = "Booking looks great! Customer has good Instagram profile and reasonable requests."
    } | ConvertTo-Json
    
    $approvalResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/bookings/admin/$bookingId/approve" -Method POST -Body $approvalBody -Headers $headers
    
    if ($approvalResponse.success) {
        Write-Host "✅ Booking approved successfully!" -ForegroundColor Green
        Write-Host "New status: $($approvalResponse.data.status)" -ForegroundColor Yellow
        Write-Host "Approved by: $($approvalResponse.data.approvedBy)" -ForegroundColor Yellow
        Write-Host "Admin notes: $($approvalResponse.data.adminNotes)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Booking approval failed: $($approvalResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Approval error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 6: Get booking stats
Write-Host "`n📊 Step 6: Getting booking statistics..." -ForegroundColor Cyan
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:5000/api/bookings/admin/stats" -Method GET -Headers $headers
    
    if ($stats.success) {
        Write-Host "✅ Booking statistics retrieved!" -ForegroundColor Green
        Write-Host "Total bookings: $($stats.data.totalBookings)" -ForegroundColor Yellow
        Write-Host "Pending bookings: $($stats.data.pendingBookings)" -ForegroundColor Yellow
        Write-Host "Approved bookings: $($stats.data.approvedBookings)" -ForegroundColor Yellow
        Write-Host "Total revenue: `$$($stats.data.totalRevenue)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to get booking stats: $($stats.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Stats error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Booking workflow test completed!" -ForegroundColor Green
Write-Host "Frontend is available at: http://localhost:5174" -ForegroundColor Cyan
Write-Host "Backend is running at: http://localhost:5000" -ForegroundColor Cyan

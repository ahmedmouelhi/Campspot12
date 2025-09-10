# First, let's get camping sites
try {
    Write-Host "Fetching camping sites..."
    $sites = Invoke-RestMethod -Uri "http://localhost:5000/api/camping-sites" -Method GET
    
    if ($sites.success -and $sites.data.length -gt 0) {
        $firstSite = $sites.data[0]
        Write-Host "Using campsite: $($firstSite.name)"
        
        # Create booking with enhanced details
        $bookingBody = @{
            campingSiteId = $firstSite._id
            startDate = "2025-10-15"
            endDate = "2025-10-17"
            guests = 2
            equipment = @("tent", "sleeping bags")
            activities = @("hiking", "fishing")
            specialRequests = "Near the lake with fire pit access"
        } | ConvertTo-Json
        
        # Get the JWT token from the previous registration
        $token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGMxZjRhNzAxOGU5NmM3OGEyMWQzOTYiLCJpYXQiOjE3NTc1NDE1NDQsImV4cCI6MTc1ODE0NjM0NH0.qp18PjDCPASQo7uXlG7-68TCwDMFC7R5NnPFUnLRJBg"
        
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        Write-Host "Creating booking..."
        $booking = Invoke-RestMethod -Uri "http://localhost:5000/api/bookings" -Method POST -Body $bookingBody -Headers $headers
        
        Write-Host "Booking created successfully:"
        $booking | ConvertTo-Json -Depth 4
        
        # Store booking ID for admin approval test
        $booking.data._id | Out-File -FilePath "booking-id.txt" -Encoding UTF8
        
    } else {
        Write-Host "No camping sites found"
    }
    
} catch {
    Write-Host "Error creating booking:"
    $_.Exception.Message
    if ($_.ErrorDetails) {
        $_.ErrorDetails.Message
    }
}

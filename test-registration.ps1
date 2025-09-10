$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$registerBody = @{
    name = "Test User"
    email = "testuser$timestamp@example.com"
    password = "password123456"
    instagramUrl = "https://www.instagram.com/testuser"
} | ConvertTo-Json

Write-Host "Testing registration with body:"
Write-Host $registerBody

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "Success:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host "Details:" -ForegroundColor Yellow
        $_.ErrorDetails.Message
    }
}

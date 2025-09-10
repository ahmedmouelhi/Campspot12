$body = @{
    name = "Test User Enhanced"
    email = "testenhanced@campspot.com"
    password = "TestPass123!"
    instagramUrl = "https://instagram.com/testuser"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Registration Success:"
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Registration Error:"
    $_.Exception.Message
    if ($_.ErrorDetails) {
        $_.ErrorDetails.Message
    }
}

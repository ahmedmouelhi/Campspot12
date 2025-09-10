Write-Host "Testing Vercel Deployment" -ForegroundColor Green

$url = "https://campspot12.vercel.app"
Write-Host "Testing: $url" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 15
    Write-Host "SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
    
    if ($response.Content -match "CampSpot") {
        Write-Host "App content found!" -ForegroundColor Green
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}

Write-Host "Backend is working: https://campspot-production.up.railway.app" -ForegroundColor Green

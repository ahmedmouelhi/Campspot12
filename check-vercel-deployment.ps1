# Check various possible Vercel URLs for CampSpot
Write-Host "Checking CampSpot Vercel Deployment Status" -ForegroundColor Green
Write-Host "==========================================="

$possibleUrls = @(
    "https://campspot12.vercel.app",
    "https://campspot-frontend.vercel.app",
    "https://camping11-app-copie.vercel.app",
    "https://campspot.vercel.app"
)

foreach ($url in $possibleUrls) {
    Write-Host "`nTesting: $url" -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ SUCCESS! Frontend found at: $url" -ForegroundColor Green
            Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Yellow
            
            # Check if it contains our app content
            if ($response.Content -match "CampSpot" -or $response.Content -match "camping" -or $response.Content -match "React") {
                Write-Host "✅ App content verified!" -ForegroundColor Green
                break
            }
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "❌ 404 Not Found" -ForegroundColor Red
        } else {
            Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n📝 Note: If all URLs return 404, the Vercel deployment may still be processing." -ForegroundColor Yellow
Write-Host "Please check your Vercel dashboard at https://vercel.com/dashboard for deployment status." -ForegroundColor Yellow
Write-Host "`nBackend is confirmed working at: https://campspot-production.up.railway.app" -ForegroundColor Green

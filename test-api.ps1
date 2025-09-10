$response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET
Write-Host "API Health Check Response:"
$response | ConvertTo-Json -Depth 3

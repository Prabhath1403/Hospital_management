# Test the appointments API to verify the schema fix

Write-Host "=== Testing Appointments API Schema Fix ===" -ForegroundColor Cyan

# Step 1: Login as doctor
Write-Host "`n[1] Logging in as doctor..." -ForegroundColor Yellow
$loginBody = @{
    email = "aisha.patel@hospital.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResp = Invoke-RestMethod -Uri "http://localhost:8000/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    $token = $loginResp.access_token
    Write-Host "✓ Login successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Fetch appointments with the token
Write-Host "`n[2] Fetching doctor appointments..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $apptsResp = Invoke-RestMethod -Uri "http://localhost:8000/appointments/doctor" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✓ API call successful" -ForegroundColor Green
    Write-Host "`nRaw Response Type: $($apptsResp.GetType())" -ForegroundColor Cyan
    
    if ($apptsResp -is [array]) {
        Write-Host "Response is an array with $($apptsResp.Count) items" -ForegroundColor Cyan
        
        if ($apptsResp.Count -gt 0) {
            Write-Host "`nFirst appointment object:" -ForegroundColor Cyan
            $firstAppt = $apptsResp[0]
            Write-Host "Fields in first appointment:" -ForegroundColor Cyan
            $firstAppt.PSObject.Properties | ForEach-Object {
                Write-Host "  - $($_.Name): $($_.Value)" -ForegroundColor Gray
            }
            
            # Check for snake_case fields
            Write-Host "`n✓ Field names in response:" -ForegroundColor Green
            if ($firstAppt.PSObject.Properties.Name -contains "doctor_id") {
                Write-Host "  ✓ doctor_id found" -ForegroundColor Green
            } else {
                Write-Host "  ✗ doctor_id NOT found" -ForegroundColor Red
            }
            
            if ($firstAppt.PSObject.Properties.Name -contains "department_id") {
                Write-Host "  ✓ department_id found" -ForegroundColor Green
            } else {
                Write-Host "  ✗ department_id NOT found" -ForegroundColor Red
            }
            
            if ($firstAppt.PSObject.Properties.Name -contains "user_id") {
                Write-Host "  ✓ user_id found" -ForegroundColor Green
            } else {
                Write-Host "  ✗ user_id NOT found" -ForegroundColor Red
            }
        } else {
            Write-Host "`n⚠ No appointments found for this doctor" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠ Response is not an array" -ForegroundColor Yellow
    }
    
    Write-Host "`nFull JSON Response:" -ForegroundColor Cyan
    $apptsResp | ConvertTo-Json -Depth 10 | Write-Host
    
} catch {
    Write-Host "✗ API call failed: $_" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan

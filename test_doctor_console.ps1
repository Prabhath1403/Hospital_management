# End-to-End Test Script for Doctor Console Appointments

$BaseURL = "http://localhost:8000"

function Test-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = $null
    )
    
    $url = "$BaseURL$Endpoint"
    $headers = @{"Content-Type" = "application/json"}
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        if ($Body) {
            $response = Invoke-WebRequest -Uri $url -Method $Method -Body ($Body | ConvertTo-Json) -Headers $headers -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $url -Method $Method -Headers $headers -ErrorAction Stop
        }
        
        return $response.Content | ConvertFrom-Json
    } catch {
        Write-Host "ERROR: $_" -ForegroundColor Red
        return $null
    }
}

Write-Host "=== STEP 1: Register a Test Patient ===" -ForegroundColor Cyan
$patientData = @{
    name = "E2E Patient Test"
    email = "e2etest$(Get-Random)@test.com"
    password = "password123"
    phone = "1234567890"
    role = "patient"
}

$patientResp = Test-ApiCall -Method POST -Endpoint "/auth/register" -Body $patientData
if ($patientResp) {
    Write-Host "✓ Patient registered successfully" -ForegroundColor Green
    $patientToken = $patientResp.access_token
    $patientId = $patientResp.user.id
    Write-Host "Patient ID: $patientId"
} else {
    Write-Host "✗ Failed to register patient" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== STEP 2: Get Available Doctors ===" -ForegroundColor Cyan
$doctorsResp = Test-ApiCall -Method GET -Endpoint "/doctors/"
if ($doctorsResp) {
    Write-Host "✓ Retrieved doctors" -ForegroundColor Green
    if ($doctorsResp.count -gt 0) {
        $doctorId = $doctorsResp[0].id
        Write-Host "Using Doctor ID: $doctorId (Name: $($doctorsResp[0].name))"
    } else {
        Write-Host "✗ No doctors available" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Failed to get doctors" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== STEP 3: Get Departments ===" -ForegroundColor Cyan
$deptsResp = Test-ApiCall -Method GET -Endpoint "/departments/"
if ($deptsResp) {
    Write-Host "✓ Retrieved departments" -ForegroundColor Green
    if ($deptsResp.count -gt 0) {
        $deptId = $deptsResp[0].id
        Write-Host "Using Department ID: $deptId"
    }
}

Write-Host "`n=== STEP 4: Book an Appointment ===" -ForegroundColor Cyan
$appointmentData = @{
    doctor_id = $doctorId
    department_id = $deptId
    appointment_datetime = (Get-Date).AddDays(1).ToString("yyyy-MM-ddT14:00:00")
    symptoms = "Headache and fever"
}

$appointmentResp = Test-ApiCall -Method POST -Endpoint "/appointments/" -Body $appointmentData -Token $patientToken
if ($appointmentResp) {
    Write-Host "✓ Appointment booked successfully" -ForegroundColor Green
    Write-Host "Appointment ID: $($appointmentResp.id)"
    $appointmentId = $appointmentResp.id
} else {
    Write-Host "✗ Failed to book appointment" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== STEP 5: Login as Doctor ===" -ForegroundColor Cyan
$doctorLoginData = @{
    email = "aisha.patel@hospital.com"
    password = "password123"
}

$doctorLoginResp = Test-ApiCall -Method POST -Endpoint "/auth/login" -Body $doctorLoginData
if ($doctorLoginResp) {
    Write-Host "✓ Doctor logged in successfully" -ForegroundColor Green
    $doctorToken = $doctorLoginResp.access_token
    Write-Host "Doctor Token received"
} else {
    Write-Host "✗ Failed to login as doctor" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== STEP 6: Fetch Doctor's Appointments ===" -ForegroundColor Cyan
$doctorApptsResp = Test-ApiCall -Method GET -Endpoint "/appointments/doctor" -Token $doctorToken
if ($doctorApptsResp) {
    Write-Host "✓ Retrieved appointments" -ForegroundColor Green
    Write-Host "Number of appointments: $($doctorApptsResp.count)"
    
    # Check if our newly booked appointment is in the list
    $foundAppointment = $false
    foreach ($appt in $doctorApptsResp) {
        if ($appt.id -eq $appointmentId) {
            $foundAppointment = $true
            Write-Host "✓ FOUND OUR APPOINTMENT IN THE LIST!" -ForegroundColor Green
            Write-Host "  - Patient: $($appt.name)"
            Write-Host "  - Appointment ID: $($appt.id)"
            Write-Host "  - Symptoms: $($appt.symptoms)"
            break
        }
    }
    
    if (-not $foundAppointment) {
        Write-Host "⚠ Appointment NOT found in doctor's list" -ForegroundColor Yellow
        Write-Host "Appointments returned:" -ForegroundColor Yellow
        $doctorApptsResp | ForEach-Object { Write-Host "  - ID: $($_.id), Patient: $($_.name)" }
    }
    
    Write-Host "`nFull API Response:"
    $doctorApptsResp | ConvertTo-Json | Write-Host
} else {
    Write-Host "✗ Failed to get appointments" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Cyan

# Wednesday Healthcare - Doctor Console Test Instructions

## Fresh Start Complete! ✅

All containers have been deleted and rebuilt from scratch with the field name fix.

## Step-by-Step Testing

### 1. Clear Your Browser Cache

- Press: **Ctrl + Shift + Delete** (Windows) or **Cmd + Shift + Delete** (Mac)
- Select "All time" and clear cache
- This ensures you get the latest frontend code

### 2. Access the Application

- Open: **http://localhost:5173**
- You should see the Wednesday Healthcare homepage

### 3. Login as a Doctor

- Click on "Login" or go to the login page
- **Email**: `aisha.patel@hospital.com`
- **Password**: `password123`
- Click "Login"

### 4. Navigate to Doctor Console

- Once logged in, you should be redirected to the Doctor Console
- Or navigate directly to the Doctor Console from the menu

### 5. View Appointments

- You should now see the **Appointments tab** with any existing appointments
- If no appointments show, proceed to book one (see step 6)

### 6. (Optional) Book an Appointment to Test

If you want to verify appointments display after booking:

1. **Logout** from the doctor account
2. **Register or Login as a Patient**:
   - Go to "Signup" or use an existing patient account
   - Register with any name, email, password, phone
3. **Book an Appointment**:
   - Go to "Appointment Booking"
   - Select a doctor (e.g., "Dr. Aisha Patel — Cardiology")
   - Select a department
   - Choose a date and time
   - Add any symptoms
   - Click "Book Appointment"
4. **Logout from patient account**
5. **Login back as doctor** (`aisha.patel@hospital.com`)
6. **Check Doctor Console** - The new appointment should appear!

## What Was Fixed

### The Problem

The backend was returning appointment fields in **camelCase**:

```json
{
  "doctorId": 123,
  "departmentId": 456,
  "userId": 789
}
```

But the frontend expected **snake_case**:

```typescript
{
  doctor_id: number,
  department_id: number,
  user_id: number
}
```

This mismatch meant the fields didn't match, so React couldn't display the data.

### The Solution

Updated `backend/schemas.py` - The `AppointmentOut` class now returns snake_case:

```python
class AppointmentOut(BaseModel):
    doctor_id: Optional[int] = None  # ✓ Fixed
    department_id: Optional[int] = None  # ✓ Fixed
    user_id: Optional[int] = None  # ✓ Fixed
```

## Services Running

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: PostgreSQL (internal)
- **Message Queue**: RabbitMQ (internal)
- **Cache**: Redis (internal)

## Test Credentials

### Doctor Account

- Email: `aisha.patel@hospital.com`
- Password: `password123`

### Other Doctors (if registered)

- Dr. Miguel Chen: `miguel.chen@hospital.com`
- Dr. Sara Khan: `sara.khan@hospital.com`

### Patient Account (create your own or use)

- Register a new patient through the Signup page

## If Appointments Still Don't Show

1. **Check Browser Console** (F12 → Console tab):

   - Look for "=== Starting fetchData ===" message
   - Check if there are any error messages
   - Verify the API response contains doctor_id, department_id, user_id

2. **Hard Refresh** (Ctrl + F5):

   - Sometimes browser caching causes issues

3. **Check Backend Logs**:

   ```bash
   docker logs infra-backend-1
   ```

4. **Test API Directly**:
   - Go to http://localhost:8000/docs
   - Login and try the `/appointments/doctor` endpoint
   - Verify the response has snake_case field names

---

**Fresh deployment completed at**: December 9, 2025, 17:30 IST

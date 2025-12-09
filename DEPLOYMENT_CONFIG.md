# 🚀 Wednesday Healthcare System - Multi-Laptop Configuration Setup

## Summary of Configuration Files Created

### 1. **Backend Configuration**

- **Location**: `backend/.env`
- **Purpose**: Database, Redis, and security settings for the backend
- **Status**: ✅ Created with defaults
- **Template**: `backend/.env.example`

### 2. **Frontend Configuration**

- **Location**: `frontend/.env`
- **Purpose**: API endpoints for the frontend application
- **Status**: ✅ Created with defaults
- **Template**: `frontend/.env.example`

### 3. **Docker Compose Configuration**

- **Location**: `infra/.env`
- **Purpose**: Port mappings and service credentials
- **Status**: ✅ Created with defaults
- **Template**: `infra/.env.example`
- **Updated**: `infra/compose.yaml` now uses environment variables

### 4. **Setup Documentation**

- **Location**: `SETUP_GUIDE.md`
- **Purpose**: Complete guide for running on any laptop
- **Status**: ✅ Created

### 5. **Quick Start Scripts**

- **Linux/Mac**: `start.sh`
- **Windows**: `start.bat`
- **Purpose**: Automated setup script
- **Status**: ✅ Created

---

## 🎯 How to Use on Another Laptop

### Step 1: Copy the Project

```bash
# Copy the entire wednesday folder to the new laptop
xcopy C:\path\to\wednesday D:\new\location /E
```

### Step 2: Ensure All Config Files Exist

The following files should be present:

```
wednesday/
├── backend/.env ✅
├── backend/.env.example ✅
├── frontend/.env ✅
├── frontend/.env.example ✅
├── infra/.env ✅
├── infra/.env.example ✅
├── infra/compose.yaml ✅
├── SETUP_GUIDE.md ✅
├── start.sh ✅
├── start.bat ✅
└── ... (other project files)
```

### Step 3: Start the Application

**Option A - Using Quick Start Script (Recommended)**

Windows:

```bash
cd wednesday
start.bat
```

Linux/Mac:

```bash
cd wednesday
chmod +x start.sh
./start.sh
```

**Option B - Manual Docker Compose**

```bash
cd wednesday/infra
docker-compose up -d
```

### Step 4: Access Services

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 📋 Configuration Details

### Database Configuration

```env
DATABASE_URL=postgresql+asyncpg://app:app@postgres:5432/health
```

- **Host**: postgres (Docker service name)
- **User**: app
- **Password**: app
- **Database**: health
- **Port**: 5432

### Cache & Tasks Configuration

```env
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_BACKEND_URL=redis://redis:6379/0
```

- Uses Redis for task queue and caching
- Database 0 is used for broker, database 0 for backend

### API Endpoints Configuration

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:9001
```

- Frontend communicates with backend via HTTP REST API
- WebSocket for real-time updates

---

## 🔐 Security Notes

### For Development (Current Setup)

- ✅ Safe to use with default credentials
- ✅ localhost only by default
- ✅ Demo database credentials

### For Production

⚠️ Before deploying to production:

1. **Change SECRET_KEY** in `backend/.env`:

   ```bash
   # Generate strong key:
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Change Database Password** in `infra/.env`:

   ```env
   POSTGRES_PASSWORD=your-very-strong-password-here
   ```

3. **Use external database** (optional):

   ```env
   DATABASE_URL=postgresql+asyncpg://user:pass@external-db:5432/health
   ```

4. **Update ENVIRONMENT**:
   ```env
   ENVIRONMENT=production
   ```

---

## 🌐 Multi-Machine Network Setup

If you want to access from another computer on the same network:

### Step 1: Find Server IP

**Windows**:

```powershell
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

**Linux/Mac**:

```bash
ifconfig
# Look for inet address
```

### Step 2: Update Configuration

Edit `infra/.env` on the **server**:

```env
VITE_API_URL=http://192.168.1.100:8000
VITE_WS_URL=ws://192.168.1.100:9001
```

### Step 3: Restart Services

```bash
docker-compose restart frontend
```

### Step 4: Access from Another Computer

```
http://192.168.1.100:5173
```

---

## 🛠️ Troubleshooting

### Port Conflicts

If ports are already in use, edit `infra/.env`:

```env
FRONTEND_PORT=5174
BACKEND_PORT=8001
POSTGRES_PORT=5433
```

### Database Connection Issues

Wait 30 seconds after startup - PostgreSQL needs time to initialize.

### Frontend Can't Connect to Backend

- Check `VITE_API_URL` in `frontend/.env`
- Ensure both frontend and backend are running: `docker ps`

### Insufficient Memory

Docker needs ~4GB. If system is slow:

- Close other applications
- Stop non-essential Docker containers

---

## 📦 Files You Can Safely Share

✅ **Safe to share with team**:

- `backend/.env.example`
- `frontend/.env.example`
- `infra/.env.example`
- `SETUP_GUIDE.md`
- `start.sh` and `start.bat`
- All source code files

❌ **DO NOT share**:

- `backend/.env` (contains SECRET_KEY)
- `frontend/.env` (if containing secrets)
- `infra/.env` (contains database password)

---

## ✨ Features Ready to Deploy

Your Wednesday application includes:

- ✅ AI Symptom Checker with file upload
- ✅ Doctor Console with appointment management
- ✅ Patient Dashboard
- ✅ Medicine prescription system
- ✅ Real-time updates
- ✅ User authentication
- ✅ Complete REST API

---

## 🚀 Next Steps

1. **Copy the project** to another laptop
2. **Run start script** (start.bat or start.sh)
3. **Access frontend** at http://localhost:5173
4. **Start using the application**

No manual configuration needed for same-network setup!

---

**Created**: December 9, 2025  
**Status**: Ready for multi-laptop deployment ✅

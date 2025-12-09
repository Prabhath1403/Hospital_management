# Wednesday - Healthcare Management System

## Setup & Deployment Guide

### Prerequisites

- Docker Desktop installed and running
- Docker Compose (comes with Docker Desktop)
- Git (for cloning the repository)
- 8GB+ RAM available for Docker
- Ports available: 5173, 8000, 5432, 6379, 5672, 9001, 15672

---

## Quick Start (Same Laptop)

### 1. Clone/Copy the Repository

```bash
git clone <repository-url>
cd wednesday
```

### 2. Navigate to Infrastructure

```bash
cd infra
```

### 3. Start All Services

```bash
docker-compose up -d
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **RabbitMQ Dashboard**: http://localhost:15672 (guest/guest)

---

## Setup on Another Laptop

### Step 1: Prepare the Project

1. **Copy the entire `wednesday` folder** to the new laptop
2. **Ensure all `.env` files are included**:
   - `infra/.env`
   - `backend/.env`
   - `frontend/.env`

### Step 2: Install Docker

- Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Launch Docker Desktop and wait for it to start (2-3 minutes)

### Step 3: Configure for the New Environment

If you need to change API URLs (e.g., running on a different IP):

#### Option A: Using Docker Compose (Recommended - No Changes Needed)

```bash
cd wednesday/infra
docker-compose up -d
```

This uses the default localhost configuration.

#### Option B: Custom Configuration for Network Access

If accessing from another machine on the same network:

**Update `infra/.env`:**

```env
VITE_API_URL=http://192.168.1.100:8000  # Replace with server IP
VITE_WS_URL=ws://192.168.1.100:9001
```

**Then run:**

```bash
docker-compose up -d
```

### Step 4: Verify Services

```bash
# Check if all containers are running
docker ps

# View logs (if needed)
docker logs infra-backend-1
docker logs infra-frontend-1
```

### Step 5: Access the Application

- **Frontend**: http://localhost:5173 (or http://server-ip:5173)
- **Backend API**: http://localhost:8000 (or http://server-ip:8000)

---

## Environment Variables Explained

### Backend Configuration (`backend/.env`)

```env
# Database connection string
DATABASE_URL=postgresql+asyncpg://app:app@postgres:5432/health

# Message broker for async tasks
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_BACKEND_URL=redis://redis:6379/0

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend Configuration (`frontend/.env`)

```env
# Backend API endpoint
VITE_API_URL=http://localhost:8000

# WebSocket for real-time updates
VITE_WS_URL=ws://localhost:9001
```

### Compose Configuration (`infra/.env`)

Controls ports and database credentials for all services.

---

## Common Issues & Solutions

### Issue 1: Port Already in Use

**Error**: `bind: address already in use`

**Solution**: Change ports in `infra/.env`

```env
FRONTEND_PORT=5174        # Changed from 5173
BACKEND_PORT=8001         # Changed from 8000
POSTGRES_PORT=5433        # Changed from 5432
```

### Issue 2: Docker Not Running

**Error**: `Cannot connect to Docker daemon`

**Solution**:

- Start Docker Desktop
- Wait 2-3 minutes for it to fully load

### Issue 3: Database Connection Error

**Error**: `could not connect to server: Connection refused`

**Solution**:

- Wait 30 seconds after starting (database needs time to initialize)
- Check: `docker logs infra-postgres-1`

### Issue 4: Frontend Can't Connect to Backend

**Error**: Network requests fail from frontend

**Solution**:

- Update `infra/.env` with correct server IP:
  ```env
  VITE_API_URL=http://YOUR_SERVER_IP:8000
  ```
- Restart frontend: `docker-compose restart frontend`

---

## Database Backup & Restore

### Backup Database

```bash
docker exec infra-postgres-1 pg_dump -U app health > backup.sql
```

### Restore Database

```bash
docker exec -i infra-postgres-1 psql -U app health < backup.sql
```

---

## Useful Docker Commands

```bash
# View all running containers
docker ps

# View logs
docker logs infra-backend-1
docker logs infra-frontend-1

# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v

# Restart a specific service
docker-compose restart backend

# Build and start
docker-compose up -d --build

# View service status
docker-compose ps
```

---

## Performance Optimization

### For Slow Systems

Reduce memory usage by stopping the realtime service:

**Update `infra/compose.yaml`**:

```yaml
realtime:
  # Comment out this service if not needed
  # build: ../realtime
```

---

## Production Deployment

### Before Going Live:

1. **Change SECRET_KEY** in `backend/.env`:

   ```env
   SECRET_KEY=generate-a-strong-random-key-here
   ```

2. **Use strong database password** in `infra/.env`:

   ```env
   POSTGRES_PASSWORD=your-strong-password-here
   ```

3. **Set ENVIRONMENT** in `backend/.env`:

   ```env
   ENVIRONMENT=production
   ```

4. **Use external database** (optional):
   ```env
   DATABASE_URL=postgresql+asyncpg://user:pass@external-db-host:5432/health
   ```

---

## Support & Troubleshooting

For issues:

1. Check logs: `docker logs <container-name>`
2. Verify `.env` files are present and configured
3. Ensure Docker has sufficient resources
4. Check firewall settings if accessing from another machine

---

## File Structure

```
wednesday/
├── backend/
│   ├── .env              # Backend configuration (DO NOT SHARE SECRET_KEY!)
│   ├── .env.example      # Template for backend .env
│   ├── main.py
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── .env              # Frontend configuration
│   ├── .env.example      # Template for frontend .env
│   ├── package.json
│   └── ...
├── infra/
│   ├── compose.yaml      # Docker Compose configuration
│   ├── .env              # Compose environment variables
│   └── .env.example      # Template for .env
└── README.md             # This file
```

---

**Last Updated**: December 9, 2025

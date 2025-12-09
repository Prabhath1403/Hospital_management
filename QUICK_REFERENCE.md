# ⚡ Quick Reference - Wednesday Setup

## 📦 What's Configured

| Component    | File            | Default            | Customizable       |
| ------------ | --------------- | ------------------ | ------------------ |
| Database     | `backend/.env`  | PostgreSQL @ :5432 | ✅ Yes             |
| Cache        | `backend/.env`  | Redis @ :6379      | ✅ Yes             |
| Frontend API | `frontend/.env` | localhost:8000     | ✅ Yes             |
| Ports        | `infra/.env`    | 5173, 8000, etc    | ✅ Yes             |
| Security     | `backend/.env`  | Demo key           | ⚠️ Change for prod |

---

## 🚀 Quick Start (3 Steps)

### Windows

```batch
cd wednesday
start.bat
```

### Linux/Mac

```bash
cd wednesday && ./start.sh
```

### Manual

```bash
cd wednesday/infra
docker-compose up -d
```

**Wait 30 seconds → Access http://localhost:5173**

---

## 📍 Access Points

| Service     | URL                        | Credentials |
| ----------- | -------------------------- | ----------- |
| Frontend    | http://localhost:5173      | None        |
| Backend API | http://localhost:8000      | Token-based |
| API Docs    | http://localhost:8000/docs | None        |
| DB Admin    | pgAdmin (setup optional)   | app/app     |
| RabbitMQ    | http://localhost:15672     | guest/guest |

---

## 🔧 Common Edits

### Change Ports

Edit `infra/.env`:

```env
FRONTEND_PORT=5174
BACKEND_PORT=8001
```

### Change Database Password

Edit `infra/.env`:

```env
POSTGRES_PASSWORD=MySecurePassword123
```

### Access from Different IP

Edit `infra/.env`:

```env
VITE_API_URL=http://192.168.1.100:8000
VITE_WS_URL=ws://192.168.1.100:9001
```

---

## ⚙️ Docker Commands

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# Restart a service
docker-compose restart backend

# View logs
docker logs infra-backend-1

# See all containers
docker ps
```

---

## ✅ Checklist Before Sharing

- [ ] Copy entire `wednesday` folder
- [ ] Verify `.env` files are included
- [ ] Don't share `.env` with production secrets
- [ ] Docker Desktop installed on recipient's laptop
- [ ] Both laptops on same network (optional, for network access)

---

## 🆘 If Something Breaks

### Services Won't Start

```bash
# Check Docker is running
docker ps

# View error logs
docker logs infra-backend-1
docker logs infra-frontend-1
```

### Port Already in Use

Edit `infra/.env` and change ports

### Database Connection Failed

```bash
# Wait 30 seconds after docker-compose up
# Then restart
docker-compose restart backend
```

### Frontend Can't Call Backend

1. Check `VITE_API_URL` in `frontend/.env`
2. Verify backend is running: `docker ps`
3. Restart frontend: `docker-compose restart frontend`

---

## 📚 Full Documentation

See `SETUP_GUIDE.md` for complete setup instructions

---

**Status**: Ready for multi-laptop deployment ✅

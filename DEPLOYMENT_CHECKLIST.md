# ✅ DEPLOYMENT CHECKLIST

## Before Sharing with Team

### Configuration Files

- [ ] `backend/.env` exists
- [ ] `backend/.env.example` exists
- [ ] `frontend/.env` exists
- [ ] `frontend/.env.example` exists
- [ ] `infra/.env` exists
- [ ] `infra/.env.example` exists
- [ ] `infra/compose.yaml` uses environment variables

### Documentation

- [ ] `SETUP_GUIDE.md` is present
- [ ] `DEPLOYMENT_CONFIG.md` is present
- [ ] `QUICK_REFERENCE.md` is present
- [ ] `CONFIG_COMPLETE.md` is present
- [ ] `DEPLOYMENT_READY.md` is present

### Scripts

- [ ] `start.bat` is present
- [ ] `start.sh` is present
- [ ] `start.sh` is executable (Linux/Mac)

### Verification

- [ ] All Docker services running (`docker ps`)
- [ ] Backend health check passes
- [ ] Frontend accessible at http://localhost:5173
- [ ] API accessible at http://localhost:8000
- [ ] Database connected
- [ ] No errors in logs

---

## Before Deploying to Another Laptop

### Preparation

- [ ] Copy entire `wednesday` folder
- [ ] Verify all `.env` files are included
- [ ] Recipient has Docker Desktop installed
- [ ] Recipient has 8GB+ RAM available
- [ ] Required ports are available (5173, 8000, 5432, 6379, 5672, 9001)

### Customization (if needed)

- [ ] Edit `infra/.env` for different ports (if needed)
- [ ] Edit `infra/.env` for different IP/hostname (if needed)
- [ ] Update `VITE_API_URL` in `frontend/.env` (if needed)

### Deployment

- [ ] Run `start.bat` (Windows) or `./start.sh` (Linux/Mac)
- [ ] Wait 30 seconds for services to initialize
- [ ] Access http://localhost:5173
- [ ] Verify all services are healthy: `docker ps`

---

## Before Production Deployment

### Security

- [ ] Generate new `SECRET_KEY` in `backend/.env`
- [ ] Change `POSTGRES_PASSWORD` to strong password
- [ ] Set `ENVIRONMENT=production` in `backend/.env`
- [ ] Enable HTTPS/SSL for API
- [ ] Configure firewall rules
- [ ] Review and update all credentials

### Configuration

- [ ] Update `VITE_API_URL` to production domain
- [ ] Update `VITE_WS_URL` to production domain
- [ ] Configure external database (optional)
- [ ] Configure external Redis (optional)
- [ ] Set up backup strategy
- [ ] Configure monitoring/logging

### Testing

- [ ] Test frontend connectivity to backend
- [ ] Test WebSocket real-time updates
- [ ] Test API endpoints
- [ ] Test database connectivity
- [ ] Test file uploads
- [ ] Test authentication

### Documentation

- [ ] Update IP/domain in documentation
- [ ] Document any custom configuration
- [ ] Document backup procedures
- [ ] Document troubleshooting steps

---

## Ongoing Maintenance

### Daily

- [ ] Monitor container health: `docker ps`
- [ ] Check logs for errors: `docker logs infra-backend-1`
- [ ] Verify services responding normally

### Weekly

- [ ] Review logs for issues
- [ ] Backup database (if production)
- [ ] Check disk space usage
- [ ] Verify backups are complete

### Monthly

- [ ] Update Docker images (if applicable)
- [ ] Review security updates
- [ ] Update dependencies (if needed)
- [ ] Test disaster recovery

---

## Common Commands

### Status Check

```bash
docker ps                           # See all running containers
docker logs infra-backend-1        # View backend logs
docker logs infra-frontend-1       # View frontend logs
```

### Start/Stop

```bash
docker-compose up -d               # Start all services
docker-compose down                # Stop all services
docker-compose restart             # Restart all services
docker-compose restart backend     # Restart specific service
```

### Troubleshooting

```bash
docker-compose ps                  # Detailed service status
docker logs -f infra-backend-1     # Follow backend logs
docker exec infra-postgres-1 psql -U app health  # Connect to DB
```

---

## Troubleshooting Guide

### Services Won't Start

- [ ] Check Docker is running: `docker ps`
- [ ] Check logs: `docker logs infra-backend-1`
- [ ] Check disk space: `docker system df`
- [ ] Restart Docker Desktop

### Port Already in Use

- [ ] Change port in `infra/.env`
- [ ] Find process using port: `netstat -ano | findstr :8000`
- [ ] Kill process if not needed

### Database Connection Failed

- [ ] Wait 30 seconds after startup
- [ ] Check database logs: `docker logs infra-postgres-1`
- [ ] Verify `DATABASE_URL` in `backend/.env`
- [ ] Check disk space for database

### Frontend Can't Connect to Backend

- [ ] Check `VITE_API_URL` in `frontend/.env`
- [ ] Verify backend is running: `docker ps`
- [ ] Check backend logs
- [ ] Restart frontend: `docker-compose restart frontend`

### Performance Issues

- [ ] Check system resources (RAM, CPU, Disk)
- [ ] Stop unused containers
- [ ] Check Docker logs
- [ ] Increase Docker resource limits

---

## File Locations Quick Reference

```
wednesday/
├── backend/
│   ├── .env                       ← Backend secrets
│   ├── .env.example               ← Template
│   └── main.py                    ← Entry point
├── frontend/
│   ├── .env                       ← Frontend config
│   ├── .env.example               ← Template
│   └── package.json
├── infra/
│   ├── .env                       ← Docker config
│   ├── .env.example               ← Template
│   └── compose.yaml               ← Docker compose
├── SETUP_GUIDE.md                 ← Setup instructions
├── DEPLOYMENT_CONFIG.md           ← Configuration guide
├── QUICK_REFERENCE.md             ← Command reference
├── CONFIG_COMPLETE.md             ← Summary
├── DEPLOYMENT_READY.md            ← Ready status
├── DEPLOYMENT_CHECKLIST.md        ← This file
├── start.bat                      ← Windows quick start
└── start.sh                       ← Linux/Mac quick start
```

---

## Sign-Off

- [ ] All configuration complete
- [ ] All services tested and working
- [ ] All documentation updated
- [ ] Ready for team deployment
- [ ] Ready for production (after security updates)

**Deployment Status**: ✅ READY

**Date**: December 9, 2025  
**Configuration Version**: 1.0  
**System Version**: 1.0

---

**Next Action**: Copy the folder and share with your team! 🚀

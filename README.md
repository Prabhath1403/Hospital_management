# Hospital Management System

Full-stack hospital management platform with:

- **Frontend**: React + Vite
- **Backend API**: FastAPI
- **Worker**: Celery
- **Realtime**: WebSocket service
- **Infrastructure**: PostgreSQL, Redis, RabbitMQ

All services run through Docker using the root `docker-compose.yml`.

## Prerequisites

- Docker (with Docker Compose support)
- `curl` (used by `start.sh` health check)

## Quick Start (new laptop friendly)

```bash
chmod +x start.sh
./start.sh up
```

What this does:

1. Creates `.env` from `.env.example` (if missing)
2. Builds and starts all containers
3. Waits for backend health endpoint to become ready

## Service URLs

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- RabbitMQ UI: `http://localhost:15672` (guest/guest)
- Realtime WS: `ws://localhost:9001`

## Startup Script Commands

```bash
./start.sh up
./start.sh down
./start.sh restart
./start.sh status
./start.sh logs
./start.sh logs backend
```

## Environment Configuration

- Template: `.env.example`
- Active local config: `.env` (ignored by git)

Update `.env` before startup if you need custom ports, DB credentials, or API keys (`GEMINI_API_KEY`, `GROQ_API_KEY`).

## Direct Docker Compose Commands (optional)

```bash
docker compose up -d --build
docker compose down
docker compose ps
docker compose logs -f backend
```

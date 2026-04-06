#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Install Docker and try again."
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DC=(docker-compose)
else
  echo "Docker Compose is not available. Install Docker Compose and try again."
  exit 1
fi

ACTION="${1:-up}"

ensure_env_file() {
  if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
  fi
}

load_env() {
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
}

wait_for_backend() {
  local health_url="http://localhost:${BACKEND_PORT:-8000}/health"
  echo "Waiting for backend at ${health_url} ..."
  for _ in $(seq 1 60); do
    if curl --silent --fail "$health_url" >/dev/null; then
      echo "Backend is ready."
      return 0
    fi
    sleep 2
  done
  echo "Backend did not become ready in time."
  echo "Check logs with: ${DC[*]} logs backend"
  return 1
}

print_endpoints() {
  echo ""
  echo "Services are up:"
  echo "Frontend : http://localhost:${FRONTEND_PORT:-8080}"
  echo "Backend  : http://localhost:${BACKEND_PORT:-8000}"
  echo "API Docs : http://localhost:${BACKEND_PORT:-8000}/docs"
  echo "Realtime : ws://localhost:${REALTIME_PORT:-9001}"
  echo "RabbitMQ : http://localhost:${RABBITMQ_MANAGEMENT_PORT:-15672} (guest/guest)"
  echo ""
  echo "Useful commands:"
  echo "./start.sh down"
  echo "./start.sh restart"
  echo "./start.sh logs [service]"
  echo "./start.sh status"
}

case "$ACTION" in
  up)
    ensure_env_file
    load_env
    "${DC[@]}" up -d --build
    wait_for_backend
    print_endpoints
    ;;
  down)
    "${DC[@]}" down
    ;;
  restart)
    ensure_env_file
    load_env
    "${DC[@]}" down
    "${DC[@]}" up -d --build
    wait_for_backend
    print_endpoints
    ;;
  logs)
    "${DC[@]}" logs -f "${2:-}"
    ;;
  status)
    "${DC[@]}" ps
    ;;
  *)
    echo "Usage: $0 [up|down|restart|logs|status]"
    exit 1
    ;;
esac

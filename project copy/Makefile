.PHONY: build up down logs clean restart help dev-nginx dev-game dev

# Standardbefehl
default: help

# Docker-Container bauen
build:
	docker-compose build

# Nur Nginx starten
up:
	docker-compose up -d

# Container stoppen
down:
	docker-compose down

# Logs anzeigen
logs:
	docker-compose logs -f

# Container neustarten
restart: down up

# Container und Images aufräumen
clean:
	docker-compose down --rmi all --volumes --remove-orphans
	-pkill -f "uvicorn pong_game:app" 2>/dev/null || true

# Nur das Python-Backend starten
dev-game:
	cd game && python3 -m uvicorn pong_game:app --host 0.0.0.0 --port 8000 --reload &

# Alles zusammen starten
dev:
	@echo "Starting both Nginx and Python backend..."
	@make clean
	@make dev-game
	@sleep 2
	@make build
	@make up
	@make logs

# Hilfe anzeigen
help:
	@echo "Verfügbare Befehle:"
	@echo "  make build     - Docker-Container bauen"
	@echo "  make up        - Container starten"
	@echo "  make down      - Container stoppen"
	@echo "  make logs      - Logs anzeigen"
	@echo "  make restart   - Container neustarten"
	@echo "  make clean     - Alles aufräumen"
	@echo "  make dev       - Komplette Entwicklungsumgebung starten"
	@echo "  make dev-game  - Nur Python Backend starten"
	@echo "  make help      - Diese Hilfe anzeigen" 
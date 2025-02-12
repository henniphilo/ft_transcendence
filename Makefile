DC = docker-compose

.PHONY: all build up down logs migrations migrate test fclean

# Default-Ziel: bei "make" wird alles gestartet und migrations und migrate ist im dockefile!
all: setup build up

setup:
	chmod +x utils/setup.sh && ./utils/setup.sh

build:
	$(DC) build

up:
	$(DC) up -d --remove-orphans

down:
	$(DC) down

stop:
	$(DC) stop

start:
	$(DC) start

logs:
	$(DC) logs -f

migrations:
	$(DC) exec backend python manage.py makemigrations

migrate:
	$(DC) exec backend python manage.py migrate

test:
	$(DC) exec backend sh -c "python manage.py flush --no-input && python helper_scripts/test_auth.py"

testuser:
	$(DC) exec backend sh -c "python manage.py shell < helper_scripts/create_testuser.py"

test15:
	$(DC) exec backend sh -c "python manage.py shell < helper_scripts/create_fifteen_testusers.py"

clean:
	./utils/cleanup.sh

# Wirklich alles löschen: Container, Images, Volumes, Netzwerke
fclean:
	$(DC) down --rmi all --volumes --remove-orphans
	docker system prune -af
	./utils/forcecleanup.sh

# Individual container logs
logs-backend:
	docker logs -f ft_transcendence_backend

logs-grafana:
	docker logs -f grafana

logs-nginx:
	docker logs -f ft_transcendence_nginx
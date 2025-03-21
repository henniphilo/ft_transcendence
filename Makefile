DC=docker-compose
COMPOSE_PROFILES=gameprofile,grafanaprofile,elkprofile 

.PHONY: all build up down logs migrations migrate test fclean

# Default-Ziel: bei "make" wird alles gestartet und migrations und migrate ist im dockefile!
all: build up

build:
	COMPOSE_PROFILES=$(COMPOSE_PROFILES) $(DC) build

up:
	COMPOSE_PROFILES=$(COMPOSE_PROFILES) $(DC) up -d --remove-orphans

rebuild:
	COMPOSE_PROFILES=$(COMPOSE_PROFILES) $(DC) up -d --build --remove-orphans

down:
	COMPOSE_PROFILES=$(COMPOSE_PROFILES) $(DC) down

stop:
	COMPOSE_PROFILES=$(COMPOSE_PROFILES) $(DC) stop

start:
	COMPOSE_PROFILES=$(COMPOSE_PROFILES) $(DC) start

logs:
	$(DC) logs -f

migrations:
	$(DC) exec backend python manage.py makemigrations

migrate:
	$(DC) exec backend python manage.py migrate

test:
	COMPOSE_PROFILES=$(COMPOSE_PROFILES) $(DC) exec backend sh -c "python manage.py flush --no-input && python helper_scripts/test_auth.py"

testuser:
	COMPOSE_PROFILES=$(COMPOSE_PROFILES) $(DC) exec backend sh -c "python manage.py shell < helper_scripts/create_testuser.py"

test15:
	COMPOSE_PROFILES=$(COMPOSE_PROFILES) $(DC) exec backend sh -c "python manage.py shell < helper_scripts/create_fifteen_testusers.py"

test16:
	COMPOSE_PROFILES=$(COMPOSE_PROFILES) $(DC) exec backend sh -c "python manage.py shell < helper_scripts/create_testusers_and_friends.py"

clean:
	./utils/cleanup.sh

# Wirklich alles löschen: Container, Images, Volumes, Netzwerke
fclean:
	COMPOSE_PROFILES=$(COMPOSE_PROFILES) $(DC) down --rmi all --volumes --remove-orphans
	docker system prune -af
	./utils/forcecleanup.sh

# Individual container logs
logs-backend:
	docker logs -f ft_transcendence-backend-1

logs-grafana:
	docker logs -f ft_transcendence-grafana-1

logs-nginx:
	docker logs -f ft_transcendence-nginx

animate-game:
	docker cp ft_transcendence-game-1:/app/game.log ./game.log
	python3 utils/animate_game.py

.PHONY: all build up down logs migrations migrate test fclean bake tunnel kube kube-down kube-stop kube-start kube-status help testuser test15 test16 rebuild start stop clean logs-backend logs-grafana logs-nginx animate-game bake-all

DC=docker compose
# COMPOSE_PROFILES=gameprofile, tunnelprofile, grafanaprofile,elkprofile, tunnelprofile
COMPOSE_PROFILES=gameprofile,tunnelprofile

#######################################
# these are for Kubernetes   		  #
#######################################

# Generate Kubernetes manifests from docker-compose
kube-convert:
	kompose convert --build local --profile gameprofile

kube: bake tunnel
	kubectl apply -f '*.yaml'    

# This deletes the Kubernetes resources, not the files
kube-clean:
	kubectl delete -f '*.yaml'  

kube-stop:
	kubectl scale deployment --all --replicas=0

kube-start:
	kubectl scale deployment --all --replicas=1

kube-status:
	kubectl get pods,services,pvc

kube-logs:
	kubectl logs -f deployment/backend

#######################################
# Docker Buildx Bake targets          #
# Since I use it for the kubernetes   #
# deployment I split into just the    #
# gameprofile and the just tunnel     #
#######################################
bake-all: bake tunnel

bake:
	docker buildx bake gameprofile --load

tunnel:
	COMPOSE_PROFILES=tunnelprofile $(DC) up -d --build cloudflared

#######################################
# Traditional Docker Compose commands #
#######################################

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
	docker cp game:/app/game.log ./game.log
	python3 utils/animate_game.py

help:
	@echo "Docker Compose commands:"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make logs       - Show logs"
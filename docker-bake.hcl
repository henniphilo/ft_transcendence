variable "REGISTRY" {
  default = ""
}

variable "TAG" {
  default = "latest"
}

group "gameprofile" {
  targets = ["backend", "game", "caddy", "redis", "postgres"]
}


group "all" {
  targets = ["backend", "game", "caddy", "redis", "postgres"]
}


# Backend service
target "backend" {
  context = "./src/ft_transcendence_backend"
  dockerfile = "Dockerfile"
  tags = ["${REGISTRY}backend:${TAG}"]
  platforms = ["linux/amd64", "linux/arm64"]
}

# Game service
target "game" {
  context = "./src/ft_transcendence_backend/game"
  dockerfile = "Dockerfile"
  tags = ["${REGISTRY}game:${TAG}"]
  platforms = ["linux/amd64", "linux/arm64"]
}

# Caddy reverse proxy
target "caddy" {
  context = "./src"
  dockerfile = "caddy/Dockerfile"
  tags = ["${REGISTRY}caddy:${TAG}"]
  platforms = ["linux/amd64", "linux/arm64"]
}

# Redis service
target "redis" {
  context = "./src/redis"
  dockerfile = "Dockerfile"
  tags = ["${REGISTRY}redis:${TAG}"]
  platforms = ["linux/amd64", "linux/arm64"]
}

# Postgres service
target "postgres" {
  context = "./src/postgres"
  dockerfile = "Dockerfile"
  tags = ["${REGISTRY}postgres:${TAG}"]
  platforms = ["linux/amd64", "linux/arm64"]
}

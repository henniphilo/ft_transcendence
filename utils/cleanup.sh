#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# List all containers, including those that have exited
echo "Listing all containers, including those that have exited:"
docker ps -a

# Remove all stopped containers
echo "Removing all stopped containers..."
docker container prune -f

# Remove all unused volumes
echo "Removing all unused volumes..."
docker volume prune -f

# Remove all unused networks
echo "Removing all unused networks..."
docker network prune -f

# Remove all unused data
echo "Removing all unused data..."
docker system prune -a -f

# Remove all unused images
echo "Removing all unused images..."
docker image prune -a -f

# List all containers again to verify cleanup
echo "Listing all containers after cleanup:"
docker ps -a
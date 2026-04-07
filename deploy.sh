#!/bin/bash

if docker compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker compose"
elif docker-compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker-compose"
else
    echo "❌ Error: Docker Compose is not installed."
    exit 1
fi

if [[ ! -f "docker-compose.yml" && ! -f "docker-compose.yaml" ]]; then
    echo "❌ Error: No docker-compose.yml found in $(pwd)"
    echo "Try: cd /path/to/your/project"
    exit 1
fi

echo "🚀 Running: $DOCKER_CMD up -d --build"
$DOCKER_CMD up -d --build --remove-orphans

echo "🧹 Pruning old layers..."
docker image prune -f
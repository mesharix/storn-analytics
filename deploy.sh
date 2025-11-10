#!/bin/bash

# Storn Analytics Deployment Script for mshdata.com
# Author: Msh (hi@msh.sa)

set -e

echo "🚀 Starting Storn Analytics Deployment to mshdata.com..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="storn-analytics"
REMOTE_USER=${REMOTE_USER:-"root"}
REMOTE_HOST=${REMOTE_HOST:-"mshdata.com"}
REMOTE_PATH=${REMOTE_PATH:-"/var/www/storn-analytics"}
CONTAINER_NAME="storn-analytics"

echo -e "${YELLOW}📦 Building Docker image locally...${NC}"
docker build -t ${PROJECT_NAME}:latest .

echo -e "${YELLOW}💾 Saving Docker image...${NC}"
docker save ${PROJECT_NAME}:latest | gzip > ${PROJECT_NAME}.tar.gz

echo -e "${YELLOW}📤 Uploading to server...${NC}"
scp ${PROJECT_NAME}.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/
scp docker-compose.production.yml ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/docker-compose.yml
scp .env.production ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/.env.production

echo -e "${YELLOW}🔧 Deploying on server...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd ${REMOTE_PATH}

# Load the Docker image
echo "Loading Docker image..."
docker load < ${PROJECT_NAME}.tar.gz

# Stop and remove old container
echo "Stopping old container..."
docker-compose -f docker-compose.yml down || true

# Start new container
echo "Starting new container..."
docker-compose -f docker-compose.yml up -d

# Clean up
echo "Cleaning up..."
rm ${PROJECT_NAME}.tar.gz

# Show logs
echo "Container status:"
docker-compose -f docker-compose.yml ps

echo "Recent logs:"
docker-compose -f docker-compose.yml logs --tail=50
ENDSSH

# Clean up local files
echo -e "${YELLOW}🧹 Cleaning up local files...${NC}"
rm ${PROJECT_NAME}.tar.gz

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application should be available at: https://mshdata.com${NC}"
echo -e "${YELLOW}📝 To view logs: ssh ${REMOTE_USER}@${REMOTE_HOST} 'cd ${REMOTE_PATH} && docker-compose logs -f'${NC}"

#!/bin/bash

# Update ECS service desired count
# Usage: ./update-ecs-count.sh [dev|qa|prod] [count]

set -e

ENVIRONMENT=${1:-dev}
DESIRED_COUNT=${2:-1}
AWS_REGION=${AWS_REGION:-us-east-1}

echo "🔄 Updating ECS service desired count to $DESIRED_COUNT for $ENVIRONMENT..."

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|qa|prod)$ ]]; then
  echo "❌ Error: Environment must be dev, qa, or prod"
  exit 1
fi

# ECS cluster and service names
ECS_CLUSTER="shortlist-$ENVIRONMENT-cluster"
ECS_SERVICE="shortlist-$ENVIRONMENT-service"

# Update service desired count
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --desired-count $DESIRED_COUNT \
  --region $AWS_REGION

echo "✅ ECS service updated to desired count: $DESIRED_COUNT"
echo "🕐 Waiting for service to stabilize..."

# Wait for service to become stable
aws ecs wait services-stable \
  --cluster $ECS_CLUSTER \
  --services $ECS_SERVICE \
  --region $AWS_REGION

echo "✅ Service is now stable with $DESIRED_COUNT tasks running!"

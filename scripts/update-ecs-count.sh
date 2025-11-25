#!/bin/bash

# Update ECS service desired count
# Usage: ./update-ecs-count.sh [dev|qa|prod] [count]

set -euo pipefail

# Ensure required commands are available
check_prereqs() {
  for cmd in aws npm; do
    if ! command -v $cmd >/dev/null 2>&1; then
      echo "❌ Error: $cmd is not installed. Please install it before proceeding."
      exit 1
    fi
  done
}

check_prereqs

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
# Get current desired count
CURRENT_COUNT=$(aws ecs describe-services \
  --cluster "$ECS_CLUSTER" \
  --services "$ECS_SERVICE" \
  --region "$AWS_REGION" \
  --query "services[0].desiredCount" \
  --output text)

if [ "$CURRENT_COUNT" -eq "$DESIRED_COUNT" ]; then
  echo "✅ Desired count already $DESIRED_COUNT, no update needed."
else
  aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service "$ECS_SERVICE" \
    --desired-count "$DESIRED_COUNT" \
    --region "$AWS_REGION"
fi

echo "✅ ECS service updated to desired count: $DESIRED_COUNT"
echo "🕐 Waiting for service to stabilize..."

# Wait for service to become stable
# Wait for service to become stable only if we performed an update
if [ "$CURRENT_COUNT" -ne "$DESIRED_COUNT" ]; then
  aws ecs wait services-stable \
    --cluster "$ECS_CLUSTER" \
    --services "$ECS_SERVICE" \
    --region "$AWS_REGION"
fi

echo "✅ Service is now stable with $DESIRED_COUNT tasks running!"

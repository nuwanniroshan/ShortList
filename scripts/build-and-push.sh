#!/bin/bash

# Build and push Docker image to ECR
# Usage: ./build-and-push.sh [dev|qa|prod]

set -euo pipefail

# Ensure required commands are available
check_prereqs() {
  for cmd in aws npm docker; do
    if ! command -v $cmd >/dev/null 2>&1; then
      echo "❌ Error: $cmd is not installed. Please install it before proceeding."
      exit 1
    fi
  done
}

check_prereqs

ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}

echo "🐳 Building and pushing Docker image for $ENVIRONMENT..."

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|qa|prod)$ ]]; then
  echo "❌ Error: Environment must be dev, qa, or prod"
  exit 1
fi

# ECR repository name
ECR_REPO="shortlist-backend-$ENVIRONMENT"
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"

# Ensure ECR repository exists
if ! aws ecr describe-repositories --repository-names "$ECR_REPO" --region "$AWS_REGION" >/dev/null 2>&1; then
  echo "📦 Creating ECR repository $ECR_REPO..."
  aws ecr create-repository --repository-name "$ECR_REPO" --region "$AWS_REGION"
fi

echo "📦 Repository: $ECR_URI"

# Login to ECR
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Change to backend directory
cd "$(dirname "$0")/../backend"

# Build Docker image
echo "🔨 Building Docker image..."
docker build --platform linux/amd64 -t $ECR_REPO:latest -t $ECR_REPO:$(git rev-parse --short HEAD) .

# Tag image for ECR
docker tag $ECR_REPO:latest $ECR_URI:latest
docker tag $ECR_REPO:$(git rev-parse --short HEAD) $ECR_URI:$(git rev-parse --short HEAD)

# Push to ECR
echo "⬆️  Pushing to ECR..."
docker push $ECR_URI:latest
docker push $ECR_URI:$(git rev-parse --short HEAD)

# Force ECS service update
echo "🔄 Updating ECS service..."
ECS_CLUSTER="shortlist-$ENVIRONMENT-cluster"
ECS_SERVICE="shortlist-$ENVIRONMENT-service"

aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --force-new-deployment \
  --region $AWS_REGION

echo "✅ Docker image pushed and ECS service updated!"
echo "🕐 Waiting for deployment to complete (this may take a few minutes)..."
echo "   You can monitor the deployment in the AWS Console or run:"
echo "   aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION"

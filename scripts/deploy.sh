#!/bin/bash

# Manual deployment script for CDK infrastructure
# Usage: ./deploy.sh [dev|qa|prod]

set -euo pipefail

# Function to check required commands
check_prereqs() {
  for cmd in aws npm npx; do
    if ! command -v $cmd >/dev/null 2>&1; then
      echo "❌ Error: $cmd is not installed. Please install it before proceeding."
      exit 1
    fi
  done
}

check_prereqs

ENVIRONMENT=${1:-dev}

echo "🚀 Deploying to $ENVIRONMENT environment..."

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|qa|prod)$ ]]; then
  echo "❌ Error: Environment must be dev, qa, or prod"
  exit 1
fi

# Change to infrastructure directory
cd "$(dirname "$0")/../infrastructure"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing CDK dependencies..."
  npm install
fi

# Build TypeScript
echo "🔨 Building CDK project..."
npm run build

# Determine stack name
case $ENVIRONMENT in
  dev)
    STACK_NAME="DevStack"
    ;;
  qa)
    STACK_NAME="QaStack"
    ;;
  prod)
    STACK_NAME="ProdStack"
    ;;
esac

# Synthesize CloudFormation template
echo "🔍 Synthesizing CloudFormation template..."
npx cdk synth $STACK_NAME

# Deploy stack
echo "☁️  Deploying $STACK_NAME..."
npx cdk deploy $STACK_NAME --require-approval never

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Build and push Docker image: ./scripts/build-and-push.sh $ENVIRONMENT"
echo "2. Deploy frontend: ./scripts/deploy-frontend.sh $ENVIRONMENT"

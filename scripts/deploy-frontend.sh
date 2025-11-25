#!/bin/bash

# Deploy frontend to S3
# Usage: ./deploy-frontend.sh [dev|qa|prod] [ALB_URL]

set -euo pipefail

# Ensure temporary env file is removed on exit
trap "rm -f .env.production" EXIT

ENVIRONMENT=${1:-dev}
ALB_URL=$2
AWS_REGION=${AWS_REGION:-us-east-1}

echo "🌐 Deploying frontend for $ENVIRONMENT..."

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|qa|prod)$ ]]; then
  echo "❌ Error: Environment must be dev, qa, or prod"
  exit 1
fi

# Get ALB URL from CloudFormation if not provided
if [ -z "$ALB_URL" ]; then
  echo "🔍 Fetching ALB URL from CloudFormation..."
  # Capitalize first letter of environment for stack name
  ENV_CAPITALIZED=$(echo $ENVIRONMENT | awk '{print toupper(substr($0,1,1))substr($0,2)}')
  STACK_NAME="Shortlist${ENV_CAPITALIZED}Stack"
  ALB_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query "Stacks[0].Outputs[?contains(OutputKey,'EcsAlbUrl')].OutputValue" \
    --output text \
    --region $AWS_REGION)
  
  if [ -z "$ALB_URL" ]; then
    echo "❌ Error: Could not retrieve ALB URL from stack $STACK_NAME"
    echo "   Please provide ALB URL as second argument: ./deploy-frontend.sh $ENVIRONMENT <ALB_URL>"
    exit 1
  fi
fi

echo "📝 Backend URL: $ALB_URL"

# Change to frontend directory
cd "$(dirname "$0")/../frontend"

# Create production environment file
echo "⚙️  Creating production environment configuration..."
cat > .env.production << EOF
VITE_API_URL=$ALB_URL
EOF

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
fi

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Get S3 bucket name from CloudFormation
echo "🔍 Fetching S3 bucket name..."
# Use the same capitalized environment name
ENV_CAPITALIZED=$(echo $ENVIRONMENT | awk '{print toupper(substr($0,1,1))substr($0,2)}')
STACK_NAME="Shortlist${ENV_CAPITALIZED}Stack"
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs[?contains(OutputKey,'FrontendBucketName')].OutputValue" \
  --output text \
  --region $AWS_REGION)

if [ -z "$BUCKET_NAME" ]; then
  echo "❌ Error: Could not retrieve S3 bucket name from stack $STACK_NAME"
  exit 1
fi

echo "📦 Bucket: $BUCKET_NAME"

# Upload to S3
echo "⬆️  Uploading to S3..."
max_attempts=2
attempt=1
while true; do
  if aws s3 sync dist/ s3://$BUCKET_NAME --delete --region $AWS_REGION; then
    break
  fi
  if [ $attempt -ge $max_attempts ]; then
    echo "❌ S3 sync failed after $max_attempts attempts."
    exit 1
  fi
  echo "⚠️  Retry S3 sync (attempt $((attempt+1)))..."
  attempt=$((attempt+1))
done

# Invalidate CloudFront cache for prod
if [ "$ENVIRONMENT" == "prod" ]; then
  echo "🔄 Invalidating CloudFront cache..."
  DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query "Stacks[0].Outputs[?contains(OutputKey,'FrontendDistributionId')].OutputValue" \
    --output text \
    --region $AWS_REGION)
  
  if [ -n "$DISTRIBUTION_ID" ]; then
    aws cloudfront create-invalidation \
      --distribution-id $DISTRIBUTION_ID \
      --paths "/*" \
      --region $AWS_REGION
    echo "✅ CloudFront cache invalidated"
  fi
fi

# Get website URL
WEBSITE_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs[?contains(OutputKey,'Url')].OutputValue" \
  --output text \
  --region $AWS_REGION | head -n 1)

echo "✅ Frontend deployed successfully!"
echo "🌐 Website URL: $WEBSITE_URL"

# Clean up
rm -f .env.production

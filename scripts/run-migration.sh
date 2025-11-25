#!/bin/bash

# Run data migration from local to AWS
# Usage: ./run-migration.sh [dev|qa|prod]

set -euo pipefail

# Ensure required commands are available
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
AWS_REGION=${AWS_REGION:-us-east-1}

echo "🚀 Starting migration for $ENVIRONMENT..."

# Capitalize first letter of environment for stack name
ENV_CAPITALIZED=$(echo $ENVIRONMENT | awk '{print toupper(substr($0,1,1))substr($0,2)}')
STACK_NAME="Shortlist${ENV_CAPITALIZED}Stack"

# Get DB Secret ARN
echo "🔍 Fetching DB credentials..."
SECRET_ARN=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs[?contains(OutputKey,'RdsDbSecretArn')].OutputValue" \
  --output text \
  --region $AWS_REGION)

if [ -z "$SECRET_ARN" ]; then
  echo "❌ Error: Could not retrieve DB secret ARN from stack $STACK_NAME"
  exit 1
fi

# Get DB Endpoint
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs[?contains(OutputKey,'RdsDbEndpoint')].OutputValue" \
  --output text \
  --region $AWS_REGION)

if [ -z "$DB_ENDPOINT" ]; then
  echo "❌ Error: Could not retrieve DB endpoint from stack $STACK_NAME"
  exit 1
fi

# Get Secret Value
SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id $SECRET_ARN --query SecretString --output text --region $AWS_REGION)
DB_PASSWORD=$(echo $SECRET_JSON | grep -o '"password":"[^"]*' | cut -d'"' -f4)
DB_USERNAME=$(echo $SECRET_JSON | grep -o '"username":"[^"]*' | cut -d'"' -f4)
DB_NAME=$(echo $SECRET_JSON | grep -o '"dbname":"[^"]*' | cut -d'"' -f4)

# Export Remote DB Credentials
export REMOTE_DB_HOST=$DB_ENDPOINT
export REMOTE_DB_PORT=5432
export REMOTE_DB_USERNAME=$DB_USERNAME
export REMOTE_DB_PASSWORD=$DB_PASSWORD
export REMOTE_DB_NAME=$DB_NAME

echo "📝 Remote DB: $REMOTE_DB_HOST ($REMOTE_DB_NAME)"

# Run Migration Script
echo "🏃 Running migration script..."
cd "$(dirname "$0")/../backend"

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
  npm install
fi

# Run with ts-node
npx ts-node scripts/migrate-data.ts

echo "✅ Migration process finished!"

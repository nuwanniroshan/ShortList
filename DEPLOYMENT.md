# Shortlist Application Deployment Guide

This guide covers deploying the Shortlist recruitment application to AWS using CDK infrastructure.

## Quick Start

### Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (`aws configure`)
- Node.js 18+
- Docker installed
- AWS CDK CLI (`npm install -g aws-cdk`)

### First-Time Setup

1. **Bootstrap CDK** (one-time per AWS account/region):
   ```bash
   cd infrastructure
   npm install
   cdk bootstrap aws://YOUR-ACCOUNT-ID/us-east-1
   ```

2. **Deploy Infrastructure**:
   ```bash
   ./scripts/deploy.sh dev
   ```

3. **Build and Deploy Backend**:
   ```bash
   ./scripts/build-and-push.sh dev
   ```

4. **Deploy Frontend**:
   ```bash
   ./scripts/deploy-frontend.sh dev
   ```

5. **Run Database Migrations**:
   ```bash
   # Get RDS endpoint from stack outputs
   aws cloudformation describe-stacks \
     --stack-name ShortlistDevStack \
     --query "Stacks[0].Outputs[?OutputKey=='DbEndpoint'].OutputValue" \
     --output text
   
   # Update backend .env with RDS credentials from Secrets Manager
   # Run migrations (you'll need to implement this)
   ```

## Deployment Environments

### Development
- **Branch**: `develop`
- **Auto-deploy**: Yes (via GitHub Actions)
- **Cost**: ~$15-30/month
- **Features**: Cost-optimized, no NAT Gateway

### QA
- **Branch**: `qa` or `release/*`
- **Auto-deploy**: Yes (via GitHub Actions)
- **Cost**: ~$15-30/month
- **Features**: Similar to dev, with NAT Gateway

### Production
- **Branch**: `main` or tags
- **Auto-deploy**: Yes, with manual approval
- **Cost**: ~$50-100/month
- **Features**: Multi-AZ RDS, CloudFront, enhanced monitoring

## GitHub Actions Setup

### Required Secrets

Configure these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

1. **AWS_ACCESS_KEY_ID**: AWS access key
2. **AWS_SECRET_ACCESS_KEY**: AWS secret key
3. **AWS_REGION**: AWS region (e.g., `us-east-1`)
4. **AWS_ACCOUNT_ID**: Your AWS account ID

### Workflows

- **deploy-dev.yml**: Triggered on push to `develop`
- **deploy-qa.yml**: Triggered on push to `qa` or `release/*`
- **deploy-prod.yml**: Triggered on push to `main` or tags (requires approval)

## Manual Deployment

### Using Scripts

```bash
# Deploy everything to dev
./scripts/deploy.sh dev
./scripts/build-and-push.sh dev
./scripts/deploy-frontend.sh dev

# Deploy to production
./scripts/deploy.sh prod
./scripts/build-and-push.sh prod
./scripts/deploy-frontend.sh prod
```

### Using CDK Directly

```bash
cd infrastructure

# Deploy infrastructure
npm run deploy:dev

# For other environments
npm run deploy:qa
npm run deploy:prod
```

## Post-Deployment Tasks

### 1. Database Setup

The RDS instance is created empty. You need to:

1. Get database credentials from AWS Secrets Manager:
   ```bash
   aws secretsmanager get-secret-value \
     --secret-id shortlist-db-credentials-dev \
     --query SecretString \
     --output text
   ```

2. Run TypeORM migrations:
   ```bash
   cd backend
   # Update .env with RDS credentials
   npm run typeorm migration:run
   ```

### 2. Configure CORS

Update the ECS task definition environment variable `CORS_ORIGIN` with your frontend URL:

```bash
# Get frontend URL
aws cloudformation describe-stacks \
  --stack-name ShortlistDevStack \
  --query "Stacks[0].Outputs[?contains(OutputKey,'Url')].OutputValue" \
  --output text
```

### 3. Create Admin User

Connect to RDS and create an initial admin user, or use your existing seed scripts.

## Monitoring

### CloudWatch Logs

View backend logs:
```bash
aws logs tail /ecs/shortlist-dev --follow
```

### ECS Service Status

```bash
aws ecs describe-services \
  --cluster shortlist-dev-cluster \
  --services shortlist-dev-service
```

### RDS Metrics

Check database performance in AWS Console → RDS → Monitoring

## Updating the Application

### Backend Updates

1. Push code to appropriate branch
2. GitHub Actions will automatically build and deploy
3. Or manually:
   ```bash
   ./scripts/build-and-push.sh dev
   ```

### Frontend Updates

1. Push code to appropriate branch
2. GitHub Actions will automatically build and deploy
3. Or manually:
   ```bash
   ./scripts/deploy-frontend.sh dev
   ```

### Infrastructure Updates

1. Modify CDK code in `infrastructure/`
2. Deploy changes:
   ```bash
   cd infrastructure
   npm run deploy:dev
   ```

## Rollback

### Backend Rollback

1. Find previous image tag:
   ```bash
   aws ecr describe-images --repository-name shortlist-backend-dev
   ```

2. Update ECS task definition to use previous image
3. Force new deployment:
   ```bash
   aws ecs update-service \
     --cluster shortlist-dev-cluster \
     --service shortlist-dev-service \
     --force-new-deployment
   ```

### Frontend Rollback

1. Restore previous S3 version or redeploy from Git commit
2. Invalidate CloudFront cache (prod only)

## Cost Management

### Monitor Costs

- Use AWS Cost Explorer
- Set up billing alerts
- Review monthly costs by service

### Cost Optimization Tips

1. **Dev Environment**: Tear down when not in use
   ```bash
   cdk destroy DevStack
   ```

2. **QA Environment**: Use scheduled scaling to shut down nights/weekends

3. **RDS**: Use db.t3.micro for dev/qa, upgrade only if needed

4. **Logs**: Reduce retention periods for non-prod

## Troubleshooting

See [infrastructure/README.md](infrastructure/README.md) for detailed troubleshooting steps.

## Support

For issues or questions:
1. Check CloudWatch Logs
2. Review CloudFormation events
3. Check ECS service events
4. Verify security group rules

## Additional Documentation

- [Infrastructure README](infrastructure/README.md) - Detailed CDK documentation
- [Backend README](backend/README.md) - Backend-specific documentation
- [Frontend README](frontend/README.md) - Frontend-specific documentation

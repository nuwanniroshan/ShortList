# AWS CDK Infrastructure for Shortlist

This directory contains the AWS CDK infrastructure code for deploying the Shortlist application across multiple environments (dev, qa, prod).

## Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ VPC with public and private subnets
- **ECS Fargate**: Containerized Node.js backend with auto-scaling
- **Application Load Balancer**: HTTP/HTTPS load balancing
- **RDS PostgreSQL**: Managed database (db.t3.micro for dev/qa)
- **ECR**: Docker image registry
- **S3**: Static website hosting for React frontend
- **CloudFront**: CDN for production (optional)
- **Secrets Manager**: Secure credential storage

## Prerequisites

1. **AWS Account**: Active AWS account with appropriate permissions
2. **AWS CLI**: Installed and configured
   ```bash
   aws configure
   ```
3. **Node.js**: Version 18 or higher
4. **AWS CDK**: Install globally
   ```bash
   npm install -g aws-cdk
   ```
5. **Docker**: For building backend images

## Initial Setup

### 1. Install Dependencies

```bash
cd infrastructure
npm install
```

### 2. Bootstrap CDK (One-time per account/region)

```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

Replace `ACCOUNT-ID` with your AWS account ID and `REGION` with your desired region (e.g., `us-east-1`).

### 3. Set Environment Variables

```bash
export AWS_ACCOUNT_ID=your-account-id
export AWS_REGION=us-east-1
```

## Deployment

### Manual Deployment

#### Deploy Infrastructure

```bash
# Development
npm run deploy:dev

# QA
npm run deploy:qa

# Production
npm run deploy:prod
```

Or use the deployment script:

```bash
cd ..
./scripts/deploy.sh dev
```

#### Deploy Backend

After infrastructure is deployed, build and push the Docker image:

```bash
./scripts/build-and-push.sh dev
```

#### Deploy Frontend

```bash
./scripts/deploy-frontend.sh dev
```

### Automated Deployment (GitHub Actions)

Push to the appropriate branch:

- `develop` → deploys to **dev**
- `qa` or `release/*` → deploys to **qa**
- `main` or tags → deploys to **prod** (requires manual approval)

## Environment Configuration

Each environment has specific configurations defined in `lib/config/environment-config.ts`:

### Development (Cost-Optimized)
- No NAT Gateway (tasks in public subnets)
- db.t3.micro RDS
- 256 CPU / 512 MB memory
- 1-2 task scaling
- 7-day log retention
- No CloudFront

### QA
- Single NAT Gateway
- db.t3.micro RDS
- 256 CPU / 512 MB memory
- 1-3 task scaling
- 14-day log retention
- No CloudFront

### Production
- NAT Gateway per AZ
- db.t3.small RDS (configurable)
- 512 CPU / 1024 MB memory
- 2-10 task scaling
- 30-day log retention
- CloudFront enabled

## CDK Commands

```bash
# Synthesize CloudFormation template
cdk synth DevStack

# Show differences
cdk diff DevStack

# Deploy stack
cdk deploy DevStack

# Destroy stack
cdk destroy DevStack

# List all stacks
cdk list
```

## Stack Outputs

After deployment, the stack outputs important values:

- **AlbUrl**: Backend API endpoint
- **RepositoryUri**: ECR repository URI
- **BucketName**: Frontend S3 bucket
- **DbEndpoint**: RDS endpoint
- **DbSecretArn**: Database credentials secret ARN

View outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name ShortlistDevStack \
  --query "Stacks[0].Outputs"
```

## Cost Optimization

### Development Environment

- **No NAT Gateway**: Tasks run in public subnets (~$32/month savings)
- **VPC Endpoints**: ECR endpoints reduce data transfer costs
- **Minimal Resources**: Smallest instance sizes
- **Short Retention**: 7-day logs, 1-day backups

**Estimated Monthly Cost**: $15-30

### Production Environment

- **NAT Gateways**: High availability (~$64/month)
- **Larger Instances**: Better performance
- **CloudFront**: Global CDN
- **Longer Retention**: 30-day logs, 7-day backups

**Estimated Monthly Cost**: $50-100

## Troubleshooting

### CDK Deployment Fails

1. Check AWS credentials:
   ```bash
   aws sts get-caller-identity
   ```

2. Ensure CDK is bootstrapped:
   ```bash
   cdk bootstrap
   ```

3. Check CloudFormation events:
   ```bash
   aws cloudformation describe-stack-events --stack-name ShortlistDevStack
   ```

### ECS Tasks Not Starting

1. Check ECS service events:
   ```bash
   aws ecs describe-services \
     --cluster shortlist-dev-cluster \
     --services shortlist-dev-service
   ```

2. Check CloudWatch Logs:
   ```bash
   aws logs tail /ecs/shortlist-dev --follow
   ```

3. Verify ECR image exists:
   ```bash
   aws ecr describe-images --repository-name shortlist-backend-dev
   ```

### Database Connection Issues

1. Verify security groups allow ECS → RDS traffic
2. Check database credentials in Secrets Manager
3. Ensure RDS instance is available:
   ```bash
   aws rds describe-db-instances --db-instance-identifier <instance-id>
   ```

## Cleanup

To remove all resources:

```bash
# Destroy stack
cdk destroy DevStack

# Empty S3 buckets first if needed
aws s3 rm s3://shortlist-frontend-dev --recursive

# Delete ECR images
aws ecr batch-delete-image \
  --repository-name shortlist-backend-dev \
  --image-ids imageTag=latest
```

## Security Best Practices

1. **Secrets**: Never commit secrets to Git
2. **IAM Roles**: Use least-privilege permissions
3. **VPC**: Keep RDS in private subnets
4. **HTTPS**: Enable HTTPS for production ALB
5. **Deletion Protection**: Enabled for production RDS

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)

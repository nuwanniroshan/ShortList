#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DevStack } from '../lib/stacks/dev-stack';
import { QaStack } from '../lib/stacks/qa-stack';
import { ProdStack } from '../lib/stacks/prod-stack';

const app = new cdk.App();

// Get AWS account and region from environment or CDK context
const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;
const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';

const env = { account, region };

// Create stacks for each environment
new DevStack(app, 'DevStack', {
  env,
  tags: {
    Environment: 'dev',
    Project: 'Shortlist',
    ManagedBy: 'CDK',
  },
});

new QaStack(app, 'QaStack', {
  env,
  tags: {
    Environment: 'qa',
    Project: 'Shortlist',
    ManagedBy: 'CDK',
  },
});

new ProdStack(app, 'ProdStack', {
  env,
  tags: {
    Environment: 'prod',
    Project: 'Shortlist',
    ManagedBy: 'CDK',
  },
});

app.synth();

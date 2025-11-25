import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environment-config';
import { VpcConstruct } from '../constructs/vpc-construct';
import { EcrConstruct } from '../constructs/ecr-construct';
import { RdsConstruct } from '../constructs/rds-construct';
import { EcsConstruct } from '../constructs/ecs-construct';
import { S3FrontendConstruct } from '../constructs/s3-frontend-construct';

export interface BaseStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

export class BaseStack extends cdk.Stack {
  public readonly vpc: VpcConstruct;
  public readonly ecr: EcrConstruct;
  public readonly rds: RdsConstruct;
  public readonly ecs: EcsConstruct;
  public readonly frontend: S3FrontendConstruct;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    const { config } = props;

    // Apply tags to all resources
    Object.entries(config.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Create VPC
    this.vpc = new VpcConstruct(this, 'Vpc', {
      config,
    });

    // Create ECR repository
    this.ecr = new EcrConstruct(this, 'Ecr', {
      environmentName: config.environmentName,
    });

    // Create ECS security group (needed by both ECS and RDS)
    const ecsSecurityGroup = new cdk.aws_ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc: this.vpc.vpc,
      description: `Security group for ECS tasks (${config.environmentName})`,
      allowAllOutbound: true,
    });

    // Create RDS
    this.rds = new RdsConstruct(this, 'Rds', {
      vpc: this.vpc.vpc,
      config,
      ecsSecurityGroup,
    });

    // Create ECS Fargate
    this.ecs = new EcsConstruct(this, 'Ecs', {
      vpc: this.vpc.vpc,
      config,
      ecrRepository: this.ecr.repository,
      dbSecret: this.rds.secret,
      dbEndpoint: this.rds.instance.dbInstanceEndpointAddress,
      ecsSecurityGroup,
    });

    // Create S3 frontend
    this.frontend = new S3FrontendConstruct(this, 'Frontend', {
      config,
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'Stack Name',
    });

    new cdk.CfnOutput(this, 'Environment', {
      value: config.environmentName,
      description: 'Environment Name',
    });
  }
}

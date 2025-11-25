import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environment-config';

export interface RdsConstructProps {
  vpc: ec2.Vpc;
  config: EnvironmentConfig;
  ecsSecurityGroup: ec2.SecurityGroup;
}

export class RdsConstruct extends Construct {
  public readonly instance: rds.DatabaseInstance;
  public readonly secret: secretsmanager.Secret;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: RdsConstructProps) {
    super(scope, id);

    const { vpc, config, ecsSecurityGroup } = props;

    // Create database credentials secret
    this.secret = new secretsmanager.Secret(this, 'DbSecret', {
      secretName: `shortlist-db-credentials-${config.environmentName}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'shortlist_admin',
        }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // Create security group for RDS
    this.securityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: `Security group for RDS PostgreSQL (${config.environmentName})`,
      allowAllOutbound: false,
    });

    // Allow inbound from ECS tasks only
    this.securityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from ECS tasks'
    );

    // Create RDS instance
    this.instance = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [this.securityGroup],
      databaseName: 'shortlist',
      credentials: rds.Credentials.fromSecret(this.secret),
      allocatedStorage: config.rdsConfig.allocatedStorage,
      maxAllocatedStorage: config.rdsConfig.maxAllocatedStorage,
      storageType: rds.StorageType.GP3,
      multiAz: config.rdsConfig.multiAz,
      deletionProtection: config.rdsConfig.deletionProtection,
      backupRetention: cdk.Duration.days(config.rdsConfig.backupRetention),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      removalPolicy: config.environmentName === 'prod'
        ? cdk.RemovalPolicy.SNAPSHOT
        : cdk.RemovalPolicy.DESTROY,
      deleteAutomatedBackups: config.environmentName !== 'prod',
      publiclyAccessible: false,
      enablePerformanceInsights: config.environmentName === 'prod',
      performanceInsightRetention: config.environmentName === 'prod'
        ? rds.PerformanceInsightRetention.DEFAULT
        : undefined,
    });

    // Outputs
    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.instance.dbInstanceEndpointAddress,
      description: 'RDS Endpoint',
      exportName: `${config.environmentName}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'DbSecretArn', {
      value: this.secret.secretArn,
      description: 'Database credentials secret ARN',
      exportName: `${config.environmentName}-db-secret-arn`,
    });
  }
}

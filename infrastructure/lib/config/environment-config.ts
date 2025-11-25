export interface EnvironmentConfig {
  environmentName: string;
  
  // VPC Configuration
  vpcConfig: {
    cidr: string;
    maxAzs: number;
    natGateways: number;
    enableVpcEndpoints: boolean;
  };
  
  // RDS Configuration
  rdsConfig: {
    instanceType: string;
    allocatedStorage: number;
    maxAllocatedStorage: number;
    backupRetention: number;
    multiAz: boolean;
    deletionProtection: boolean;
    postgresVersion: string;
  };
  
  // ECS Configuration
  ecsConfig: {
    cpu: number;
    memory: number;
    desiredCount: number;
    minCapacity: number;
    maxCapacity: number;
    cpuTargetUtilization: number;
    requestsPerTarget: number;
    enableContainerInsights: boolean;
    logRetentionDays: number;
    usePublicSubnets: boolean; // For dev cost optimization
  };
  
  // Frontend Configuration
  frontendConfig: {
    enableCloudFront: boolean;
    certificateArn?: string;
    domainName?: string;
  };
  
  // General Configuration
  tags: {
    [key: string]: string;
  };
}

export const DEV_CONFIG: EnvironmentConfig = {
  environmentName: 'dev',
  
  vpcConfig: {
    cidr: '10.0.0.0/16',
    maxAzs: 2,
    natGateways: 0, // No NAT Gateway for dev to save costs
    enableVpcEndpoints: true, // ECR endpoints to avoid NAT costs
  },
  
  rdsConfig: {
    instanceType: 'db.t3.micro',
    allocatedStorage: 20,
    maxAllocatedStorage: 30,
    backupRetention: 1,
    multiAz: false,
    deletionProtection: false,
    postgresVersion: '15.5',
  },
  
  ecsConfig: {
    cpu: 256,
    memory: 512,
    desiredCount: 0, // Start with 0, will be updated after Docker image is pushed
    minCapacity: 1,
    maxCapacity: 2,
    cpuTargetUtilization: 70,
    requestsPerTarget: 1000,
    enableContainerInsights: false,
    logRetentionDays: 7,
    usePublicSubnets: true, // Tasks in public subnets to avoid NAT costs
  },
  
  frontendConfig: {
    enableCloudFront: false, // S3 website endpoint only for dev
  },
  
  tags: {
    Environment: 'dev',
    Project: 'Shortlist',
    ManagedBy: 'CDK',
  },
};

export const QA_CONFIG: EnvironmentConfig = {
  environmentName: 'qa',
  
  vpcConfig: {
    cidr: '10.1.0.0/16',
    maxAzs: 2,
    natGateways: 1, // Single NAT Gateway for QA
    enableVpcEndpoints: true,
  },
  
  rdsConfig: {
    instanceType: 'db.t3.micro',
    allocatedStorage: 20,
    maxAllocatedStorage: 30,
    backupRetention: 3,
    multiAz: false,
    deletionProtection: false,
    postgresVersion: '15.5',
  },
  
  ecsConfig: {
    cpu: 256,
    memory: 512,
    desiredCount: 1,
    minCapacity: 1,
    maxCapacity: 3,
    cpuTargetUtilization: 70,
    requestsPerTarget: 1000,
    enableContainerInsights: false,
    logRetentionDays: 14,
    usePublicSubnets: false,
  },
  
  frontendConfig: {
    enableCloudFront: false,
  },
  
  tags: {
    Environment: 'qa',
    Project: 'Shortlist',
    ManagedBy: 'CDK',
  },
};

export const PROD_CONFIG: EnvironmentConfig = {
  environmentName: 'prod',
  
  vpcConfig: {
    cidr: '10.2.0.0/16',
    maxAzs: 2,
    natGateways: 2, // NAT Gateway per AZ for high availability
    enableVpcEndpoints: true,
  },
  
  rdsConfig: {
    instanceType: 'db.t3.small', // Slightly larger for prod
    allocatedStorage: 50,
    maxAllocatedStorage: 100,
    backupRetention: 7,
    multiAz: true, // Multi-AZ for production
    deletionProtection: true,
    postgresVersion: '15.5',
  },
  
  ecsConfig: {
    cpu: 512,
    memory: 1024,
    desiredCount: 2,
    minCapacity: 2,
    maxCapacity: 10,
    cpuTargetUtilization: 70,
    requestsPerTarget: 1000,
    enableContainerInsights: true,
    logRetentionDays: 30,
    usePublicSubnets: false,
  },
  
  frontendConfig: {
    enableCloudFront: true,
    // certificateArn: 'arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID', // Uncomment and set for custom domain
    // domainName: 'app.example.com', // Uncomment and set for custom domain
  },
  
  tags: {
    Environment: 'prod',
    Project: 'Shortlist',
    ManagedBy: 'CDK',
  },
};

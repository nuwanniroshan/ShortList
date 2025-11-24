import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface EcrConstructProps {
  environmentName: string;
}

export class EcrConstruct extends Construct {
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props: EcrConstructProps) {
    super(scope, id);

    const { environmentName } = props;

    // Create ECR repository for backend Docker images
    this.repository = new ecr.Repository(this, 'BackendRepository', {
      repositoryName: `shortlist-backend-${environmentName}`,
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.MUTABLE,
      removalPolicy: environmentName === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: environmentName !== 'prod',
      lifecycleRules: [
        {
          description: 'Keep only last 10 images',
          maxImageCount: 10,
        },
      ],
    });

    // Output the repository URI
    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: this.repository.repositoryUri,
      description: 'ECR Repository URI',
      exportName: `${environmentName}-ecr-repository-uri`,
    });
  }
}

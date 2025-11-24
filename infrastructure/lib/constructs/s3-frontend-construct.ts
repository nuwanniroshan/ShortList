import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environment-config';

export interface S3FrontendConstructProps {
  config: EnvironmentConfig;
}

export class S3FrontendConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution?: cloudfront.Distribution;
  public readonly websiteUrl: string;

  constructor(scope: Construct, id: string, props: S3FrontendConstructProps) {
    super(scope, id);

    const { config } = props;

    // Create S3 bucket for frontend
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `shortlist-frontend-${config.environmentName}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // For SPA routing
      publicReadAccess: !config.frontendConfig.enableCloudFront,
      blockPublicAccess: config.frontendConfig.enableCloudFront
        ? s3.BlockPublicAccess.BLOCK_ALL
        : new s3.BlockPublicAccess({
            blockPublicAcls: false,
            blockPublicPolicy: false,
            ignorePublicAcls: false,
            restrictPublicBuckets: false,
          }),
      removalPolicy: config.environmentName === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: config.environmentName !== 'prod',
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    if (config.frontendConfig.enableCloudFront) {
      // Create CloudFront distribution for production
      this.distribution = new cloudfront.Distribution(this, 'Distribution', {
        defaultBehavior: {
          origin: new origins.S3Origin(this.bucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        defaultRootObject: 'index.html',
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
            ttl: cdk.Duration.minutes(5),
          },
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
            ttl: cdk.Duration.minutes(5),
          },
        ],
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe
        enableLogging: config.environmentName === 'prod',
      });

      this.websiteUrl = `https://${this.distribution.distributionDomainName}`;

      // Output CloudFront URL
      new cdk.CfnOutput(this, 'CloudFrontUrl', {
        value: this.websiteUrl,
        description: 'CloudFront Distribution URL',
        exportName: `${config.environmentName}-cloudfront-url`,
      });

      new cdk.CfnOutput(this, 'DistributionId', {
        value: this.distribution.distributionId,
        description: 'CloudFront Distribution ID',
        exportName: `${config.environmentName}-distribution-id`,
      });
    } else {
      // Use S3 website endpoint for dev/qa
      this.websiteUrl = this.bucket.bucketWebsiteUrl;

      // Output S3 website URL
      new cdk.CfnOutput(this, 'WebsiteUrl', {
        value: this.websiteUrl,
        description: 'S3 Website URL',
        exportName: `${config.environmentName}-website-url`,
      });
    }

    // Output bucket name
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'Frontend S3 Bucket Name',
      exportName: `${config.environmentName}-frontend-bucket`,
    });
  }
}

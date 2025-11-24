import { BaseStack, BaseStackProps } from './base-stack';
import { Construct } from 'constructs';
import { PROD_CONFIG } from '../config/environment-config';

export class ProdStack extends BaseStack {
  constructor(scope: Construct, id: string, props?: Omit<BaseStackProps, 'config'>) {
    super(scope, id, {
      ...props,
      config: PROD_CONFIG,
      stackName: 'ShortlistProdStack',
      description: 'Production environment for Shortlist application',
    });
  }
}

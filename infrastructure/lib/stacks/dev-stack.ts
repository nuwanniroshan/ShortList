import { BaseStack, BaseStackProps } from './base-stack';
import { Construct } from 'constructs';
import { DEV_CONFIG } from '../config/environment-config';

export class DevStack extends BaseStack {
  constructor(scope: Construct, id: string, props?: Omit<BaseStackProps, 'config'>) {
    super(scope, id, {
      ...props,
      config: DEV_CONFIG,
      stackName: 'ShortlistDevStack',
      description: 'Development environment for Shortlist application (cost-optimized)',
    });
  }
}

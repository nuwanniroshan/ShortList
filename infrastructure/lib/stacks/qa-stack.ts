import { BaseStack, BaseStackProps } from './base-stack';
import { Construct } from 'constructs';
import { QA_CONFIG } from '../config/environment-config';

export class QaStack extends BaseStack {
  constructor(scope: Construct, id: string, props?: Omit<BaseStackProps, 'config'>) {
    super(scope, id, {
      ...props,
      config: QA_CONFIG,
      stackName: 'ShortlistQaStack',
      description: 'QA environment for Shortlist application',
    });
  }
}

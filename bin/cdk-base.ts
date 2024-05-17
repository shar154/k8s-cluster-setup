#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { BastionHostStack } from '../lib/bastion-host-stack';
import { ComputeStack } from '../lib/compute-stack';
import { EndpointStack } from '../lib/endpoint-stack';
import { getConfig } from '../lib/utils/config';

const config = getConfig();

const app = new cdk.App();
const networkStack = new NetworkStack(app, 'NetworkStack');
const endpointStack = new EndpointStack(app, 'EndpointStack', {vpc: networkStack.vpc})
const bastionStack = new BastionHostStack(app, 'BastionStack', { vpc: networkStack.vpc, domain: config.DOMAIN });
const computeStack = new ComputeStack(app, 'ApplicationStack', 
  { vpc: networkStack.vpc,
    bastionSgId: bastionStack.bastionSgId
  });
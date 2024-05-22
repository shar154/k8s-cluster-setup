#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/stacks/network-stack';
import { BastionHostStack } from '../lib/stacks/bastion-host-stack';
import { k8sWorkerStack } from '../lib/stacks/k8s-worker-stack';
import { k8sControlPlaneStack } from '../lib/stacks/k8s-control-plane-stack';
import { EndpointStack } from '../lib/stacks/endpoint-stack';
import { getConfig } from '../lib/utils/config';

const config = getConfig();

const app = new cdk.App();
const networkStack = new NetworkStack(app, 'NetworkStack');
// const endpointStack = new EndpointStack(app, 'EndpointStack', {vpc: networkStack.vpc});
const bastionStack = new BastionHostStack(app, 'BastionStack', 
  {
      vpc: networkStack.vpc, 
      domain: config.DOMAIN,
      ssh_port: config.SSH_PORT,
  });

const k8scontrolPlaneStack = new k8sControlPlaneStack(app, 'k8sControlPlaneStack', 
  { vpc: networkStack.vpc,
    bastionSgId: bastionStack.bastionSgId,
    domain: config.DOMAIN,
    ssh_port: config.SSH_PORT,
  });

// const k8sworkerStack = new k8sWorkerStack(app, 'k8sWorkerStack', 
//   { vpc: networkStack.vpc,
//     bastionSgId: bastionStack.bastionSgId,
//     domain: config.DOMAIN,
//     ssh_port: config.SSH_PORT,
//   });
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/stacks/network-stack';
import { BastionHostStack } from '../lib/stacks/bastion-host-stack';
import { k8sWorkerStack } from '../lib/stacks/k8s-worker-stack';
import { k8sControlPlaneStack } from '../lib/stacks/k8s-control-plane-stack';
import { EndpointStack } from '../lib/stacks/endpoint-stack';
import { getConfig } from '../lib/utils/config';
import { exit } from 'process';
import { get } from 'http';

const config = getConfig();

if (config.DOMAIN == "") {
  console.log('ERROR: Please add .env file to root folder with values of DOMAIN and SSH_PORT')
  exit(1);
}

config.MISER_MODE ? console.log('Miser mode is ENABLED') : console.log('Miser mode is DISABLED. Take out your wallet folks')

const app = new cdk.App();
const networkStack = new NetworkStack(app, 'NetworkStack', {
  miserMode: config.MISER_MODE
});
const bastionStack = new BastionHostStack(app, 'BastionStack', 
  {
      vpc: networkStack.vpc, 
      domain: config.DOMAIN,
      ssh_port: config.SSH_PORT,
  });
if (!config.MISER_MODE) {
  const k8scontrolPlaneStack = new k8sControlPlaneStack(app, 'k8sControlPlaneStack', 
  { vpc: networkStack.vpc,
    bastionSgId: bastionStack.bastionSgId,
    domain: config.DOMAIN,
    ssh_port: config.SSH_PORT,
  });

const endpointStack = new EndpointStack(app, 'EndpointStack', {vpc: networkStack.vpc});

const k8sworkerStack = new k8sWorkerStack(app, 'k8sWorkerStack', 
  { vpc: networkStack.vpc,
    bastionSgId: bastionStack.bastionSgId,
    domain: config.DOMAIN,
    ssh_port: config.SSH_PORT,
  });
}

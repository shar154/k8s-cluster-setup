#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { ComputeStack } from '../lib/compute-stack';
import { EndpointStack } from "../lib/endpoint-stack";


const app = new cdk.App();
const networkStack = new NetworkStack(app, 'NetworkStack');
const endpointStack = new EndpointStack(app, 'EndpointStack', {vpc: networkStack.vpc})
const computeStack = new ComputeStack(app, 'ApplicationStack', { vpc: networkStack.vpc });

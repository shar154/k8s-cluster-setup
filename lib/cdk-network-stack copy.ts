import * as cdk from 'aws-cdk-lib';
import {Instance, InstanceType, IpAddresses, SubnetType, Vpc} from  'aws-cdk-lib/aws-ec2'
import { IpAddressType } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';


export class MyVpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC with 2 AZs
    const vpc = new Vpc(this, 'KubernetesAppVPC', {
      ipAddresses: IpAddresses.cidr('10.11.0.0/16'),
      maxAzs: 3,
      // Define the subnet configuration
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Application',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 28,
          name: 'Database',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        }
      ],
      restrictDefaultSecurityGroup: false
      // Configure a single NAT Gateway
      // natGateways: 0,
      // natGatewaySubnets: {
      //   subnetGroupName: 'Public' // Ensure NAT Gateway is placed in a public subnet
      // }
    });
  }
}
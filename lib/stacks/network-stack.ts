import * as cdk from 'aws-cdk-lib';
import {IpAddresses, SubnetType, Vpc} from  'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs';


export class NetworkStack extends cdk.Stack {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      env: { 
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION },
      ...props});

    // Create a VPC with 2 AZs
    this.vpc = new Vpc(this, 'kubernetesAppVpc', {
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
      restrictDefaultSecurityGroup: false,
      // Configure a single NAT Gateway
      natGateways: 1,
      natGatewaySubnets: {
        subnetGroupName: 'Public' // Ensure NAT Gateway is placed in a public subnet
      }
    });
  }
}
import { Stack, StackProps, aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ComputeStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps & { vpc: ec2.Vpc }) {
    super(scope, id, props);

    // Create a K8S Control Plane EC2 instance in the Application subnet
    const controlPlaneInstance = new ec2.Instance(this, 'ControlPlane', {
        vpc: props.vpc,
        vpcSubnets: {
            subnetGroupName: 'Application'  // This will select all subnets named 'Application'
        },
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        instanceType: new ec2.InstanceType('t3.nano'),
        });

    // Create a worker EC2 instance in the Application subnet
    const workerInstance = new ec2.Instance(this, 'Worker', {
        vpc: props.vpc,
        vpcSubnets: {
            subnetGroupName: 'Application'  // This will select all subnets named 'Application'
        },
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        instanceType: new ec2.InstanceType('t3.nano'),
        blockDevices: [{
            deviceName: '/dev/sdh',  // This is the device name; adjust if necessary
            volume: ec2.BlockDeviceVolume.ebs(10)  // 10 GB EBS volume
            }]
        });
    }
}


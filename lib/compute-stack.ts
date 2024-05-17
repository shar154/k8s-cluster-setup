import { Stack, StackProps, aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ComputeStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps & { 
        vpc: ec2.Vpc, bastionSgId: string
    }) 
    {
        super(scope, id, {
            env: { 
                account: process.env.CDK_DEFAULT_ACCOUNT,
                region: process.env.CDK_DEFAULT_REGION },
            ...props});

        // Define a security group for the bastion host
        const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSG', {
            vpc: props.vpc,
            description: 'Allow SSH access from the Internet on port 3114',
            allowAllOutbound: true
        });

        // Allow SSH access on port 3114
        bastionSecurityGroup.addIngressRule(ec2.Peer.securityGroupId(props.bastionSgId), ec2.Port.tcp(3114), 'Allow SSH access from the internet on port 3114');
        
        const keyPair = ec2.KeyPair.fromKeyPairName(this, 'KeyPair', 'k8s-cluster-demo');

        const userData = ec2.UserData.forLinux();
        userData.addCommands(
            'sed -i \'s/^#Port 22/Port 3114/\' /etc/ssh/sshd_config',
            'service sshd restart',
            'iptables -A INPUT -p tcp --dport 3114 -j ACCEPT',
            'service iptables save',
            'service iptables restart'
        );
        
        // Create a K8S Control Plane EC2 instance in the Application subnet
        const controlPlaneInstance = new ec2.Instance(this, 'ControlPlane', {
        vpc: props.vpc,
        vpcSubnets: {
            subnetGroupName: 'Application'  // This will select all subnets named 'Application'
        },
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        instanceType: new ec2.InstanceType('t3.nano'),
        keyPair: keyPair, // Ensure this key is available in your AWS account
        securityGroup: bastionSecurityGroup,
        userData: userData,
        blockDevices: [{
            deviceName: '/dev/sdh',  // This is the device name; adjust if necessary
            volume: ec2.BlockDeviceVolume.ebs(10)  // 10 GB EBS volume
            }]
        });

        // Create a worker EC2 instance in the Application subnet
        const workerInstance = new ec2.Instance(this, 'Worker', {
        vpc: props.vpc,
        vpcSubnets: {
            subnetGroupName: 'Application'  // This will select all subnets named 'Application'
        },
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        instanceType: new ec2.InstanceType('t3.nano'),
        keyPair: keyPair, // Ensure this key is available in your AWS account
        securityGroup: bastionSecurityGroup,
        userData: userData,
        blockDevices: [{
            deviceName: '/dev/sdh',  // This is the device name; adjust if necessary
            volume: ec2.BlockDeviceVolume.ebs(10)  // 10 GB EBS volume
            }]
        });
    
    }
}
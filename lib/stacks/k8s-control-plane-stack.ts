import { Stack, StackProps, Duration, aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';

export class k8sControlPlaneStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps & { 
        vpc: ec2.Vpc, bastionSgId: string, domain: string, ssh_port: string }) {
            super(scope, id, {
                env: { 
                    account: process.env.CDK_DEFAULT_ACCOUNT,
                    region: process.env.CDK_DEFAULT_REGION },
                ...props});

        // Define a security group for the bastion host
        const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSG', {
            vpc: props.vpc,
            description: `Allow SSH access from the Internet on port ${props.ssh_port}`,
            allowAllOutbound: true
        });

        // Allow SSH access on port in props.ssh_port
        bastionSecurityGroup.addIngressRule(ec2.Peer.securityGroupId(props.bastionSgId), ec2.Port.tcp(parseInt(props.ssh_port) || 22), `Allow SSH access from the internet on port ${props.ssh_port}`);
        
        const keyPair = ec2.KeyPair.fromKeyPairName(this, 'KeyPair', 'k8s-cluster-demo');
        
        const cfn_init = ec2.CloudFormationInit.fromElements(

            ec2.InitCommand.shellCommand('sleep 10'),
            ec2.InitFile.fromFileInline(
                '/etc/ssh.sh',
                './lib/scripts/ssh.sh', 
            ),
            ec2.InitCommand.shellCommand('chmod +x /etc/ssh.sh'),
            ec2.InitCommand.shellCommand(`/etc/ssh.sh ${props.ssh_port}`),
        );

        // Route 53 Hosted Zone for the domain
        const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
            domainName: props.domain
        });

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
        init: cfn_init,
        initOptions: {
            timeout: Duration.minutes(15),
        },
        blockDevices: [{
            deviceName: '/dev/sdh',  // This is the device name; adjust if necessary
            volume: ec2.BlockDeviceVolume.ebs(10)  // 10 GB EBS volume
            }]
        });

        // A Record in Route 53
        new route53.ARecord(this, 'k8sControlPlaneARecord', {
            zone: hostedZone,
            recordName: `k8s.${props.domain}`,
            target: route53.RecordTarget.fromIpAddresses(controlPlaneInstance.instancePrivateIp)
        });    
    }
}
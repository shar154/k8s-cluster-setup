import { Stack, StackProps, aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';

export class BastionHostStack extends Stack {
    public readonly bastionSgId: string;

    constructor(scope: Construct, id: string, props: StackProps & { vpc: ec2.Vpc, domain: string }) {
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
        bastionSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3114), 'Allow SSH access from the internet on port 3114');

        this.bastionSgId = bastionSecurityGroup.securityGroupId;  // Pass sgID out to give application tier access

        // User Data to configure SSH and iptables
        const userData = ec2.UserData.forLinux();
        userData.addCommands(
            'sed -i \'s/^#Port 22/Port 3114/\' /etc/ssh/sshd_config',
            'service sshd restart',
            'iptables -A INPUT -p tcp --dport 3114 -j ACCEPT',
            'service iptables save',
            'service iptables restart'
        );

        const keyPair = ec2.KeyPair.fromKeyPairName(this, 'KeyPair', 'k8s-cluster-demo');

        // Create a bastion host in the Public subnet
        const bastion = new ec2.Instance(this, 'BastionHost', {
            vpc: props.vpc,
            vpcSubnets: { subnetGroupName: 'Public' },
            instanceType: new ec2.InstanceType('t3.micro'),
            machineImage: ec2.MachineImage.latestAmazonLinux2(),
            keyPair: keyPair, // Ensure this key is available in your AWS account
            securityGroup: bastionSecurityGroup,
            userData: userData,
        });

        // Route 53 Hosted Zone for the domain
        const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
            domainName: props.domain
        });

      // A Record in Route 53
        new route53.ARecord(this, 'BastionARecord', {
            zone: hostedZone,
            recordName: `bastion.${props.domain}`,
            target: route53.RecordTarget.fromIpAddresses(bastion.instancePublicIp)
        });
    }
}
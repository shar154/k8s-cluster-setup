import { Stack, StackProps, Duration, aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as iam from 'aws-cdk-lib/aws-iam';

export class BastionHostStack extends Stack {
  public readonly bastionSgId: string;

  constructor(
    scope: Construct,
    id: string,
    props: StackProps & { vpc: ec2.Vpc; domain: string; ssh_port: string }
  ) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
      },
      ...props
    });

    // Define a security group for the bastion host
    const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSG', {
      vpc: props.vpc,
      description: `Allow SSH access from the Internet on port ${props.ssh_port}`,
      allowAllOutbound: true
    });

    // Allow SSH access on port in props.ssh_port
    bastionSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(parseInt(props.ssh_port) || 22),
      `Allow SSH access from the internet on port ${props.ssh_port}`
    );

    this.bastionSgId = bastionSecurityGroup.securityGroupId; // Pass sgID out to give application tier access

    const keyPair = ec2.KeyPair.fromKeyPairName(
      this,
      'KeyPair',
      'k8s-cluster-demo'
    );

    // Create an IAM role for the bastion host
    const role = new iam.Role(this, 'BastionRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonEC2RoleforSSM'
        )
      ]
    });

    // const cfn_init = ec2.CloudFormationInit.fromElements(

    // ec2.InitCommand.shellCommand('sleep 10'),
    // ec2.InitFile.fromFileInline(
    //     '/etc/ssh.sh',
    //     './lib/scripts/ssh.sh',
    // ),
    // ec2.InitCommand.shellCommand('chmod +x /etc/ssh.sh'),
    // ec2.InitCommand.shellCommand(`/etc/ssh.sh ${props.ssh_port}`),
    // );

    // Create a bastion host in the Public subnet
    const bastion = new ec2.Instance(this, 'BastionHost', {
      vpc: props.vpc,
      vpcSubnets: { subnetGroupName: 'Public' },
      instanceType: new ec2.InstanceType('t3.micro'),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      keyPair: keyPair, // Ensure this key is available in your AWS account
      securityGroup: bastionSecurityGroup,
      role: role
      // init: cfn_init,
      // initOptions: {
      //     timeout: Duration.minutes(5),
      // },
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

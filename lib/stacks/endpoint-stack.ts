import { Stack, StackProps, aws_ec2 as ec2, aws_iam as iam} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class EndpointStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps & { vpc: ec2.Vpc }) {
        super(scope, id, {
            env: { 
                account: process.env.CDK_DEFAULT_ACCOUNT,
                region: process.env.CDK_DEFAULT_REGION },
            ...props});

        // Read the bucket name from the environment variable
        const bucketName = process.env.LEARNING_BUCKET || 'arn:aws:s3:::learning-the-cloud-81927n1yd9';

        // Create a Gateway Endpoint for S3
        const s3Endpoint = props.vpc.addGatewayEndpoint('S3Endpoint', {
            service: ec2.GatewayVpcEndpointAwsService.S3,
            subnets: [{ subnetGroupName: 'Application' }]
        });

        // Restrict policies to allow only specific bucket
        s3Endpoint.addToPolicy(new iam.PolicyStatement({
            actions: ["s3:GetObject", "s3:ListBucket"],
            resources: [`arn:aws:s3:::${bucketName}`, `arn:aws:s3:::${bucketName}/*`],
            principals: [new iam.ArnPrincipal('*')],
            effect: iam.Effect.ALLOW
        }));

            // SSM VPC Endpoints
        const ssmEndpoint = props.vpc.addInterfaceEndpoint('SsmEndpoint', {
            service: ec2.InterfaceVpcEndpointAwsService.SSM,
            subnets: { subnetGroupName: 'Application' }
        });

        const ssmMessagesEndpoint = props.vpc.addInterfaceEndpoint('SsmMessagesEndpoint', {
            service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
            subnets: { subnetGroupName: 'Application'},
        });
        const ec2MessagesEndpoint = props.vpc.addInterfaceEndpoint('Ec2MessagesEndpoint', {
            service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
            subnets: { subnetGroupName: 'Application'},
        });
    
        const kmsEndpoint = props.vpc.addInterfaceEndpoint('KmsEndpoint', {
            service: ec2.InterfaceVpcEndpointAwsService.KMS,
            subnets: { subnetGroupName: 'Application'},
        });

    }
}

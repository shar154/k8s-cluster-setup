import { Stack, StackProps, aws_ec2 as ec2, aws_iam as iam} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class EndpointStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps & { vpc: ec2.Vpc }) {
    super(scope, id, props);

        // Read the bucket name from the environment variable
        const bucketName = process.env.LEARNING_BUCKET || 'arn:aws:s3:::learning-the-cloud-81927n1yd9';

        // Create a Gateway Endpoint for S3
        const s3Endpoint = props.vpc.addGatewayEndpoint('S3Endpoint', {
            service: ec2.GatewayVpcEndpointAwsService.S3,
            subnets: [{ subnetGroupName: 'Application' }]
        });

        // Optionally, restrict policies to allow only specific bucket
        s3Endpoint.addToPolicy(new iam.PolicyStatement({
            actions: ["s3:GetObject", "s3:ListBucket"],
            resources: [`arn:aws:s3:::${bucketName}`, `arn:aws:s3:::${bucketName}/*`],
            principals: [new iam.ArnPrincipal('*')],
            effect: iam.Effect.ALLOW
        }));
    }
}

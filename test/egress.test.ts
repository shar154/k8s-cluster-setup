import { App } from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { ComputeStack } from '../lib/compute-stack';
import { EndpointStack } from "../lib/endpoint-stack";
import { Template, Match} from 'aws-cdk-lib/assertions';

describe('Egress test suite', () => {
    
    let networkStackTemplate: Template;
    let computeStackTemplate: Template;

    beforeAll( () => {

        // Arrange
        const testApp = new App({
            outdir: 'cdk.out'
        });
        const networkStack = new NetworkStack(testApp, 'NetworkStack')
        const endpointStack = new EndpointStack(testApp, 'EndpointStack', {vpc:networkStack.vpc});
        const computeStack = new ComputeStack(testApp, 'ComputeStack', {vpc: networkStack.vpc});
        networkStackTemplate = Template.fromStack(networkStack);
        computeStackTemplate  = Template.fromStack(computeStack);
    });
    
    test('controlPlaneEc2', () => {

        computeStackTemplate.hasResourceProperties('AWS::EC2::Instance', 
            Match.objectLike({
                InstanceType: "t3.nano",
                Tags: Match.arrayWith([{
                        Key: 'Name',
                        Value: Match.stringLikeRegexp('ControlPlane')
                    }])
            }))
    });

    test('workerEc2', () => {

        computeStackTemplate.hasResourceProperties('AWS::EC2::Instance', 
            Match.objectLike({
                InstanceType: "t3.nano",
                Tags: Match.arrayWith([{
                        Key: 'Name',
                        Value: Match.stringLikeRegexp('Worker')
                    }])
    // Name: "ApplicationStack/ControlPlane"
            }))
    });

    it('Control Plane instance should have internet access via NAT Gateway', () => {

        // THEN
        const subnetIds = networkStackTemplate.findResources('AWS::EC2::Subnet', {
            Tags: [
            {
                Key: 'Name',
                Value: 'Application' // Adjust based on your actual tagging and naming conventions
            }
            ]
        });
    
        // Check if there's a route to a NAT Gateway for each Application subnet
        Object.keys(subnetIds).forEach(subnetId => {
            networkStackTemplate.hasResourceProperties('AWS::EC2::Route', {
            RouteTableId: {
              Ref: `somethingThatMatchesRouteTableLinkedTo${subnetId}` // Adjust logic to match your resource naming or reference pattern
            },
            DestinationCidrBlock: '0.0.0.0/0',
            NatGatewayId: {
                'Fn::GetAtt': [
                expect.anything(), // You may need a more specific check depending on setup
                'NatGatewayId'
                ]
            }
        });
        });
    });
});
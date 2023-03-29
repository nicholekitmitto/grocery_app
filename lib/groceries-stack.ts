import * as cdk from 'aws-cdk-lib';
import {aws_s3 as s3} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class GroceriesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new s3.Bucket(this, 'CDKBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

     const vpc = new cdk.aws_ec2.Vpc(this, "Vpc", {
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Ingress',
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ]
    });

    const handler = new cdk.aws_lambda.Function(this, "Lambda", { 
      runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
      code: new cdk.aws_lambda.AssetCode("resources"),
      handler: "index.hello_world",
      vpc: vpc,
      vpcSubnets:
        {
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED                                                                                                               
        }
    });

    const api = new cdk.aws_apigateway.LambdaRestApi(this, 'groceriesApi', {
      handler: handler,
      proxy: false
    });

    const items = api.root.addResource('items');
    items.addMethod('GET');
    items.addMethod('POST');

    const item = items.addResource('{item}');
    item.addMethod('GET');
    item.addMethod('DELETE');

    

    // example resource
    // const queue = new sqs.Queue(this, 'HelloCdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}

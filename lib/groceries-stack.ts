import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class GroceriesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new s3.Bucket(this, 'GroceriesBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });
    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'GroceriesQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}

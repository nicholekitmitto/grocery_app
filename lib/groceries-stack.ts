import * as cdk from 'aws-cdk-lib';
import {aws_s3 as s3, Duration} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class GroceriesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new s3.Bucket(this, 'CDKBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const groceriesTable = new cdk.aws_dynamodb.Table(this, 'Groceries', {
      partitionKey: { 
        name: 'item',
        type: cdk.aws_dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'id',
        type: cdk.aws_dynamodb.AttributeType.NUMBER
      }
    });

    // const vpc = new cdk.aws_ec2.Vpc(this, "Vpc", {
    //   subnetConfiguration: [
    //     {
    //       cidrMask: 24,
    //       name: 'Ingress',
    //       subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
    //     }
    //   ]
    // });

    const handler = new cdk.aws_lambda.Function(this, "Lambda", { 
      runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
      code: new cdk.aws_lambda.AssetCode("resources"),
      handler: "index.add_item",
      environment: {
        "TABLE_NAME": groceriesTable.tableName,
      },
      timeout: Duration.seconds(30)
    });

    groceriesTable.grantReadWriteData(handler);

    const api = new cdk.aws_apigateway.LambdaRestApi(this, 'groceriesApi', {
      handler: handler,
      proxy: false
    });

    const addItemIntegration = new cdk.aws_apigateway.LambdaIntegration(handler);

    const items = api.root.addResource('items');
    items.addMethod('GET');
    items.addMethod('POST', addItemIntegration);

    const item = items.addResource('{item}');
    item.addMethod('GET');
    item.addMethod('DELETE');

    

    

    // example resource
    // const queue = new sqs.Queue(this, 'HelloCdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}

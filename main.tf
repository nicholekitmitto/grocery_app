

resource "aws_s3_bucket" "terraform-groceries-bucket" {
  bucket = "terraform-groceries-bucket"
}

resource "aws_s3_bucket_acl" "bucketAcl" {
  bucket = aws_s3_bucket.terraform-groceries-bucket.id
  acl    = "public-read"
}

resource "aws_dynamodb_table" "terraform_table" {
  name      = "TerraformGroceries"
  hash_key  = "item"
  range_key = "id"

  attribute {
    name = "item"
    type = "S"
  }

  attribute {
    name = "id"
    type = "N"
  }

  tags = {
    Name        = "dynamodb-groceries-table-terraform"
    Environment = "dev"
  }
}

# data "aws_iam_policy_document" "assume_role" {
#   statement {
#     effect = "Allow"

#     principals {
#       type        = "Service"
#       identifiers = ["lambda.amazonaws.com"]
#     }

#     actions = ["sts:AssumeRole"]
#   }
# }

# resource "aws_lambda_permission" "allow_dynamodb" {
#   statement_id  = "AllowDynamoDb"
#   action        = "dynamodb:PutItem"
#   function_name = aws_lambda_function.terraform_groceries_lambda.function_name
#   principal     = "dynamodb.amazonaws.com"
# }

# resource "aws_iam_role" "iam_lambda_terraform" {
#   name               = "iam_lambda_terraform"
#   assume_role_policy = data.aws_iam_policy_document.assume_role.json
# }

resource "aws_iam_policy" "dynamoDBLambdaPolicy" {
  name = "DynamoDBLambdaPolicy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.terraform_table.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role" "lambdaDBRole" {
  name = "LambdaDBRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda-policy-attachment" {
  role       = aws_iam_role.lambdaDBRole.name
  policy_arn = aws_iam_policy.dynamoDBLambdaPolicy.arn
}


data "archive_file" "lambda" {
  type        = "zip"
  source_file = "${path.module}/resources/index.js"
  output_path = "terraform_grceries_lambda_payload.zip"
}

resource "aws_lambda_function" "terraform_groceries_lambda" {
  filename      = "terraform_grceries_lambda_payload.zip"
  function_name = "terraform_groceries_add"
  role          = aws_iam_role.lambdaDBRole.arn
  handler       = "index.add_item"

  environment {
    variables = {
      "TABLE_NAME" = aws_dynamodb_table.terraform_table.name
    }
  }

  source_code_hash = data.archive_file.lambda.output_base64sha256

  runtime = "nodejs16.x"
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.terraform_groceries_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.terraform_api_groceries_add.execution_arn}/*/*"
}

resource "aws_api_gateway_rest_api" "terraform_api_groceries_add" {
  name        = "terraform_api_groceries_add"
  description = "Add an item to a grocery list"
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.terraform_api_groceries_add.id
  parent_id   = aws_api_gateway_rest_api.terraform_api_groceries_add.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.terraform_api_groceries_add.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "terraform_groceries_lambda" {
  rest_api_id = aws_api_gateway_rest_api.terraform_api_groceries_add.id
  resource_id = aws_api_gateway_method.proxy.resource_id
  http_method = aws_api_gateway_method.proxy_root.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.terraform_groceries_lambda.invoke_arn
}

resource "aws_api_gateway_method" "proxy_root" {
  rest_api_id   = aws_api_gateway_rest_api.terraform_api_groceries_add.id
  resource_id   = aws_api_gateway_rest_api.terraform_api_groceries_add.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "terraform_groceries_lambda_root" {
  rest_api_id = aws_api_gateway_rest_api.terraform_api_groceries_add.id
  resource_id = aws_api_gateway_method.proxy_root.resource_id
  http_method = aws_api_gateway_method.proxy_root.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.terraform_groceries_lambda.invoke_arn
}

resource "aws_api_gateway_deployment" "deployment" {
  depends_on = [
    aws_api_gateway_integration.terraform_groceries_lambda,
    aws_api_gateway_integration.terraform_groceries_lambda_root
  ]

  rest_api_id = aws_api_gateway_rest_api.terraform_api_groceries_add.id
  stage_name  = "dev"
}


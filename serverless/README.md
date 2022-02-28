# Serverless App Setup

## Prerequisites

- Access to an AWS Account with permissions to create: IAM role, DynamoDB, Cognito, Lambda, API Gateway, S3, and Cloudformation.
- [AWS CLI Version 2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- AWS-SDK-JS version [2.714.0](https://github.com/aws/aws-sdk-js/blob/master/CHANGELOG.md#27140) or greater for IVS support

## Deploy from your local machine

Before you start, run the following command to make sure the AWS CLI tool is configured correctly.

```shell
aws configure
```

For configuration help, see https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html

### 1. Create an S3 bucket

- Replace `<my-bucket-name>` with your bucket name.
- Replace `<my-region>` with your region name (for ex. `us-west-2`).

```shell
aws s3api create-bucket --bucket <my-bucket-name> --region <my-region> \
--create-bucket-configuration LocationConstraint=<my-region>
```

### 2. Create and upload dependencies to S3 bucket

1. [Install NodeJS](https://nodejs.org/). Download latest LTS version ("Recommended for Most Users")
2. Navigate to the serverless dependencies directory `serverless/dependencies/nodejs` on your local computer.
   Example: `~/Developer/amazon-vs-ugc-web-demo/serverless/dependencies/nodejs`
3. Run: `npm install`
4. Compress the serverless dependencies directory `serverless/dependencies/nodejs` into a `.zip` file named `nodejs.zip`.
5. Upload the zipped dependencies to the previously created S3 bucket"

```shell
aws s3 cp ./dependencies/nodejs.zip s3://<my-bucket-name>/
```

### 3. Pack template with SAM

```shell
sam package \
--template-file template.yaml \
--output-template-file packaged.yaml \
--s3-bucket <my-bucket-name>
```

**DO NOT** run the output from above command. Instead, proceed to next step.

### 4. Deploy Cloudformation with SAM

Replace `<my-stack-name>` with your stack name.

```shell
sam deploy \
--template-file packaged.yaml \
--stack-name <my-stack-name> \
--capabilities CAPABILITY_IAM \
--parameter-overrides DependenciesBucket=<my-bucket-name>
```

On completion, copy the value of `ApiURL`. Paste this value on line 8 of `/web-ui/src/config.js`:

```js
// config.js
...
export const UGC_API = ""; // paste the ApiURL value here
...
```

Example of ApiURL: `https://xxxxxxxxxx.execute-api.{my-region}.amazonaws.com/Prod/`

To retrieve Cloudformation stack outputs again, run the following command:

```shell
aws cloudformation describe-stacks \
--stack-name <my-stack-name> --query 'Stacks[].Outputs'
```

### 5. Deploy UGC Web Demo

Follow the steps in the [web-ui README](../web-ui) to get the UI running.

---

## Rest API Endpoints

### Sign Up

Endpoint: `<ApiURL>signUp`<br />
Method: POST<br />
Content Type: JSON<br />
Payload:

```json
{
  "email": "My-Channel",
  "password": "My-Title",
  "avatar": "My-Avatar",
  "bgColor": "My-Background-Color",
  "channelLatencyMode": "My-Channel-Latency-Mode", // Optional - default to NORMAL
  "channelType": "My-Channel-Type, // Optional - default to BASIC
}
```

### Auth

Endpoint: `<ApiURL>auth`<br />
Method: POST<br />
Content Type: JSON<br />
Payload:

```json
{
  "email": "My-Channel",
  "password": "My-Title"
}
```

### Get a User

Endpoint: `<ApiURL>user/username?access_token=<my_access_token>`<br />
Method: GET<br />
Content Type: JSON<br />

```json
{
  "username": "username",
  "avatar": "avatar",
  "bgColor": "color",
}
```

### Update a User attribute

Endpoint: `<ApiURL>user/attr?access_token=<my_access_token>`<br />
Method: POST<br />
Content Type: JSON<br />
Payload:

```json
{
  "Name": "picture",
  "Value": "My-New-Picture"
}
```

### Change Password

Endpoint: `<ApiURL>user/changePassword?access_token=<my_access_token>`<br />
Method: POST<br />
Content Type: JSON<br />
Payload:

```json
{
  "oldPassword": "My-Old-Password",
  "newPassword": "My-New-Password"
}
```

### Delete a User

Endpoint: `<ApiURL>user/delete?access_token=<my_access_token>`<br />
Method: GET<br />
Content Type: JSON<br />

### Get IVS Stream Configuration

Endpoint: `<ApiURL>stream?access_token=<my_access_token>`<br />
Method: GET<br />
Content Type: JSON<br />

```json
{
  "streamKey": "stream-key",
  "ingest": "ingest-server"
}
```

### List IVS Channels

Endpoint: `<ApiURL>channels`<br />
Method: GET<br />
Content Type: JSON<br />

```json
[
  {
    "username": "username",
    "avatar": "avatar",
    "bgColor": "color",
    "channelName": "channelName",
    "playbackUrl": "playbackUrl",
    "isLive": "yes/no",
    "startTime": "2022-02-17T22:55:30.000Z" // "0" if offline
  },
  ...
]
```

### List Live Channels

Endpoint: `<ApiURL>live-channels`<br />
Method: GET<br />
Content Type: JSON<br />

```json
[
  {
    "username": "username",
    "avatar": "avatar",
    "bgColor": "color",
    "channelName": "channelName",
    "playbackUrl": "playbackUrl"
  },
  ...
]
```

### Get a Channel

Endpoint: `<ApiURL>channels/?id=<username>` - Remember to `encodeURIComponent` channelArn<br />
Method: GET<br />
Content Type: JSON<br />

### Reset Default Channel Stream Key

Endpoint: `<ApiURL>channels/default/streamKey/reset?access_token=<my_access_token>`<br />
Method: GET<br />
Content Type: JSON<br />

## Clean Up

1. Delete Cloudformation stack:

```shell
aws cloudformation delete-stack --stack-name <my-stack-name>
```

2. Remove files in S3 bucket

```shell
aws s3 rm s3://<my-bucket-name> --recursive
```

3. Delete S3 bucket

```shell
aws s3api delete-bucket --bucket <my-bucket-name> --region <my-region>
```

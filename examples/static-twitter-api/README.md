# Static twitter API

Have your custom twitter API — self-hosted in a S3 bucket, updated by a webhook.

## Contents

1. AWS Lambda function the fetches a certain amount of latest tweets of a specified user and saves the results in a JSON-file that lives in a S3 bucket.

2. A Cloudfront instance, that shields the S3 bucket.

## Installation

Just run `npm install` in your terminal and you're good to go.

## How it works

First of all [create a new twitter app](https://apps.twitter.com/app/new). Then create your personal access token & access token secret. I also recommend to create a dedicated IAM user for the widget in the AWS console, e.g. named `static-twitter-api`. Grant it `AdministratorAccess` permission.

After that rename the file `config.yml.example` to `config.yml` and put the required values into it:

```yaml
AWS_PROFILE: <name of your AWS IAM user>
REGION: <AWS region, where to set up the stack; default: eu-west-1>
USER_NAME: <your twitter profile name (uppercase letters are fine)>
TWEET_COUNT: <how many tweets to fetch & display>
BUCKET_NAME: <name of the S3 bucket, where the tweets JSON file is stored>
CONSUMER_KEY: <consumer key of your twitter app>
APPLICATION_SECRET: <application secret of your twitter app>
ACCESS_TOKEN: <access token of your twitter app>
ACCESS_TOKEN_SECRET: <access token secret of your twitter app>
```
The last four lines refer to the keys you get from your twitter app.

Now you are ready to deploy the Lambda function. Just run `npm run deploy` in your terminal and watch Serverless do its awesome job.

## Setting up the webhook

Go to [IFTTT](https://ifttt.com/) and create an account, if you don't already have one. Then create a new Applet, that listens to your twitter account and always triggers a web-hook, when you publish a new tweet. Pass the URL of the Lambda function (will be show at the end of the deployment output) to the applet configuration, set the request type to `POST` and the content type to `application/json`.

That's it.

Beware that you have to replace the strings `<name of your bucket>` and `<region>` in the URL with the actual values you put into the `config.yml`.

Voilà, there's your static twitter API. Use it to fetch it from whereever you want and display the latest tweets to the visitors of your website, without forcing them to download trackers from twitter.

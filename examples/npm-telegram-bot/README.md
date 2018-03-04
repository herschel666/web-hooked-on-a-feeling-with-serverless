# npm Telegram Bot

Create a Telegram bot, that takes a package name and replies with the description & the current version.

## Contents

A Lambda function that extracts a package name from the `/npm`-command and returns the result from the npm registry.

## Installation

Just run `npm install` in your terminal and you're good to go.

## How it works

First of all go into the `BotFather`-chat of your Telegram app and create a new bot with the `/newbot`-command. When you're done, the BotFather will give you the secret key of the bot. Copy it, you will need it in one of the next steps.

Then go to the AWS console and create an IAM user for the bot, e.g. `npm-telegram-bot`. Grant it the following permissions:

- `AWSLambdaFullAccess`
- `IAMFullAccess`
- `AmazonAPIGatewayPushToCloudWatchLogs`
- `AmazonAPIGatewayAdministrator`

Now compile the `bot.js` by running `npm run build` in your terminal.

When this is done and there's a `bot.js` in the root of this example, you can create the bot by running the following command in your terminal:

```
$ npm run create --profile="<name of the IAM user>" --region="<AWS region where the Lambda will be deployed>"
```

This will create the Lambda function for your bot. At the end of this process, you will be asked to enter the secret key of your bot. Paste the key you got from the BotFather earlier.

That's it. You can now add your bot to group chats in Telegram and trigger it with the `/npm`-command.

## Updating the bot

If you've made changes to the bot after its initial creation, you can update it by running the following commands in your terminal:

```
$ npm run build
$ npm run deploy --profile="<name of the IAM user>"
```

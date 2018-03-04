# Package Release Newsletter

Send a newsletter to all subscribers with the complete changelog when a new version of your OS project is released on GitHub.

## Contents

A Lambda function that is trigger by GitHub's `create`-hook and sends an email via Mailchimp, if the hook is associated with a Git tag.

## Installation

Just run `npm install` in your terminal and you're good to go.

## Mailchimp

1. Go to **Lists** and create a new recipient list name e.g. `Package Release <project name>`.
2. After that go the the **Settings** of the list, scroll down and copy the unique list ID; it will be passed as `MAILCHIMP_LIST_ID` into the Lambda function.
3. Go to **Account** » **Extras** » **API keys** and create and API key; paste it into the `config.yml`.
4. Go to **Templates** and create a new template; Choose "Code your own" from the tabs and then the first option "Paste in code".
5. Find the `<!-- BEGIN MODULE: HEADER IMAGE // -->`-part in the template's HTML and replace it with …

```html
<!--
 /**
  * The 'mc:edit'-attribute is important, b/c it will
  * be our hook to insert the headline.
  */
-->
<div mc:edit="header">
  <h1>Heading 1</h1>
</div>
```

6. Find the `<!-- BEGIN MODULE: BODY CONTENT // -->`-part in the template's HTML and replace it with …

```html
<!--
 /**
  * The 'mc:edit'-attribute is important, b/c it will
  * be our hook to insert the headline.
  */
-->
<div mc:edit="body"></div>
```

7. Name the template And save it.
8. Back on the template list you should see your newly created template; click its name, then copy the `tid`-parameter from the URL in the address bar of the browser. The value should be a number and will be passed as `MAILCHIMP_TEMPLATE_ID` into the Lambda function.

That's it, the Mailchimp setup is finished. All additional steps regarding the newsletter will happen inside the Lambda function via the API.

## How it works

First create a dedicated IAM user for the widget in the AWS console, e.g. named `release-newsletter`. Grant it `AdministratorAccess` permission.

Then rename `config.yml.example` to `config.yml` and paste in the required values.

```yaml
AWS_PROFILE: <name of your AWS IAM role>
REGION: <AWS region, where to set up the stack; default: eu-central-1>
WEBHOOK_SECRET: <secret of your webhook>
MAILCHIMP_API_KEY: <your Mailchimp API key>
MAILCHIMP_LIST_ID: <unique ID of the Mailchimp recipient list>
MAILCHIMP_TEMPLATE_ID: <unique ID of the Mailchimp template>
MAILCHIMP_FROM_NAME: <name of the person/organisation that sends the newsletter>
MAILCHIMP_REPLY_TO: <email address the recipients can reply to>
```

**Note**: for the `WEBHOOK_SECRET` you can come up with some random string. You will need it later again when setting up the webhook in Github.

Now you can deploy the function by running `npm run deploy` in yuor terminal.

## Setting up the webhook

Finally you have to set up the webhook in the desired repository on Github. Go to `Settings » Webhooks` of the repo and click the "Create new webhook"-button.

Pass in the URL of your cloud function into the field **Payload URL**, set the **Content type** to `application/json` and set the **Secret** to the same value you passed into the cloud function as `WEBHOOK_SECRET`.

After that check the radio button **Let me select individual events** and choose **Releases** from the list below it.

Save & you're done. Now every release in that repo will trigger the cloud function and make Mailchimp send a campaign newsletter to all subscribers, announcing the latest release.

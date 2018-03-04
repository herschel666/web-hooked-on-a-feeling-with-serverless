const url = require('url');
const https = require('https');
const qs = require('querystring');
const { createHmac } = require('crypto');
const { Converter } = require('showdown');
const Mailchimp = require('mailchimp-api-v3');

function envVarsExist() {
  return [].reduce.call(
    arguments,
    (exist, key) => {
      return (
        exist &&
        (typeof process.env[key] === 'string' ||
          Boolean(console.log(`Variable ${key} is missing`)))
      );
    },
    true
  );
}

const signRequestBody = (key, body) =>
  `sha1=${createHmac('sha1', key)
    .update(body, 'utf-8')
    .digest('hex')}`;

const get = (options) =>
  new Promise((resolve, reject) =>
    https
      .get(options, (res) => {
        res.setEncoding('utf8');
        let result = '';

        res.on('data', (data) => (result += data));
        res.on('end', () => {
          try {
            resolve(JSON.parse(result));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', (err) => reject(err))
  );

const handleError = (callback) => (err) => {
  console.log(err);
  callback(null, {
    statusCode: 500,
    headers: { 'Content-Type': 'text/plain' },
    body: err.message || 'Something went wrong',
  });
};

const getEmailBody = (title, text) => `## ${title}

${text}`;

const getEmailSubject = (packageName, version) =>
  `${packageName}@${version} released! 🎉`;

const markdownToHtml = (markdown) => {
  const converter = new Converter();

  converter.setOption('noHeaderId', true);
  converter.setOption('strikethrough', true);
  converter.setOption('tables', true);
  converter.setOption('ghMentions', true);
  converter.setOption('openLinksInNewWindow', true);
  converter.setOption('emoji', true);

  return converter.makeHtml(markdown).replace(/\n/g, '');
};

const createCampaign = (mailchimp, subject, title, previewText) =>
  mailchimp.request({
    method: 'post',
    path: '/campaigns',
    body: {
      type: 'regular',
      recipients: { list_id: process.env.MAILCHIMP_LIST_ID },
      settings: {
        subject_line: subject,
        from_name: process.env.MAILCHIMP_FROM_NAME,
        reply_to: process.env.MAILCHIMP_REPLY_TO,
        preview_text: previewText,
        template_id: Number(process.env.MAILCHIMP_TEMPLATE_ID),
        title,
      },
    },
  });

const setCampaignContent = (mailchimp, campaignId, header, body) =>
  mailchimp.request({
    method: 'put',
    path: `/campaigns/${campaignId}/content`,
    body: {
      plain_text: '',
      html: '',
      template: {
        id: Number(process.env.MAILCHIMP_TEMPLATE_ID),
        sections: { header, body },
      },
    },
  });

const publishCampaign = (mailchimp, campaignId) => () =>
  mailchimp.request({
    method: 'post',
    path: `/campaigns/${campaignId}/actions/send`,
  });

const sendMail = (mailchimp, packageName, version, html) => {
  const subject = getEmailSubject(packageName, version);
  const title = `Package Release ${version}`;
  const previewText = `A new version of ${packageName} is available!`;
  const header = `<h1>${title}</h1>`;

  return createCampaign(mailchimp, subject, title, previewText).then(({ id }) =>
    setCampaignContent(mailchimp, id, header, html).then(
      publishCampaign(mailchimp, id)
    )
  );
};

module.exports.release = (event, context, callback) => {
  console.log(event);

  const response = {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: 'OK',
  };

  if (
    !envVarsExist(
      'WEBHOOK_SECRET',
      'MAILCHIMP_API_KEY',
      'MAILCHIMP_LIST_ID',
      'MAILCHIMP_TEMPLATE_ID',
      'MAILCHIMP_FROM_NAME',
      'MAILCHIMP_REPLY_TO'
    )
  ) {
    return callback(
      null,
      Object.assign(response, {
        statusCode: 401,
        body: 'config parameters missing',
      })
    );
  }

  const signature = event.headers['X-Hub-Signature'];
  const githubEvent = event.headers['X-GitHub-Event'];
  const id = event.headers['X-GitHub-Delivery'];
  const calculatedSignature = signRequestBody(
    process.env.WEBHOOK_SECRET,
    event.body
  );

  if (!signature) {
    return callback(
      null,
      Object.assign(response, {
        statusCode: 401,
        body: 'X-Hub-Signature missing on request',
      })
    );
  }

  if (!githubEvent) {
    return callback(
      null,
      Object.assign(response, {
        statusCode: 422,
        body: 'X-Github-Event missing on request',
      })
    );
  }

  if (!id) {
    return callback(
      null,
      Object.assign(response, {
        statusCode: 401,
        body: 'X-Github-Delivery missing on request',
      })
    );
  }

  if (signature !== calculatedSignature) {
    return callback(
      null,
      Object.assign(response, {
        statusCode: 401,
        body: `X-Hub-Signature incorrect. Github webhook token doesn't match`,
      })
    );
  }

  const { payload } = qs.parse(event.body);
  const data = JSON.parse(payload);

  if (data.ref_type !== 'tag') {
    return callback(
      null,
      Object.assign(response, {
        statusCode: 401,
        body: 'invalid create type',
      })
    );
  }

  const { repository } = data;
  const userAgent = `release-newsletter:${data.sender.login}`;
  const headers = { 'User-Agent': userAgent };
  const releasesUrl = url.parse(
    repository.releases_url.replace('{/id}', `/tags/${data.ref}`)
  );
  const options = Object.assign(releasesUrl, {
    port: 443,
    method: 'GET',
    headers,
  });

  return get(options)
    .then(({ name, body }) => {
      const mailchimp = new Mailchimp(process.env.MAILCHIMP_API_KEY);

      return sendMail(
        mailchimp,
        repository.name,
        data.ref,
        markdownToHtml(getEmailBody(name, body))
      ).then(() => callback(null, response));
    })
    .catch(handleError(callback));
};

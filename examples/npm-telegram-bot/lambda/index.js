'use strict';

const https = require('https');
const botBuilder = require('claudia-bot-builder');

const { Text, Sticker } = botBuilder.telegramTemplate;

const ERROR_FAILURE = 'request_failed';

const ERROR_NOT_FOUND = 'not_found';

const URL_FAILED_GIF = 'https://media.giphy.com/media/iF3M9gPPCdulq/giphy.gif';

const URL_NOT_FOUND_GIF =
  'https://media.giphy.com/media/1jaPBCxXo1Ggw/giphy.gif';

const registryUrl = (pkg) =>
  `https://registry.npmjs.org/${pkg.trim().toLowerCase()}/latest`;

const getErrorMessage = (error) => {
  switch (error) {
    case ERROR_FAILURE:
      return [
        new Sticker(ERROR_FAILURE).get(),
        new Text('Sorry, something went wrong.').get(),
      ];
    case ERROR_NOT_FOUND:
      return [
        new Sticker(URL_NOT_FOUND_GIF).get(),
        new Text('The package you just looked up does not exist.').get(),
      ];
    default:
      return new Text('Unexpected error. … sounds stupid, I know. :-|').get();
  }
};

const get = (url) =>
  new Promise((resolve, reject) =>
    https
      .get(url, (res) => {
        res.setEncoding('utf8');
        let result = '';

        res.on('data', (data) => (result += data));
        res.on('end', () => {
          try {
            resolve(JSON.parse(result));
          } catch (err) {
            console.log(err);
            reject();
          }
        });
      })
      .on('error', () => reject())
  );

const sendResultFromRegistry = (pkg) =>
  get(registryUrl(pkg))
    .then((result) => result, () => ({ error: ERROR_FAILURE }))
    .then((result) => {
      if (result.error) {
        console.log('error', result.error);
        return getErrorMessage(result.error);
      }
      const { name, description, version } = result;

      return new Text(`*${name}*: ${description}
_v${version}_`).get();
    });

module.exports = botBuilder(
  (message) => {
    console.log(message);

    const { text } = message;

    if (!/^\/npm/i.test(text)) {
      return;
    }

    const [, pkg] = /^\/npm\s([^\s]+)\b/i.exec(text) || [];

    if (!pkg) {
      return new Text('Hey, you have to pass a package.').get();
    }

    return sendResultFromRegistry(pkg);
  },
  { platforms: ['telegram'] }
);

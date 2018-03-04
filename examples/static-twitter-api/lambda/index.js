'use strict';

const querystring = require('querystring');
const { OAuth } = require('oauth');
const S3 = require('aws-sdk/clients/s3');

const API_URL = 'https://api.twitter.com/1.1/statuses/user_timeline.json';

const s3 = new S3({ apiVersion: '2006-03-01' });

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

function writeIntoBucket(json, cb) {
  const params = {
    Body: Buffer.from(json, 'utf8'),
    Bucket: process.env.BUCKET_NAME,
    Key: 'tweets.json',
    ContentType: 'application/json',
    CacheControl: 'public, max-age=60',
  };
  s3.putObject(params, cb);
}

module.exports.build = (event, context, callback) => {
  console.log(JSON.stringify(event, null, 2));

  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
    body: 'success',
  };

  if (
    !envVarsExist(
      'BUCKET_NAME',
      'USER_NAME',
      'TWEET_COUNT',
      'CONSUMER_KEY',
      'APPLICATION_SECRET',
      'ACCESS_TOKEN',
      'ACCESS_TOKEN_SECRET'
    )
  ) {
    response.statusCode = 500;
    response.body = 'A environment variable is missing.';
    return callback(null, response);
  }

  const username = process.env.USER_NAME;
  const args = {
    screen_name: username,
    count: parseInt(process.env.TWEET_COUNT, 10),
    trim_user: true,
    exclude_replies: true,
  };
  const apiUrl = `${API_URL}?${querystring.stringify(args)}`;
  const oauth = new OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    process.env.CONSUMER_KEY,
    process.env.APPLICATION_SECRET,
    '1.0A',
    null,
    'HMAC-SHA1'
  );

  oauth.get(
    apiUrl,
    process.env.ACCESS_TOKEN,
    process.env.ACCESS_TOKEN_SECRET,
    (err, data) => {
      if (err) {
        return callback(JSON.stringify(err));
      }
      const tweets = JSON.parse(data);

      writeIntoBucket(JSON.stringify({ tweets, username }), (err2) => {
        if (err2) {
          return callback(JSON.stringify(err2));
        }
        callback(null, response);
      });
    }
  );
};

import { distanceInWordsToNow } from 'date-fns';

const fetchOptions = {
  cache: 'force-cache',
  headers: {
    Host: location.hostname,
  },
};

const compose = (...fns) => (arg) =>
  fns.reduceRight((result, fn) => fn.call(null, result), arg);

const twitterCom = (pathname, text) =>
  `<a
href="https://twitter.com/${pathname}"
target="_blank"
rel="noopener noreferrer"
>
${text}
</a>`.replace(/\n/g, '');

const relativeDate = (dateString) =>
  distanceInWordsToNow(new Date(dateString), {
    includeSeconds: true,
  });

const linkUserHandles = (text) =>
  text.replace(/@[^\s]+\b/g, (handle) =>
    twitterCom(handle.replace('@', ''), handle)
  );

const linkHashtags = (text) =>
  text.replace(/#[^\s]+\b/g, (hashtag) =>
    twitterCom(hashtag.replace('#', ''), hashtag)
  );

const linkUrls = (text) =>
  text.replace(
    /https?:\/\/[^\s]+\b/g,
    (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${url.replace(
        /^https?:\/\//,
        ''
      )}</a>`
  );

const linkify = compose(linkUserHandles, linkHashtags, linkUrls);

const buildTweet = (tweet) => `<li id="tweet-${tweet.id}" class="twttr-item">
      <p class="twttr-text">${linkify(tweet.text)}</p>
      <time class="twttr-date" datetime="${
        tweet.created_at
      }">Written ${relativeDate(tweet.created_at)} ago</time>
    </li>`;

const buildWidget = (hostId) => (response) => {
  const elem = document.getElementById(hostId);
  elem.innerHTML = '';
  elem.appendChild(
    Object.assign(document.createElement('div'), {
      className: 'twttr-widget',
      innerHTML: `
  <h5 class="twttr-caption">
      Latest tweets by ${twitterCom(
        response.username.toLowerCase(),
        response.username
      )}
  </h5>
  <ul class="twttr-list">
    ${response.tweets.map(buildTweet).join('')}
  </ul>
  `,
    })
  );
};

export const initStaticTwitterWidget = (cdnUrl, hostId) =>
  fetch(`${cdnUrl.replace(/\/$/, '')}/tweets.json`, fetchOptions)
    .then((r) => r.json())
    .then(buildWidget(hostId), console.error);

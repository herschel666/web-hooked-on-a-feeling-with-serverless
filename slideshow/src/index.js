import Reveal from 'reveal.js';
import fa from '@fortawesome/fontawesome';
import brands from '@fortawesome/fontawesome-free-brands';
import { initStaticTwitterWidget } from './widget/widget';

const main = () => {
  fa.dom.i2svg({
    node: document.querySelector('.slides'),
  });
  fa.library.add(brands);
  fa.icon({
    prefix: 'fab',
    iconName: 'fort-awesome',
  });

  Reveal.initialize({
    progress: false,
    history: true,
  });

  initStaticTwitterWidget(
    'https://d2r0rsl0n2e9pc.cloudfront.net/',
    'static-twitter-widget'
  )();
};

document.addEventListener('DOMContentLoaded', main);

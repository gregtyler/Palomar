const Post = require('../models/Post');
const Series = require('../models/Series');
const respond = require('./respond');
const redirects = require('../config/redirects.json');
const config = require('../config/config.json');

module.exports = function routes(router) {
  router.match(/^\/(main.css|sw.js)$/, (url, request) => {
    return respond.file('public' + url, request);
  });

  router.match(/^\/user-images\/([a-zA-Z0-9-_ ]+\.([a-z0-9]+))$/, (url, request) => {
    const match = url.match(/^\/user-images\/([a-zA-Z0-9-_ ]+\.[a-z0-9]+)/);
    return respond.file('data/images/' + match[1], request);
  });

  router.match(/^\/(favicon(-(?:144|192|512))?.png|favicon.svg|icons.svg)$/, (url, request) => {
    return respond.file('assets/img' + url, request);
  });

  router.match(/^\/manifest.json$/, () => {
    return respond.template('errors/301.nunjucks', {}, {status: 301, Location: '/manifest.webmanifest', 'Content-type': 'text/html; charset=utf-8'});
  });

  router.match(/^\/manifest.webmanifest$/, () => {
    return respond.template('manifest.nunjucks', {}, {'Content-type': 'application/manifest+json; charset=utf-8'});
  });

  router.match(/^\/robots.txt$/, () => {
    return respond.text('User-agent: *\nDisallow: /offline', {'Content-type': 'text/plain; charset=utf-8'});
  });

  router.match(/^\/offline$/, () => {
    return respond.template('errors/offline.nunjucks', {}, {'Content-type': 'text/html; charset=utf-8'});
  });

  router.match(/^\/feed\/?$/, (url, request) => {
    const posts = Post.all({order: 'published^'});
    const series = Series.all().then(function(allSeries) {
      const series = {};
      allSeries.forEach(function(s) {
        series[s.id] = s;
      });

      return series;
    });

    return Promise.all([series, posts]).then(function([series, posts]) {
      posts.forEach(function(post) {
        post.series = series[post.series];
      });

      const baseURL = `${request.connection.encrypted ? 'https' : 'http'}://${request.headers.host}`;
      return respond.template('feed.nunjucks', {posts, config, baseURL}, {'Content-type': 'application/rss+xml; charset=utf-8'});
    });
  });

  router.match(/^\/$/, () => {
    const series = Series.all({
      showOnHomePage: true
    });
    const posts = Post.all({
      order: 'published^',
      homepage: true,
      limit: config.articlesOnFrontPage
    });

    return Promise.all([series, posts]).then(function([series, posts]) {
      return respond.template('home.nunjucks', {series, posts}, {'Content-type': 'text/html; charset=utf-8'});
    });
  });

  router.match(/^\/(about|portfolio)\/?$/, (url) => {
    const parts = url.match(/^\/([a-z0-9-]+)\/?$/i);
    // Find the requested post
    return Post.find({series: '_meta', id: parts[1]}).then(function(post) {
      if (typeof post === 'undefined') return;

      // Show the post
      return respond.template('post.nunjucks', post, {'Content-type': 'text/html; charset=utf-8'});
    });
  });

  router.match(/^\/archive\/?$/, () => {
    // Archive page
    return Post.all({
      order: 'published^'
    }).then(function(posts) {
      return respond.template('archive.nunjucks', {posts}, {'Content-type': 'text/html; charset=utf-8'});
    });
  });

  router.match(/^\/([0-9-]+)(?:\/([0-9-]+))?\/?$/i, (url) => {
    // Redirect old archive pages to the new archive page
    const parts = url.match(/^\/([0-9-]+)(?:\/([0-9-]+))?\/?$/i);
    return respond.template('errors/301.nunjucks', {}, {status: 301, Location: '/archive#year-' + parts[1], 'Content-type': 'text/html; charset=utf-8'});
  });

  router.match(/^\/([a-z0-9-]+)\/([a-z0-9-.]+)\/?$/i, (url, request) => {
    const parts = url.match(/^\/([a-z0-9-]+)\/([a-z0-9-.]+)$/i);
    if (!parts) return;

    // Find the requested post
    const series = Series.find({series: parts[1]});
    const post = Post.find({series: parts[1], id: parts[2]});
    return Promise.all([series, post]).then(function([series, post]) {
      if (typeof post === 'undefined') return;

      post.series = series;
      post.baseURL = `${request.connection.encrypted ? 'https' : 'http'}://${request.headers.host}`;

      // Show the post
      return respond.template('post.nunjucks', post, {'Content-type': 'text/html; charset=utf-8'});
    });
  });

  router.match(/^\/([a-z0-9-]+)\/?$/i, (url) => {
    const parts = url.match(/^\/([a-z0-9-]+)\/?$/i);

    // Handle redirects for old site pages
    if (typeof redirects[parts[1]] === 'string') {
      const newURL = redirects[parts[1]];
      return respond.template('errors/301.nunjucks', {}, {status: 301, Location: newURL, 'Content-type': 'text/html'});
    } else {
      // Otherwise, find the series specified in the URL
      return Series.find({series: parts[1]}).then(function(series) {
        if (typeof series === 'undefined') return;

        return Post.all({series: series.id, order: 'published^'}).then(function(posts) {
          return respond.template('series.nunjucks', {series, posts}, {'Content-type': 'text/html'});
        });
      });
    }
  });
};

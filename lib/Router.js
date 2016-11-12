const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const md5 = require('md5');
const Templater = require('./Templater');
const Post = require('../models/Post');
const Series = require('../models/Series');

class Router {
  constructor() {
    this.headers = [];
    this.contentType = {
      '.css': 'text/css',
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpg',
      '.png': 'image/png',
      '.svg': 'image/svg+xml'
    };
  }

 /**
  * Handle a request to the server
  * @param Request request The details of the server request
  * @param Response response An object to generate the response in
  */
  handleRequest(request, response) {
    const _this = this;
    this.request = request;
    this.response = response;

    if (request.url === '/main.css') {
      this.responseFile('public/main.css');
    } else if (request.url.match(/^\/user-images\/([a-z0-9-_ ]+\.([a-z0-9]+))$/)) {
      const match = request.url.match(/^\/user-images\/([a-z0-9-_ ]+\.[a-z0-9]+)$/);
      this.responseFile('data/images/' + match[1]);
    } else if (request.url === '/favicon.png') {
      this.responseFile('assets/img/favicon.png');
    } else if (request.url === '/icons.svg') {
      this.responseFile('assets/img/icons.svg');
    } else if (request.url === '/') {
      const series = Series.all({
        showOnHomePage: true
      });
      const posts = Post.all({
        order: 'published^',
        limit: 6
      });

      Promise.all([series, posts]).then(function([series, posts]) {
        _this.prepareResponse(200, {'Content-type': 'text/html'}, Templater.render('home.nunjucks', {series, posts}));
      });
    } else if (request.url.match(/^\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/i)) {
      const parts = request.url.match(/^\/([a-z0-9-]+)\/([a-z0-9-]+)$/i);
      // Find the requested post
      const series = Series.find({series: parts[1]});
      const post = Post.find({series: parts[1], id: parts[2]});
      Promise.all([series, post]).then(function([series, post]) {
        if (typeof post === 'undefined') return _this.responseError404();

        post.series = series;

        // Show the post
        _this.prepareResponse(200, {'Content-type': 'text/html'}, Templater.render('post.nunjucks', post));
      }).catch(this.responseErrorInternal.bind(this));
    } else if (request.url.match(/^\/([a-z0-9-]+)\/?$/i)) {
      const parts = request.url.match(/^\/([a-z0-9-]+)\/?$/i);
      Series.find({series: parts[1]}).then(function(series) {
        if (typeof series === 'undefined') return _this.responseError404();

        Post.all({series: series.id, order: 'published^'}).then(function(posts) {
          _this.prepareResponse(200, {'Content-type': 'text/html'}, Templater.render('series.nunjucks', {series, posts}));
        });
      }).catch(this.responseErrorInternal.bind(this));
    } else {
      this.responseError404();
    }
  }

  requestCompress(content, acceptEncoding) {
    const _this = this;

    return new Promise(function(resolve) {
      if (acceptEncoding.match(/\bgzip\b/)) {
        // Set headers
        _this.headers['Content-encoding'] = 'gzip';
        _this.headers.Vary = 'encoding';

        zlib.gzip(content, function(err, out) {
          resolve(out);
        });
      } else {
        resolve(content);
      }
    });
  }

  /**
   * Write the page content
   */
  writeResponse(statusCode, content) {
    const _this = this;
    // Set the content length if its uncompressed
    if (typeof _this.headers['Content-encoding'] === 'undefined') {
      _this.headers['Content-length'] = Buffer.byteLength(content);
    }

    // Send the headers
    _this.response.writeHead(statusCode, _this.headers);

    // Write the body
    _this.response.write(content);
    _this.response.end();
  }

  /**
   * Send a response back to the server
   */
  prepareResponse(statusCode = 503, headers = {'Content-type': 'text/plain'}, content = 'An error occurred') {
    const _this = this;
    let prom;
    _this.headers = headers;

    // If the browser supports gzip, use that
    // Deflate is currently disabled because of issues in IE
    const acceptEncoding = this.request.headers['accept-encoding'];
    if (acceptEncoding && headers['Content-type'].substr(0, 5) === 'text/') {
      prom = this.requestCompress(content, acceptEncoding);
    } else {
      prom = Promise.resolve(content);
    }

    prom.then(function(content) {
      _this.writeResponse(statusCode, content);
    }).catch(function(err) {
      throw err;
    });
  }

  /**
   * Respond with a file
   * @param {String} filepath The path of the file to be loaded, relative to process.cwd()
   */
  responseFile(filepath) {
    const _this = this;
    const stat = fs.statSync(filepath);
    fs.readFile(filepath, function(err, contents) {
      if (err) {
        return _this.responseError404();
      }

      const extension = path.extname(filepath);
      const contentType = _this.contentType[extension.toLowerCase()];
      const etag = md5(_this.request.url + stat.mtime);

      const statusCode = _this.request.headers['if-none-match'] === etag ? 304 : 200;

      _this.prepareResponse(statusCode, {
        'Content-type': contentType,
        'Cache-Control': 'max-age=86400',
        Etag: etag
      }, contents);
    });
  }

  /**
   * Handle an error. Example usage: .catch(handleError.bind(process, response))
   */
  responseError404() {
    this.prepareResponse(404, {'Content-type': 'text/html'}, Templater.render('errors/404.nunjucks'));
  }

  /**
   * Handle an error. Example usage: .catch(handleError.bind(process, response))
   * @param Error The error that was thrown
   */
  responseErrorInternal(err) {
    const errorId = 'E-' + Date.now();
    fs.appendFile('error.log', `${errorId}: ${err.message}\n`);
    this.prepareResponse(503, {'Content-type': 'text/html'}, Templater.render('errors/internal.nunjucks', {errorId}));
  }
}

module.exports = Router;

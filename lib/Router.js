const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const Templater = require('./Templater');
const Post = require('../models/Post');

class Router {
  constructor() {
    this.contentType = {
      '.css': 'text/css',
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpg',
      '.png': 'image/png'
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
    } else if (request.url === '/') {
      this.sendResponse(200, {'Content-type': 'text/html'}, Templater.render('home.nunjucks'));
    } else if (request.url.match(/^\/([a-z0-9-_]+)$/i)) {
      // Find the requested post
      const postId = request.url.substr(1);
      Post.find(postId).then(function(post) {
        // Show the post
        _this.sendResponse(200, {'Content-type': 'text/html'}, Templater.render('post.nunjucks', post));
      }).catch(this.responseError404.bind(this, response));
    } else {
      this.responseError404();
    }
  }

  /**
   * Send a response back to the server
   */
  sendResponse(statusCode = 503, headers = {'Content-type': 'text/plain'}, content = 'An error occurred') {
    try {
      // Try to use gzip or deflate
      const acceptEncoding = this.request.headers['accept-encoding'];
      if (acceptEncoding && headers['Content-type'].substr(0, 5) === 'text/') {
        if (acceptEncoding.match(/\bdeflate\b/)) {
          headers['Content-encoding'] = 'deflate';
          content = zlib.deflateSync(new Buffer(content, 'utf8'));
        } else if (0 && acceptEncoding.match(/\bgzip\b/)) {
          headers['Content-encoding'] = 'gzip';
          content = zlib.gunzipSync(new Buffer(content, 'utf8'));
        }
      }

      // Calculate content length
      headers['Content-length'] = Buffer.byteLength(content);

      // Send the headers
      this.response.writeHead(statusCode, headers);

      // Write the body
      this.response.write(content);

      // Finish the connection
      this.response.end();
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Respond with a file
   * @param {String} filepath The path of the file to be loaded, relative to process.cwd()
   */
  responseFile(filepath) {
    const _this = this;
    fs.readFile(filepath, function(err, contents) {
      if (err) {
        return _this.responseError404();
      }

      const extension = path.extname(filepath);
      const contentType = _this.contentType[extension.toLowerCase()];

      _this.sendResponse(200, {'Content-type': contentType}, contents);
    });
  }

  /**
   * Handle an error. Example usage: .catch(handleError.bind(process, response))
   */
  responseError404() {
    this.sendResponse(404, {'Content-type': 'text/html'}, Templater.render('errors/404.nunjucks'));
  }

  /**
   * Handle an error. Example usage: .catch(handleError.bind(process, response))
   * @param Error The error that was thrown
   */
  responseErrorInternal(err) {
    const errorId = 'E-' + Date.now();
    fs.appendFile('error.log', `${errorId}: ${err.message}\n`);
    this.sendResponse(503, {'Content-type': 'text/html'}, Templater.render('errors/internal.nunjucks', {errorId}));
  }
}

module.exports = Router;

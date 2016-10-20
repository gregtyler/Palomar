const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const Templater = require('./Templater');
const Post = require('../models/Post');
const Readable = require('stream').Readable;

class Router {
  constructor() {
    this.listeners = [];
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
    const _this = this;
    try {
      // Turn the content into a stream for default encoding
      let stream = new Readable();
      stream.push(content);
      stream.push(null);

      // If the browser supports gzip, use that
      // Deflate is currently disabled because of issues in IE
      const acceptEncoding = this.request.headers['accept-encoding'];
      if (acceptEncoding && headers['Content-type'].substr(0, 5) === 'text/') {
        if (acceptEncoding.match(/\bgzip\b/)) {
          // Set headers
          headers['Content-encoding'] = 'gzip';
          headers.Vary = 'encoding';
          // Remove content length header
          delete headers['Content-length'];
          // Create GZip stream
          stream = zlib.createGzip();
        } else if (0 && acceptEncoding.match(/\bdeflate\b/)) {
          headers['Content-encoding'] = 'deflate';
          headers.Vary = 'encoding';
          delete headers['Content-length'];
          stream = zlib.createDeflate();
        }
      }

      // Set the content length if its uncompressed
      if (typeof headers['Content-encoding'] === 'undefined') {
        headers['Content-length'] = content.length;
      } else {
        // Send the content into the stream
        stream.end(content);
      }

      // Send the headers
      _this.response.writeHead(statusCode, headers);

      // Write the body
      stream.on('data', function(chunk) {
        if (!_this.response.write(chunk)) {
          stream.pause();
        }
      });

      // Finish the connection
      stream.on('end', function() {
        _this.response.end();
      });
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

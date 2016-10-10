const fs = require('fs');
const path = require('path');
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
    if (request.url === '/main.css') {
      this.passFile(response, 'public/main.css');
    } else if (request.url.match(/^\/assets\/user-images\/([a-z0-9-_ ]+\.([a-z0-9]+))$/)) {
      const match = request.url.match(/^\/assets\/user-images\/([a-z0-9-_ ]+\.[a-z0-9]+)$/);
      this.passFile(response, 'data/images/' + match[1]);
    } else if (request.url === '/') {
      response.end(Templater.render('home.nunjucks'));
    } else if (request.url.match(/^\/([a-z0-9-_]+)$/i)) {
      // Find the requested post
      const postId = request.url.substr(1);
      Post.find(postId).then(function(post) {
        // Show the post
        response.end(Templater.render('post.nunjucks', post));
      }).catch(this.responseError404.bind(process, response));
    } else {
      this.responseError404(response);
    }
  }

  /**
   * Respond with a file
   */
  passFile(response, filepath) {
    const _this = this;
    fs.readFile(filepath, 'utf8', function(err, contents) {
      if (err) {
        return _this.responseError404(response);
      }

      const extension = path.extname(filepath);

      response.statusCode = 200;
      response.setHeader('Content-type', _this.contentType[extension.toLowerCase()]);
      response.write(contents);
      response.end();
    });
  }

  /**
   * Handle an error. Example usage: .catch(handleError.bind(process, response))
   * @param Error The error that was thrown
   */
  responseError404(response) {
    response.statusCode = 404;
    response.setHeader('Content-type', 'text/html');
    response.end(Templater.render('errors/404.nunjucks'));
  }

  /**
   * Handle an error. Example usage: .catch(handleError.bind(process, response))
   * @param Error The error that was thrown
   */
  responseErrorInternal(response, err) {
    response.statusCode = 503;
    response.setHeader('Content-type', 'text/html');
    const errorId = 'E-' + Date.now();
    fs.appendFile('error.log', `${errorId}: ${err.message}\n`);
    response.end(Templater.render('errors/internal.nunjucks', {errorId}));
  }
}

module.exports = Router;

// Load the HTTP module
const http = require('http');
const fs = require('fs');
const path = require('path');
const Templater = require('./lib/Templater');
const Post = require('./models/Post');

// Define server port (proxied to URL through Apache)
const PORT = 4141;

/**
 * Handle an error. Example usage: .catch(handleError.bind(process, response))
 * @param Error The error that was thrown
 */
/*function responseErrorInternal(response, err) {
  response.statusCode = 503;
  response.setHeader('Content-type', 'text/html');
  const errorId = 'E-' + Date.now();
  fs.appendFile('error.log', `${errorId}: ${err.message}\n`);
  response.end(Templater.render('errors/internal.nunjucks', {errorId}));
}*/

/**
 * Handle an error. Example usage: .catch(handleError.bind(process, response))
 * @param Error The error that was thrown
 */
function responseError404(response) {
  response.statusCode = 404;
  response.setHeader('Content-type', 'text/html');
  response.end(Templater.render('errors/404.nunjucks'));
}

const contentType = {
  '.css': 'text/css',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpg',
  '.png': 'image/png'
};

/**
 * Try to pass through a file, but throw a 404 if it couldn't be found
 */
function passFile(response, filepath) {
  fs.readFile(filepath, 'utf8', function(err, contents) {
    if (err) {
      return responseError404(response);
    }

    const extension = path.extname(filepath);

    response.statusCode = 200;
    response.setHeader('Content-type', contentType[extension.toLowerCase()]);
    response.end(contents);
  });
}

/**
 * Handle a request to the server
 * @param Request request The details of the server request
 * @param Response response An object to generate the response in
 */
function handleRequest(request, response) {
  if (request.url === '/main.css') {
    passFile(response, 'public/main.css');
  } else if (request.url.match(/^\/assets\/user-images\/([a-z0-9-_ ]+\.([a-z0-9]+))$/)) {
    const match = request.url.match(/^\/assets\/user-images\/([a-z0-9-_ ]+\.[a-z0-9]+)$/);
    passFile(response, 'data/images/' + match[1]);
  } else if (request.url === '/') {
    response.end(Templater.render('home.nunjucks'));
  } else if (request.url.match(/^\/([a-z0-9-_])$/i)) {
    // Find the requested post
    const postId = request.url.substr(1);
    Post.find(postId).then(function(post) {
      // Show the post
      response.end(Templater.render('post.nunjucks', post));
    }).catch(responseError404.bind(process, response));
  } else {
    responseError404(response);
  }
}

// Create a server and register the resposne function
const server = http.createServer(handleRequest);

// Start the server
server.listen(PORT, function() {
  console.log('Server listening on: http://localhost:%s', PORT);
});

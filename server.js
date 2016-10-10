// Load the HTTP module
const http = require('http');
const fs = require('fs');
const Templater = require('./lib/Templater');
const Post = require('./models/Post');

// Define server port (proxied to URL through Apache)
const PORT = 4141;

/**
 * Handle an error
 * @param Error The error that was thrown
 */
/*function handleError(response, err) {
  response.statusCode = 404;
  const errorId = 'E-' + Date.now();
  fs.appendFile('error.log', `${errorId}: ${err.message}\n`);
  response.end(Templater.render('error.nunjucks', {errorId}));
}*/
// .catch(handleError.bind(process, response))

/**
 * Handle a request to the server
 * @param Request request The details of the server request
 * @param Response response An object to generate the response in
 */
function handleRequest(request, response) {
  if (request.url === '/main.css') {
    response.statusCode = 200;
    response.setHeader('Content-type', 'text/css');
    fs.readFile('public' + request.url, function(err, contents) {
      if (err) throw err;
      response.end(contents);
    });
  } else if (request.url.match(/\/assets\/user-images\/([a-z0-9-_ ]+\.([a-z0-9]+))/)) {
    const a = request.url.match(/\/assets\/user-images\/([a-z0-9-_ ]+\.[a-z0-9]+)/);
    response.statusCode = 200;
    response.setHeader('Content-type', 'image/jpeg');
    fs.readFile('data/images/' + a[1], function(err, contents) {
      if (err) throw err;
      response.end(contents);
    });
  } else if (request.url === '/') {
    response.end(Templater.render('home.nunjucks'));
  } else {
    // Find the requested post
    const postId = request.url.substr(1);
    Post.find(postId).then(function(post) {
      // Show the post
      response.end(Templater.render('post.nunjucks', post));
    }).catch(function() {
      // If the post wasn't found, show an error message
      response.statusCode = '404';
      response.end(Templater.render('error.nunjucks', {
        title: 'Post not found',
        message: 'The requested post could not be found. It may have been moved, or deleted or renamed.'
      }));
    });
  }
}

// Create a server and register the resposne function
const server = http.createServer(handleRequest);

// Start the server
server.listen(PORT, function() {
  console.log('Server listening on: http://localhost:%s', PORT);
});

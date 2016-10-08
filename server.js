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
function handleError(response, err) {
  response.statusCode = 404;
  const errorId = 'E-' + Date.now();
  fs.appendFile('error.log', `${errorId}: ${err.message}\n`);
  response.end(Templater.render('error.nunjucks', {errorId}));
}

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
      response.write(contents);
      response.end();
    });
  } else {
    Post.find('test-article').then(function(post) {
      response.write(Templater.render('post.nunjucks', post));
      response.end();
    }).catch(handleError.bind(process, response));
  }
}

// Create a server and register the resposne function
const server = http.createServer(handleRequest);

// Start the server
server.listen(PORT, function() {
  console.log('Server listening on: http://localhost:%s', PORT);
});

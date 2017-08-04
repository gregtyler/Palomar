// Load the HTTP module
const http = require('http');
const Router = require('./lib/Router');
const respond = require('./lib/respond');
const routes = require('./lib/routes');

// Define server port (proxied to URL through Apache)
const PORT = 4141;

// Create a server and register the resposne function
const server = http.createServer(function() {
  const router = new Router();

  // Define error responses
  router.notFound(() => {
    return respond.template('errors/404.nunjucks', {}, {'Content-type': 'text/html', status: 404});
  });

  router.error(() => {
    return respond.text('500 error occurred', {'Content-type': 'text/plain', status: 500});
  });

  // Load Palomar routes
  routes(router);

  router.handleRequest.apply(router, arguments);
});

// Start the server
server.listen(PORT, function() {
  console.log('Server listening on: http://localhost:%s', PORT);
});

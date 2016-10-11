// Load the HTTP module
const http = require('http');
const Router = require('./lib/Router');

// Define server port (proxied to URL through Apache)
const PORT = 4141;

// Create a server and register the resposne function
const server = http.createServer(function() {
  const router = new Router();
  router.handleRequest.apply(router, arguments);
});

// Start the server
server.listen(PORT, function() {
  console.log('Server listening on: http://localhost:%s', PORT);
});

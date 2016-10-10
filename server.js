// Load the HTTP module
const http = require('http');
const Router = require('./lib/Router');
const router = new Router();

// Define server port (proxied to URL through Apache)
const PORT = 4141;

// Create a server and register the resposne function
const server = http.createServer(router.handleRequest.bind(router));

// Start the server
server.listen(PORT, function() {
  console.log('Server listening on: http://localhost:%s', PORT);
});

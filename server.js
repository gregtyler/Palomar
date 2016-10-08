// Load the HTTP module
const http = require('http');
const fs = require('fs');
const Templater = require('./lib/Templater');

// Define server port (proxied to URL through Apache)
const PORT = 4141;

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
    const post = {
      title: 'James',
      body: 'Article contents',
      author: {
        name: 'Greg Tyler',
        email: 'greg@gregtyler.co.uk'
      },
      published: new Date('2016-10-08T06:39:13Z')
    };
    response.write(Templater.render('post.nunjucks', post));
    response.end();
  }
}

// Create a server and register the resposne function
const server = http.createServer(handleRequest);

// Start the server
server.listen(PORT, function() {
  console.log('Server listening on: http://localhost:%s', PORT);
});

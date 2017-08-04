const zlib = require('zlib');

class Router {
  constructor() {
    this.headers = [];
    this.patterns = [];
  }

 /**
  * What to do if a certain pattern is found in the URL
  * @param {Regex} pattern The regex pattern to match
  * @param {Function} callback The function to perform if the pattern is matched
  */
  match(pattern, callback) {
    this.patterns.push({pattern, callback});
  }

  notFound(callback) {
    this.patterns.notFound = callback;
  }

  error(callback) {
    this.patterns.error = callback;
  }

 /**
  * Handle a request to the server
  * @param {Request} request The details of the server request
  * @param {Response} response An object to generate the response in
  */
  handleRequest(request, response) {
    this.request = request;
    this.response = response;

    let url = request.url;

    // Extract query string
    const p = url.indexOf('?');
    if (p !== -1) {
      url = url.substr(0, p);
    }

    let matchFound = false;

    // Find a matching pattern
    this.patterns.forEach(({pattern, callback}) => {
      if (!matchFound && pattern && url.match(pattern)) {
        matchFound = true;
        this.run(callback, url)
          .catch(() => {
            this.run(this.patterns.error, url);
          });

        // Stop the loop
        return false;
      }
    });

    if (!matchFound) {
      this.run(this.patterns.notFound, url);
    }
  }

 /**
  * Perform a registered callback
  * @param {Function} callback The callback to perform
  * @param {String} url The URL that was matched (may have been trimmed/altered)
  */
  run(callback, url) {
    const result = callback.call(process, url, this.request);
    return result.then(response => {
      if (typeof response === 'undefined') {
        this.run(this.patterns.notFound, url, this.request);
      } else {
        const {contents, headers} = response;
        this.render(contents, headers);
      }
    });
  }

 /**
  * Compress some content, according to the encoding the browser supports
  * @param {String} content The content to compress
  * @param {String} acceptEncoding The "Accept-Encoding" header sent in the request
  */
  compress(content, acceptEncoding) {
    const _this = this;

    return new Promise(function(resolve) {
      if (acceptEncoding.match(/\bgzip\b/)) {
        // Set headers
        _this.headers['Content-encoding'] = 'gzip';
        _this.headers.Vary = 'Accept-Encoding';

        zlib.gzip(content, function(err, out) {
          resolve(out);
        });
      } else {
        resolve(content);
      }
    });
  }

  /**
   * Send a response back to the server
   * @param {String} content The page content
   * @param {Object} headers The headers to send with the page
   */
  render(content = 'An error occurred', headers = {'Content-type': 'text/plain', status: 503}) {
    const _this = this;
    let statusCode;
    _this.headers = headers;

    if (headers.status) {
      statusCode = headers.status;
      delete headers.status;
    } else {
      statusCode = 200;
    }

    // If the browser supports gzip, use that
    // Deflate is currently disabled because of issues in IE
    const acceptEncoding = this.request.headers['accept-encoding'];

    new Promise(function(resolve) {
      if (acceptEncoding && headers['Content-type'] && (headers['Content-type'].substr(0, 5) === 'text/' || headers['Content-type'] === 'image/svg+xml')) {
        resolve(_this.compress(content, acceptEncoding));
      } else {
        resolve(content);
      }
    }).then(function(content) {
      // Set the content length if its uncompressed
      if (typeof _this.headers['Content-encoding'] === 'undefined') {
        _this.headers['Content-length'] = Buffer.byteLength(content);
      }

      // Send the headers
      _this.response.writeHead(statusCode, _this.headers);

      // Write the body
      _this.response.write(content);
      _this.response.end();
    }).catch(function(err) {
      throw err;
    });
  }
}

module.exports = Router;

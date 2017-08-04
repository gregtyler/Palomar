const fs = require('fs');
const path = require('path');
const md5 = require('md5');
const render = require('./render');

const contentType = {
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

/**
 * Pass through file contents
 *
 * Sets content-type, cache-control and adds an etag if suitable
 * @param {String} filepath The file to pass through
 * @param {Request} request The page request
 */
function file(filepath, request) {
  const stat = fs.statSync(filepath);

  return new Promise(function(resolve) {
    fs.readFile(filepath, function(err, contents) {
      if (err) {
        return;
      }

      const extension = path.extname(filepath);
      const thisContentType = contentType[extension.toLowerCase()];
      const etag = md5(request.url + stat.mtime);

      resolve({
        contents,
        headers: {
          'Content-type': thisContentType,
          'Cache-Control': 'max-age=604800',
          Etag: etag,
          status: request.headers['if-none-match'] === etag ? 304 : 200
        }
      });
    });
  });
}

/**
 * Pass through plain text
 * @param {String} text The text to passthrough
 * @param {Object} headers Any additional headers to respond with
 */
function text(text, headers = {}) {
  return Promise.resolve({
    contents: text,
    headers: headers
  });
}

/**
 * Generate a template and pass on
 * @param {String} template The template to generate
 * @param {Object} data The template data
 * @param {Object} headers Any additional headers to respond with
 */
function template(template, data, headers) {
  return Promise.resolve({
    contents: render(template, data),
    headers: headers
  });
}

module.exports = {
  file,
  text,
  template
};

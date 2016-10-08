const fs = require('fs');
const parsePostFile = require('../lib/parsePostFile');

module.exports.find = function find(id) {
  let matchFound = false;

  return new Promise(function(resolve, reject) {
    // Look through the data directory
    fs.readdir('data', function(err, files) {
      if (err) reject(err);
      for (const filename of files) {
        // Check if the filename matches what we're searching for
        if (filename.substr(9, filename.length - 12) === id) {
          matchFound = true;
          // Get the contents of the file
          fs.readFile(`data/${filename}`, 'utf-8', function(err, contents) {
            if (err) {
              reject(err);
            } else {
              // Get the post details out of the file
              const post = parsePostFile(contents);
              resolve(post);
            }
          });
        }
      }

      // Throw an error if no post was found
      if (!matchFound) {
        reject(new Error('Post not found'));
      }
    });
  });
};

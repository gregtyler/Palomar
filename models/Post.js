const fs = require('fs');
const parsePostFile = require('../lib/parsePostFile');

module.exports.find = function find(id) {
  return new Promise(function(resolve, reject) {
    fs.readFile(`data/${id}.md`, 'utf-8', function(err, contents) {
      if (err) {
        reject(err);
      } else {
        resolve(parsePostFile(contents));
      }
    });
  });
};

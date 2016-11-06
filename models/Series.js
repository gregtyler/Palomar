const fs = require('fs');
const path = require('path');

const indexFilename = '_index.json';

module.exports.all = function all(criteria) {
  const all = [];

  if (typeof criteria !== 'object') criteria = {};

  return new Promise(function(resolve, reject) {
    fs.readdir('data', function(err, files) {
      if (err) reject(err);
      for (let index = 0, l = files.length; index < l; index++) {
        const file = files[index];
        const filepath = path.resolve('data', file);
        fs.stat(filepath, function(err, stat) {
          if (err) reject(err);
          if (stat && stat.isDirectory()) {
            fs.readFile(`${filepath}/${indexFilename}`, function(err, contents) {
              if (err) return; // File doesn't exist
              const details = JSON.parse(contents);
              all.push({label: details.label, url: `/${file}`});
            });

            // If that's the end of the loop then quit
            if (index === files.length - 1) {
              resolve(all);
            }
          }
        });
      }
    });
  }).then(function(series) {
    // Sort series if requested
    if (typeof criteria.order !== 'string') {
      criteria.order = 'label';
    }

    const orderRev = criteria.order.substr(-1) === '^' ? true : false;
    const orderParam = criteria.order.replace(/\^+$/, '');
    series.sort(function(a, b) {
      return (orderRev ? -1 : 1) * (a[orderParam] > b[orderParam] ? 1 : -1);
    });

    // Return posts
    return series;
  });
};

module.exports.find = function find(criteria) {
  return this.all(criteria).then(function(all) {
    return (all.length === '' ? null : all[0]);
  });
};

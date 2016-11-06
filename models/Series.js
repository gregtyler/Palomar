const fs = require('fs');
const path = require('path');

const indexFilename = '_index.json';

module.exports.all = function all(criteria) {
  if (typeof criteria !== 'object') criteria = {};

  return new Promise(function(resolve, reject) {
    const proms = [];
    fs.readdir('data', function(err, files) {
      if (err) reject(err);
      for (let index = 0, l = files.length; index < l; index++) {
        const file = files[index];
        const filepath = path.resolve('data', file);
        proms.push(new Promise(function(resolve, reject) {
          fs.stat(filepath, function(err, stat) {
            if (err) reject(err);
            if (stat && stat.isDirectory()) {
              fs.readFile(`${filepath}/${indexFilename}`, function(err, contents) {
                if (err) return resolve(null); // File doesn't exist
                const details = JSON.parse(contents);
                details.url = `/${file}`;
                resolve(details);
              });
            } else {
              resolve(null);
            }
          });
        }));
      }

      Promise.all(proms).then(function(series) {
        resolve(series.filter(a => !!a));
      });
    });
  }).then(function(series) {
    // Filter series if requested
    if (typeof criteria.showOnHomePage === 'boolean') {
      series = series.filter(a => a.showOnHomePage === criteria.showOnHomePage);
    }

    // Sort series if requested
    if (typeof criteria.order !== 'string') {
      criteria.order = 'label';
    }

    const orderRev = criteria.order.substr(-1) === '^' ? true : false;
    const orderParam = criteria.order.replace(/\^+$/, '');
    series.sort(function(a, b) {
      return (orderRev ? -1 : 1) * (a[orderParam] > b[orderParam] ? 1 : -1);
    });

    // Return series
    return series;
  });
};

module.exports.find = function find(criteria) {
  return this.all(criteria).then(function(all) {
    return (all.length === '' ? null : all[0]);
  });
};

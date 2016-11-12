const fs = require('fs');
const {sortModels, rangeModels} = require('../lib/model.js');
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

        if (typeof criteria.series === 'string' && criteria.series !== file) continue;

        proms.push(new Promise(function(resolve, reject) {
          fs.stat(filepath, function(err, stat) {
            if (err) reject(err);
            if (stat && stat.isDirectory()) {
              fs.readFile(`${filepath}/${indexFilename}`, function(err, contents) {
                if (err) return resolve(null); // File doesn't exist
                const details = JSON.parse(contents);
                details.url = `/${file}`;
                details.id = file;
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
      sortModels(series, criteria.order);
    }

    if (typeof criteria.limit === 'number' || typeof criteria.offset === 'number') {
      series = rangeModels(series, criteria.limit, criteria.offset);
    }

    // Return series
    return series;
  });
};

module.exports.find = function find(criteria) {
  return this.all(criteria).then(function(all) {
    return (all.length === '' ? null : all[0]);
  });
};

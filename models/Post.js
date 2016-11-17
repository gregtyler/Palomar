const parsePostFile = require('../lib/parsePostFile');
const {sortModels, rangeModels} = require('../lib/model.js');
const walk = require('../lib/walk');

module.exports.all = function all(criteria) {
  criteria = Object.assign({}, criteria);
  const searchDir = typeof criteria.series === 'string' ? `data/${criteria.series}` : 'data';
  const proms = [];

  return walk(searchDir).then(function(files) {
    for (const filepath of files) {
      // Skip non-markdown files
      if (filepath.substr(-3) !== '.md') {
        continue;
      }

      // If we're looking for a particular slug, check the filename matches it
      if (typeof criteria.id === 'string' && filepath.indexOf(criteria.id + '.md') === -1) {
        continue;
      }

      // Get the contents of the file
      proms.push(parsePostFile(filepath));
    }

    return Promise.all(proms).then(function(posts) {
      // Sort posts if requested
      if (typeof criteria.order === 'string') {
        sortModels(posts, criteria.order);
      }

      if (typeof criteria.limit === 'number' || typeof criteria.offset === 'number') {
        posts = rangeModels(posts, criteria.limit, criteria.offset);
      }

      // Return posts
      return posts;
    });
  });
};

module.exports.find = function find(criteria) {
  return this.all(criteria).then(function(all) {
    return (all.length === '' ? null : all[0]);
  });
};

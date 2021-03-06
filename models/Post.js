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

      // Remove future posts
      posts = posts.filter(function(post) {
        return post.published <= new Date() || typeof post.published === 'undefined';
      });

      if (!criteria.single) {
        posts = posts.filter(function(post) {
          return typeof post.published !== 'undefined';
        });
      }

      // Remove ones supposed to be hidden from the homepage
      if (criteria.homepage) {
        posts = posts.filter(function(post) {
          return post.series !== 'christmas-2016';
        });
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
  criteria.single = true;
  return this.all(criteria).then(function(all) {
    return (all.length === '' ? null : all[0]);
  });
};

const parsePostFile = require('../lib/parsePostFile');
const walk = require('../lib/walk');

module.exports.all = function all(criteria) {
  const searchDir = typeof criteria.series === 'string' ? `data/${criteria.series}` : 'data';
  const proms = [];

  return walk(searchDir).then(function(files) {
    for (const filepath of files) {
      // Skip non-markdown files
      if (filepath.substr(-3) !== '.md') {
        continue;
      }

      // If we're looking for a particular slug, check the filename matches it
      if (typeof criteria.id === 'string' && filepath.substr(9, filepath.length - 12) !== criteria.id) {
        continue;
      }

      // Get the contents of the file
      proms.push(parsePostFile(filepath));
    }

    return Promise.all(proms).then(function(posts) {
      // Sort posts if requested
      if (typeof criteria.order === 'string') {
        const orderRev = criteria.order.substr(-1) === '^' ? true : false;
        const orderParam = criteria.order.replace(/\^+$/, '');
        posts.sort(function(a, b) {
          return (orderRev ? -1 : 1) * (a[orderParam] > b[orderParam] ? 1 : -1);
        });
      }

      // Return posts
      return posts;
    });
  });
};

module.exports.find = function find(criteria) {
  const all = this.all(criteria);
  return (all.length === '' ? null : all[0]);
};

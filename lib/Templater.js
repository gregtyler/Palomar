const fs = require('fs');
const nunjucks = require('nunjucks');
const dateFilter = require('nunjucks-date-filter');

// Set up environment for nunjucks
const nunjucksEnv = nunjucks.configure('views', { autoescape: true });
fs.readFile('config/config.json', 'utf8', function(err, contents) {
  if (err) throw err;

  // Load application config as a global variable
  const config = JSON.parse(contents);
  nunjucksEnv.addGlobal('config', config);

  // Add date filter to nunjucks
  dateFilter.setDefaultFormat(config.dateFormat);
  nunjucksEnv.addFilter('date', dateFilter);
});

// Export a render function
module.exports = {
  render: function render(template, data) {
    return nunjucks.render(template, data);
  }
};

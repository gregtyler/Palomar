const fs = require('fs');
const nunjucks = require('nunjucks');
const dateFilter = require('nunjucks-date-filter');

/**
 * Define the icon extension
 */
function IconExtension() {
  this.tags = ['icon'];

  this.parse = function(parser, nodes) {
    const tok = parser.nextToken();

    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtension(this, 'run', args);
  };

  this.run = function(context, iconName) {
    return new nunjucks.runtime.SafeString(`<svg class="o-svg-icon"><use xlink:href="/icons.svg#icon-${iconName}"/></svg>`);
  };
}

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

  // Add icon function to nunjucks
  nunjucksEnv.addExtension('IconExtension', new IconExtension());
});

// Export a render function
module.exports = {
  render: function render(template, data) {
    return nunjucks.render(template, data);
  }
};

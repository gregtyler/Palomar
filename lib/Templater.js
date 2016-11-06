const fs = require('fs');
const nunjucks = require('nunjucks');
const dateFilter = require('nunjucks-date-filter');

let icons = [];

/**
 * Define the icon extension
 */
function IconExtension() {
  this.tags = ['icon', 'iconOutput'];

  this.parse = function(parser, nodes) {
    const tok = parser.nextToken();

    if (tok.value === 'icon') {
      const args = parser.parseSignature(null, true);
      parser.advanceAfterBlockEnd(tok.value);
      return new nodes.CallExtension(this, 'icon', args);
    } else {
      const args = parser.parseSignature(null, true);
      parser.advanceAfterBlockEnd(tok.value);
      return new nodes.CallExtension(this, 'iconOutput', args);
    }
  };

  this.icon = function(context, iconName) {
    icons.push(iconName);

    return new nunjucks.runtime.SafeString(`<svg class="o-svg-icon"><use xlink:href="#icon-${iconName}"/></svg>`);
  };

  this.iconOutput = function() {
    const svgs = [];

    // Generate the HTML
    icons.forEach(function(iconName) {
      const contents = fs.readFileSync(`assets/img/${iconName}.svg`);

      svgs.push(contents);
    });

    // Reset the list
    icons = [];

    // Join the SVGs together and output them
    return new nunjucks.runtime.SafeString('<div hidden>' + svgs.join('') + '</div>');
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

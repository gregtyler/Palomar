const fs = require('fs');
const nunjucks = require('nunjucks');
const dateFilter = require('nunjucks-date-filter');
const marked = require('marked');
const markedRenderer = new marked.Renderer();

markedRenderer.image = function image(href, title, text) {
  // Set the image href to the correct directory
  if (href.substr(0, 1) === '/') {
    href = href.substr(1);
    href = '/user-images/' + href;
  }

  let alignment = 'default';

  if (title && title.substr(0, 1) === ':') {
    //const alignLength = (title.substr(0, 5) === ':left') ? 5 : ((title.substr(0, 6) === ':right') ? 6 : 7);
    const parts = title.match(/:([a-z]+)(?: (.*))?/i);
    alignment = parts[1];
    title = parts[2];
  }

  // Render the image
  return `<div class="o-media o-media--${alignment}">
    <img src="${href}" alt="${text}" />
    ` + (title ? `<div class="o-media__caption">${title}</div>` : '') + `
  </div>`;
};

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

  // Add markdown filter to nunjucks
  nunjucksEnv.addFilter('markdown', function(text) {
    if (typeof text === 'undefined') return '';
    return new nunjucks.runtime.SafeString(marked(text, {renderer: markedRenderer}));
  });

  // Add icon function to nunjucks
  nunjucksEnv.addExtension('IconExtension', new IconExtension());
});

// Export a render function
module.exports = {
  render: function render(template, data) {
    return nunjucks.render(template, data);
  }
};

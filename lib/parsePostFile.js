const fs = require('fs');
const marked = require('marked');
const getExcerpt = require('./getExcerpt');
const markedRenderer = new marked.Renderer();

markedRenderer.image = function image(href, title, text) {
  // Set the image href to the correct directory
  if (href.substr(0, 1) === '/') href = href.substr(1);
  href = '/user-images/' + href;
  let alignment = 'default';

  if (title && (title.substr(0, 5) === ':left' || title.substr(0, 6) === ':right')) {
    alignment = (title.substr(0, 5) === ':left') ? 'left' : 'right';
    title = title.substr(alignment === 'left' ? 6 : 7);
  }
  // Render the image
  return `<div class="o-media o-media--${alignment}">
    <img src="${href}" alt="${text}"` + (title ? ` title="${title}"` : '') + ` />
  </div>`;
};

/**
 * Parse a particular value of the post syntax
 * @param String key The key of the parameter
 * @param String value The value to be parsed
 * @returns Mixed The parsed value
 */
function parsePostParameter(key, value) {
  if (key === 'author') {
    const [, name, email] = value.match(/^(.*?) <(.*?)>$/i);
    return {name, email};
  } else if (key === 'published') {
    return new Date(value);
  } else {
    return value;
  }
}

module.exports = function parsePostFile(filepath) {
  return new Promise(function(resolve, reject) {
    fs.readFile(`${filepath}`, 'utf-8', function(err, contents) {
      if (err) reject(err);
      // Get the post details out of the file
      const lines = contents.split(/([\r\n]+)/);
      const obj = {};
      let hasTitleBeenParsed = false;

      // Look at each line of the file
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === '\n\n') {
          if (hasTitleBeenParsed) {
            // If the title's already been parsed, then make the body out of the
            // remaining lines
            obj.bodyMarkdown = lines.slice(i + 1).join('\n').trim();
            obj.body = marked(obj.bodyMarkdown, {renderer: markedRenderer});
            break;
          } else {
            // Match a title as the contents of the next line
            obj.title = lines[++i];
            hasTitleBeenParsed = true;
          }
        } else {
          // Post properties
          const match = line.match(/^([a-z0-9 _-]+): *(.+)$/i);
          if (match) {
            // Convert key to camel case
            const key = match[1].toLowerCase().replace(/ ./g, function(spaceAnd) {
              return spaceAnd.substr(1).toUpperCase();
            });
            // Add the property to the post object
            obj[key] = parsePostParameter(key, match[2]);
          }
        }
      }

      // Add excerpt
      if (typeof obj.excerpt === 'undefined') {
        obj.excerpt = getExcerpt(obj.bodyMarkdown);
      }

      // Add series and slug
      const fileparts = filepath.split('\\');
      const filename = fileparts.pop();
      obj.slug = filename.substr(9, filename.length - 9 - 3);
      obj.series = fileparts.pop();

      // Add URL
      obj.url = `/${obj.series}/${obj.slug}`;

      resolve(obj);
    });
  });
};

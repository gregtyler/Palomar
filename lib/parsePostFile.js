const marked = require('marked');
const markedRenderer = new marked.Renderer();

const previousImageRender = markedRenderer.image;
markedRenderer.image = function image(href, title, text) {
  // Set the image href to the correct directory
  if (href.substr(0, 1) === '/') href = href.substr(1);
  href = '/assets/user-images/' + href;
  // Use the old method with the new href
  return previousImageRender.call(markedRenderer, href, title, text);
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
  } else {
    return value;
  }
}

module.exports = function parsePostFile(file) {
  const lines = file.split(/([\r\n]+)/);
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

  return obj;
};

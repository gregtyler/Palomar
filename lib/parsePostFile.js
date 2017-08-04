const fs = require('fs');
const generateStandfirst = require('./generateStandfirst');

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
            obj.body = lines.slice(i + 1).join('').trim();
            break;
          } else {
            // Match a title as the contents of the next line
            obj.title = lines[++i].replace(/^#/g, '').trim();
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

      // Add standfirst
      if (typeof obj.standfirst === 'undefined') {
        obj.standfirst = generateStandfirst(obj.body);
      }

      // Render markdown of the standfirst
      obj.standfirst = obj.standfirst.replace(/\\n/g, '\n');

      // Add series and slug
      const fileparts = filepath.split(/\\|\//);
      const filename = fileparts.pop();
      obj.slug = filename.substr(9, filename.length - 9 - 3);
      obj.series = fileparts.pop();

      // If there is no featured image specified, try and find one to use
      if (!obj.image && obj.body) {
        const matches = obj.body.match(/!\[(?:.*?)\]\(([^ ]+)(?:.+)\)/);
        if (matches) {
          obj.image = matches[1];
        }
      }

      // Change image into full url
      if (obj.image && obj.image.substr(0, 1) === '/') {
        obj.image = `/user-images${obj.image}`;
      }

      // Add URL
      obj.url = `/${obj.series}/${obj.slug}`;

      resolve(obj);
    });
  });
};

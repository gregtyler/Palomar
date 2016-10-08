function parsePostValue(value, key) {
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
        obj.body = lines.slice(i + 1).join('\n').trim();
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
        obj[key] = parsePostValue(match[2], key);
      }
    }
  }

  return obj;
};

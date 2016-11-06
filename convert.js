const querystring = require('querystring');
const http = require('http');
const fs = require('fs');
const csv = require('csv-parser');
const moment = require('moment');

const options = {
  host: 'heckyesmarkdown.com',
  port: 80,
  path: '/go/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
};

/**
 * Use Heck Yes Markdown to convert HTML to markdown
 */
function html2markdown(html) {
  return new Promise(function(resolve) {
    const req = http.request(options, function(res) {
      res.setEncoding('utf8');
      let body = '';
      // Build the body out of the chunks sent through
      res.on('data', function(chunk) {
        body += chunk;
      });

      res.on('end', function() {
        resolve(body.trim());
      });
    });

    // write data to request body
    req.write(querystring.stringify({html: html.replace(/\n+/g, '<br>')}));
    req.end();
  });
}

function createFile(data, body, excerpt) {
  // e.g. 14/12/2012 18:29:50
  const date = moment(data.post_date, 'YYYY-MM-DD HH:mm:ss');
  // Set the filename
  const filename = `${date.format('YYYYMMDD')}-${data.post_name}`;
  // Create the document
  let doc = '';
  doc += `Published: ${date.toISOString()}\n`;
  doc += `Author: Greg Tyler <greg@gregtyler.co.uk>\n`;
  if (excerpt) doc += `Excerpt: ${excerpt.replace(/\n/g,'\\n')}\n`;

  // Add additional fields if present
  if (data._thumbnail_id) doc += `_thumbnail_id: ${data._thumbnail_id}\n`;
  if (data.gregtyler_mega) doc += `gregtyler_mega: ${data.gregtyler_mega}\n`;
  if (data.gregtyler_post_style) doc += `gregtyler_post_style: ${data.gregtyler_post_style}\n`;
  if (data.gregtyler_feature) doc += `gregtyler_feature: ${data.gregtyler_feature}\n`;
  if (data.gregtyler_stylesheet) doc += `gregtyler_stylesheet: ${data.gregtyler_stylesheet}\n`;

  doc += `\n${data.post_title}\n`;

  // Add the compiled body
  doc += '\n' + body;

  // Write the file
  fs.writeFile(`data/legacy/${filename}.md`, doc, (err) => {
    if (err) throw err;
    console.log(`${filename} saved`);
  });
}

fs.createReadStream('data/legacy.csv')
  .pipe(csv())
  .on('data', function(data) {
    // Convert post content to HTML
    html2markdown(data.post_content).then(function(body) {
      if (data.post_excerpt.trim()) {
        html2markdown(data.post_excerpt.trim()).then(function(excerpt) {
          createFile(data, body, excerpt);
        });
      } else {
        createFile(data, body);
      }
    });
  });

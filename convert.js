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

fs.createReadStream('data/legacy.csv')
  .pipe(csv())
  .on('data', function(data) {
    // Use Heck Yes Markdown to convert HTML to markdown
    const req = http.request(options, function(res) {
      res.setEncoding('utf8');
      let body = '';
      // Build the body out of the chunks sent through
      res.on('data', function(chunk) {
        body += chunk;
      });

      res.on('end', function() {
        // e.g. 14/12/2012 18:29
        const date = moment(data.post_date, 'DD/MM/YYYY HH:mm');
        // Set the filename
        const filename = `${date.format('YYYYMMDD')}-${data.post_name}`;
        // Create the document
        let doc = '';
        doc += `Published: ${date.toISOString()}\n`;
        doc += `Author: Greg Tyler <greg@gregtyler.co.uk>\n`;
        if (data.post_excerpt) doc += `Excerpt: ${data.post_excerpt.replace('\n','\\n')}\n`;

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
      });
    });

    // write data to request body
    req.write(querystring.stringify({
      html: data.post_content
    }));
    req.end();
  });

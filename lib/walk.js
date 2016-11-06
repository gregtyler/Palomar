const fs = require('fs');
const path = require('path');

/**
 * Flatten a collection of directories and files, running additional walks if
 * necessary
 * @param {Array<string>} dirs The directories that still need to be walked
 * @param {Array<strong>} files The files that should be included
 * @resolves {array} The files provided, and those in the subdirectories
 */
function flattenWalk(dirs, files) {
  return new Promise(function(resolve) {
    // eslint-disable-next-line no-use-before-define
    Promise.all(dirs.map(dir => walk(dir))).then(function(dirSubfiles) {
      for (const subfiles of dirSubfiles) {
        files = files.concat(subfiles);
      }

      resolve(files);
    });
  });
}

/**
 * Find all the files in a directory and resolve them
 * @param {string} dir The directory to walk through
 * @resolves {array} All the files found in the directory and its subdirectories
 */
function walk(dir) {
  // We need to keep track of the directories and files found in the directory
  // we're currently walking
  const dirs = [];
  const files = [];

  return new Promise(function(resolve, reject) {
    // Scan the directory for everything in it
    fs.readdir(dir, function(err, list) {
      if (err) reject(err);
      // Check each item in the directory
      if (list) {
        list.forEach(function(file) {
          file = path.resolve(dir, file);
          fs.stat(file, function(err, stat) {
            // Based on whether it's a directory or not, add the item to the
            // appropriate list
            if (stat && stat.isDirectory()) {
              dirs.push(file);
            } else {
              files.push(file);
            }

            // Once we've totted up every item, flatten them and resolve that as
            // a complete list of files
            if (dirs.length + files.length === list.length) {
              resolve(flattenWalk(dirs, files));
            }
          });
        });
      }
    });
  });
}

module.exports = walk;

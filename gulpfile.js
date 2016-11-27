/* eslint-env node */
const fs = require('fs');
const gulp = require('gulp');
const cssnano = require('cssnano');
const cssvariables = require('postcss-css-variables');
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
const atImport = require('postcss-import');
const sftp = require('gulp-sftp');
const GulpSSH = require('gulp-ssh');
const config = require('./secret.json');

const gulpSSH = new GulpSSH({
  ignoreErrors: false,
  sshConfig: {
    host: config.host,
    port: 22,
    username: config.username,
    privateKey: fs.readFileSync(config.keyPath),
    passphrase: config.passphrase
  }
});

/**
 * Build the CSS file for the website
 */
function buildCSS(options) {
  options = Object.assign({sourcemaps: false}, options);

  const processors = [
    atImport(),
    cssvariables(),
    cssnano()
  ];

  // Run all the PostCSS processors
  let chain = gulp.src('assets/css/main.css')
    .pipe(sourcemaps.init())
      .pipe(postcss(processors));

  // If asked to, build a sourcemap
  if (options.sourcemaps) chain = chain.pipe(sourcemaps.write());

  // Output the file
  return chain.pipe(gulp.dest('public'));
}

gulp.task('deployFiles', ['buildCSSProd'], function() {
  return gulp.src(['config/*.json', 'lib/**/*.js', 'models/**/*.js', 'public/**/*.*', 'views/**/*.nunjucks', 'server.js', 'package.json'], {base: '.'})
    .pipe(sftp({
        host: config.host,
        user: config.username,
        key: {location: config.keyPath, passphrase: config.passphrase},
        remotePath: config.remotePath
    }));
});

gulp.task('restartPM2', ['deployFiles'], function() {
  return gulpSSH
    .exec(['pm2 restart server']);
});

// Build the CSS
gulp.task('buildCSSDev', buildCSS.bind(process, {sourcemaps: true}));
gulp.task('buildCSSProd', buildCSS.bind(process, {sourcemaps: false}));

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch('assets/css/**/*.css', ['buildCSSDev']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['watch', 'buildCSSDev']);

// Deployment
gulp.task('deploy', ['restartPM2']);

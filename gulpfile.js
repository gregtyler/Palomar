/* eslint-env node */
const gulp = require('gulp');
const cssnano = require('cssnano');
const cssvariables = require('postcss-css-variables');
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
const atImport = require('postcss-import');

// Build the CSS
gulp.task('buildCSS', function() {
  const processors = [
    atImport(),
    cssvariables(),
    cssnano()
  ];

  return gulp.src('assets/css/main.css')
    .pipe(sourcemaps.init())
      .pipe(postcss(processors))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('public'));
});

// Build the JS
/*gulp.task('buildJS', function() {
  return gulp.src(paths.scripts)
    .pipe(sourcemaps.init())
      .pipe(coffee())
      .pipe(uglify())
      .pipe(concat('all.min.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('public'));
});*/

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch('assets/css/**/*.css', ['buildCSS']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['watch', 'buildCSS']);

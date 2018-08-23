'use strict';
var fs = require('fs');
var exec = require('child_process').exec;
var gulp = require('gulp');
var merge = require('merge-stream');
var minify = require('gulp-minify');
var htmlmin = require('gulp-htmlmin');
var minifyCSS = require('gulp-minify-css');
var flatten = require('gulp-flatten');
var plugins = require('gulp-load-plugins')({
  lazy: false
});
var connect = require('gulp-connect');
var replace = require('gulp-replace');
var version = require('./package.json').version;
var tokenImages = fs.readdirSync('./src/components/app/img/tokens').map(function(file) {
  return file.replace('.svg', '');
});
var config = require('./config-dev.json');
if (process.argv[2] === 'deploy-prod') {
  config = require('./config-prod.json');
}

// Remove files and folders
gulp.task('clean', function() {
  return gulp.src([
    './dist'
  ], {
    read: false
  })
    .pipe(plugins.rimraf());
});

// Builds the templates
gulp.task('templates', function() {
  return gulp.src([
    '!./src/index.html',
    './src/components/**/*.html'
  ])
    .pipe(plugins.angularTemplatecache('templates.js', {
      standalone: true
    }))
    .pipe(replace('{~version~}', version))
    .pipe(replace('{~etherscan_url~}', config.etherscan_url))
    .pipe(gulp.dest('./dist'));
});

// Copy the static files
gulp.task('copy', function() {
  var images = gulp.src([
    './src/**/*.{svg,png,jpg,gif}'
  ])
    .pipe(flatten())
    .pipe(gulp.dest('./dist/img'));

  var fonts = gulp.src([
    './src/**/*.{otf,ttf}'
  ])
    .pipe(flatten())
    .pipe(gulp.dest('./dist/font'));

  var i18n = gulp.src([
    './src/i18n/*.json'
  ])
    .pipe(gulp.dest('./dist/i18n'));

  var favicon = gulp.src('./src/favicon.ico')
    .pipe(gulp.dest('./dist'));

  return merge(images, fonts, i18n, favicon);
});

// Replaces the usemin blocks by concatenation files
gulp.task('usemin', ['templates'], function() {
  return gulp.src('./src/index.html')
    .pipe(plugins.usemin())
    .pipe(replace('{~tokens~}', '["' + tokenImages.join('","') + '"]'))
    .pipe(replace('{~eth_dictionary~}', JSON.stringify(require('./eth_dictionary.json'))))
    .pipe(replace('{~config~}', JSON.stringify(config)))
    .pipe(gulp.dest('./dist'));
});

// minify/uglify js, html and css files
gulp.task('uglify', ['usemin'], function() {
  var js = gulp.src([
    //'./dist/libs.js',
    './dist/app.js'
  ])
    .pipe(minify({
      ext: {
        src: '-debug.js',
        min: '.js'
      },
      ignoreFiles: ['.min.js']
    }))
    .pipe(gulp.dest('./dist'));

  var html = gulp.src('./dist/index.html')
    .pipe(htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    }))
    .pipe(gulp.dest('./dist'));

  var css = gulp.src([
    './dist/libs.css',
    './dist/app.css'
  ])
    .pipe(minifyCSS())
    .pipe(gulp.dest('./dist'));

  return merge(js, html, css);
});

// Get a clean dist folder
gulp.task('build', ['usemin', 'copy'], function() {
  return gulp.src([
    './dist/app-debug.js',
    './dist/templates.js'
  ], {
    read: false
  })
    .pipe(plugins.rimraf());
});

// Watch for changes in order to re-run the build
gulp.task('watch', function() {
  gulp.watch(['./src/**/*'], ['build']);
});

// Serve the built project in a web server
gulp.task('connect', function() {
  connect.server({
    root: 'dist',
    port: 14613,
    https: true,
    fallback: 'dist/index.html',
    livereload: false
  });
});

gulp.task('serve', [
  'build',
  'connect',
  'watch'
]);

gulp.task('default', ['serve'], function() {
  console.log('Go to https://localhost:14613 to view your app !');
});

gulp.task('deploy-dev', ['build'], function(cb) {
  exec(config.deploy_cmd, function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);

    cb(err);
  });
});

gulp.task('deploy-prod', ['build', 'uglify'], function(cb) {
  exec(config.deploy_cmd, function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);

    cb(err);
  });
});

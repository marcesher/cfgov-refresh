'use strict';

/* scripts task
   ---------------
   Bundle javascripty things!
   This task is set up to generate multiple separate bundles,
   from different sources, and to use watch when run from the default task.
*/

var browserSync = require( 'browser-sync' );
var gulp = require( 'gulp' );
var gulpModernizr = require( 'gulp-modernizr' );
var gulpRename = require( 'gulp-rename' );
var gulpUglify = require( 'gulp-uglify' );
var handleErrors = require( '../utils/handleErrors' );
var paths = require( '../../config/environment' ).paths;
var webpackConfig = require( '../../config/webpack-config.js' );
var webpackStream = require( 'webpack-stream' );


/**
 * Generate modernizr polyfill bundle.
 * @returns {PassThrough} A source stream.
 */
function scriptsPolyfill() {
  return gulp.src( paths.unprocessed + '/js/routes/common.js' )
    .pipe( gulpModernizr( {
      tests:   [ 'csspointerevents', 'classlist', 'es5' ],
      options: [ 'setClasses',
                 'html5printshiv',
                 'fnBind' ]
    } ) )
    .pipe( gulpUglify() )
    .pipe( gulpRename( 'modernizr.min.js' ) )
    .on( 'error', handleErrors )
    .pipe( gulp.dest( paths.processed + '/js/' ) )
    .pipe( browserSync.reload( {
      stream: true
    } ) );
}

/**
 * Bundle scripts in unprocessed/js/routes/
 * and factor out common modules into common.js.
 * @returns {PassThrough} A source stream.
 */
function scriptsModern() {
  return gulp.src( paths.unprocessed + '/js/routes/common.js' )
    .pipe( webpackStream( webpackConfig.modernConf ) )
    .on( 'error', handleErrors )
    .pipe( gulp.dest( paths.processed + '/js/routes/' ) )
    .pipe( browserSync.reload( {
      stream: true
    } ) );
}

/**
 * Bundle IE9-specific script.
 * @returns {PassThrough} A source stream.
 */
function scriptsIE() {
  return gulp.src( paths.unprocessed + '/js/ie/common.ie.js' )
    .pipe( webpackStream( webpackConfig.ieConf ) )
    .on( 'error', handleErrors )
    .pipe( gulp.dest( paths.processed + '/js/ie/' ) )
    .pipe( browserSync.reload( {
      stream: true
    } ) );
}

/**
 * Bundle atomic component scripts.
 * Provides a means to bundle JS for specific atomic components,
 * which then can be carried over to other projects.
 * @returns {PassThrough} A source stream.
 */
function scriptsOnDemand() {
  return gulp.src( paths.unprocessed + '/js/routes/on-demand/*.js' )
    .pipe( webpackStream( webpackConfig.onDemandConf ) )
    .on( 'error', handleErrors )
    .pipe( gulp.dest( paths.processed + '/js/atomic/' ) )
    .pipe( browserSync.reload( {
      stream: true
    } ) );
}

/**
 * Bundle Es5 shim scripts.
 * @returns {PassThrough} A source stream.
 */
function scriptsEs5Shim() {
  return gulp.src( paths.unprocessed + '/js/shims/es5-shim.js' )
    .pipe( webpackStream( {
      entry: paths.unprocessed + '/js/shims/es5-shim.js',
      output: {
        filename: 'es5-shim.js'
      }
    } ) )
    .pipe( gulpUglify() )
    .on( 'error', handleErrors )
    .pipe( gulp.dest( paths.processed + '/js/' ) )
    .pipe( browserSync.reload( {
      stream: true
    } ) );
}


gulp.task( 'scripts:polyfill', scriptsPolyfill );
gulp.task( 'scripts:modern', scriptsModern );
gulp.task( 'scripts:ie', scriptsIE );
gulp.task( 'scripts:ondemand', scriptsOnDemand );
gulp.task( 'scripts:es5-shim', scriptsEs5Shim );

gulp.task( 'scripts', [
  'scripts:polyfill',
  'scripts:modern',
  'scripts:ie',
  'scripts:es5-shim'
] );

const { series, watch, src, dest } = require('gulp');
const pump = require('pump');

// gulp plugins and utils
var livereload = require('gulp-livereload');
var sass = require('gulp-sass');
var zip = require('gulp-zip');
var beeper = require('beeper');

function serve(done) {
    livereload.listen();
    done();
}

const handleError = (done) => {
    return function (err) {
        if (err) {
            beeper();
        }
        return done(err);
    };
};

sass.compiler = require('node-sass');

function css(done) {
    pump([
        src('./assets/main/sass/*.scss', { sourcemaps: true }),
        sass({ outputStyle: 'compressed' }).on('error', sass.logError),
        dest('assets/main/css', { sourcemaps: './' }),
        livereload()
    ], handleError(done));
}

function zipper(done) {
    var targetDir = 'dist/';
    var themeName = require('./package.json').name;
    var filename = themeName + '.zip';

    pump([
        src([
            '**',
            '!node_modules', '!node_modules/**',
            '!dist', '!dist/**'
        ]),
        zip(filename),
        dest(targetDir)
    ], handleError(done));
}

const watcher = () => watch('./assets/main/sass/**/**', css);
const build = series(css);
const dev = series(build, serve, watcher);

exports.build = build;
exports.zip = series(build, zipper);
exports.default = dev;

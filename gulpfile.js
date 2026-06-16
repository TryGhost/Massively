const {series, watch, src, dest, parallel} = require('gulp');
const pump = require('pump');

// gulp plugins and utils
const livereload = require('gulp-livereload');
const sass = require('gulp-sass')(require('sass'));
const zip = require('gulp-zip').default;
const beeper = require('beeper');

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

function hbs(done) {
    pump([
        src(['*.hbs', 'partials/**/*.hbs', '!node_modules/**/*.hbs']),
        livereload()
    ], handleError(done));
}

function css(done) {
    pump([
        src('./assets/main/sass/*.scss', {sourcemaps: true}),
        sass({style: 'compressed'}).on('error', sass.logError),
        dest('assets/main/css', {sourcemaps: './'}),
        livereload()
    ], handleError(done));
}

function zipper(done) {
    const targetDir = 'dist/';
    const themeName = require('./package.json').name;
    const filename = themeName + '.zip';

    pump([
        // encoding: false keeps binary assets (fonts, images) as buffers; gulp 5 /
        // vinyl-fs 4 otherwise decode files as UTF-8 and corrupt them in the zip.
        src([
            '**',
            '!node_modules', '!node_modules/**',
            '!dist', '!dist/**',
            '!pnpm-lock.yaml',
            '!pnpm-workspace.yaml',
            '!AGENTS.md',
            '!CLAUDE.md',
        ], {encoding: false}),
        zip(filename),
        dest(targetDir)
    ], handleError(done));
}

const cssWatcher = () => watch('./assets/main/sass/**/**', css);
const hbsWatcher = () => watch(['*.hbs', 'partials/**/*.hbs', '!node_modules/**/*.hbs'], hbs);
const watcher = parallel(cssWatcher, hbsWatcher);
const build = series(css);
const dev = series(build, serve, watcher);

exports.build = build;
exports.zip = series(build, zipper);
exports.default = dev;

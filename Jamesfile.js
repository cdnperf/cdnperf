var james = require('james');
var cssmin = require('james-cssmin');
var uglify = require('james-uglify');
var compile = require('james-compile');
var jade = require('jade');

var config = require('./config');


var inputRoot = 'dev/';
var outputRoot = 'public/';

james.task('default', ['watch']);
james.task('build', build);
james.task('watch', watch);
james.task('minify_css', minifyCSS);
james.task('minify_js', minifyJS);
james.task('jadeify', compileJade);

function build() {
    minifyCSS();
    minifyJS();
    compileJade();
}

function watch() {
    james.watch(inputRoot + '**/*.css', minifyCSS);
    james.watch(inputRoot + '**/*.js', copyJS);
    compileJade();
}

function minifyCSS() {
    var cssTarget = james.dest(outputRoot + 'css/all.css');

    ['normalize', 'foundation'].forEach(function(v) {
        james.read(inputRoot + 'css/vendor/' + v  + '.css').write(cssTarget);
    });

    james.list(inputRoot + 'css/*.css').forEach(process);

    // TODO: figure out why the output doesn't work
    //james.read(cssTarget).transform(cssmin).write(cssTarget);

    function process(file) {
        james.read(file).write(cssTarget);
    }
}

function copyJS() {
    james.list(inputRoot + 'js/**/*.js').forEach(function(file) {
        james.read(file).write(file.replace(inputRoot, outputRoot));
    });
}

function minifyJS() {
    james.list(inputRoot + 'js/**/*.js').forEach(function(file) {
        james.read(file).transform(uglify).write(file.replace(inputRoot, outputRoot));
    });
}

function compileJade() {
    james.list('views/**/*.jade').forEach(function(file) {
        james.read(file).transform(compile({
            compiler: jade,
            filename: file,
            context: {
                bugira: config.bugira,
                ga: config.ga
            }
        })).
        write(file.replace('views', 'public').replace('jade', 'html'));
    });
}

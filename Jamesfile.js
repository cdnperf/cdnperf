var james = require('james');
var cssmin = require('james-cssmin');
var uglify = require('james-uglify');


var inputRoot = 'dev/';
var outputRoot = 'public/';

james.task('default', ['watch']);
james.task('devbuild', devbuild);
james.task('build', build);
james.task('watch', watch);
james.task('minify_css', minifyCSS);
james.task('minify_js', minifyJS);

function devbuild() {
    james.watch(inputRoot + '**/*.css', minifyCSS);
    james.watch(inputRoot + '**/*.js', concatJS);
}

function build() {
    minifyCSS();
    minifyJS();
}

function watch() {
    james.watch(inputRoot + '**/*.css', minifyCSS);
    james.watch(inputRoot + '**/*.js', minifyJS);
}

function minifyCSS() {
    var cssTarget = james.dest(outputRoot + 'css/all.css');

    ['normalize', 'foundation', 'jquery.qtip'].forEach(function(v) {
        james.read(inputRoot + 'css/vendor/' + v  + '.css').write(cssTarget);
    });

    james.list(inputRoot + 'css/*.css').forEach(process);

    // TODO: figure out why the output doesn't work
    //james.read(cssTarget).transform(cssmin).write(cssTarget);

    function process(file) {
        james.read(file).write(cssTarget);
    }
}

// TODO: merge with minify somehow
function concatJS() {
    var jsTarget = james.dest(outputRoot + 'js/main.js');

    james.list(inputRoot + 'js/**/*.js').forEach(function(file) {
        james.read(file).write(jsTarget);
    });
}

function minifyJS() {
    var jsTarget = james.dest(outputRoot + 'js/main.js');

    james.list(inputRoot + 'js/**/*.js').forEach(function(file) {
        james.read(file).transform(uglify).write(jsTarget);
    });
}

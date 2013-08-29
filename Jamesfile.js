var james = require('james');
var uglify = require('james-uglify');
var compile = require('james-compile');
var jade = require('jade');
var marked = require('marked');
var hl = require('highlight.js').highlightAuto;

var config = require('./config');


marked.setOptions({
    highlight: function(code, lang) {
        return hl(code).value;
    }
});
jade.filters.markdown = marked;

var inputRoot = 'dev/';
var outputRoot = 'public/';

james.task('default', ['watch']);
james.task('build', build);
james.task('watch', watch);
james.task('minify_css', minifyCSS);
james.task('minify_js', minifyJS);
james.task('jadeify', compileJade);

function watch() {
    build();
    james.watch(inputRoot + '**/*.css', minifyCSS);
    james.watch(inputRoot + '**/*.js', copyJS);
    james.watch('resources/**/*.md', compileJade);
    james.watch('**/*.jade', compileJade);
}

function build() {
    minifyCSS();
    minifyJS();
    compileJade();
}

function minifyCSS() {
    var cssTarget = james.dest(outputRoot + 'css/all.css');

    james.list(inputRoot + 'css/vendor/normalize.css',
        inputRoot + 'css/vendor/foundation.css',
        inputRoot + 'css/*.css').forEach(process);

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
            context: config
        })).
        write(file.replace('views', 'public').replace('jade', 'html'));
    });
}

#!/usr/bin/env node
var http = require('http');
var path = require('path');

var express = require('express');

var cronjobs = require('./cronjobs');
var routes = require('./routes');
var config = require('./config');


main();

function main() {
    var app = express();

    app.configure(function() {
        app.set('port', config.port);

        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');

        app.use(express.favicon());
        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(express['static'](path.join(__dirname, 'public')));

        app.use(express.cookieParser(config.cookieSecret));
        app.use(express.session());

        app.use(app.router);
    });

    app.configure('development', function() {
        app.use(express.errorHandler());
    });

    app.get('/', routes.index);

    cronjobs();

    http.createServer(app).listen(config.port, function() {
        console.log('Server running at ' + config.port);
    });
}

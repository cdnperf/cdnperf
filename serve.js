#!/usr/bin/env node
var http = require('http');
var path = require('path');

var express = require('express');

var cronjobs = require('./cronjobs');
var routes = require('./routes');
var config = require('./config');
var api = require('./api');


main();

function main() {
    var app = express();

    var apiPrefix = 'v1';
    var halfDay = 43200000;

    app.configure(function() {
        app.set('port', config.port);

        app.use(express.favicon('public/images/favicon.ico'));
        app.use(express.logger('dev'));
        app.use(express.compress());
        app.use(express['static'](path.join(__dirname, 'public'), {
            maxAge: halfDay
        }));

        app.use(app.router);
    });

    app.configure('development', function() {
        app.use(express.errorHandler());
    });

    app.get('/', routes('index'));
    app.get('/about', routes('about'));
    app.get('/resources', routes('resources'));
    app.get('/resources/how-cdns-work', routes('howCdnsWork'));
    app.get('/resources/how-to-use-cdns', routes('howToUseCdns'));
    app.get('/api', routes('api'));

    app.get('/api/' + apiPrefix + '/cdns', api.cdns.getNames);
    app.get('/api/' + apiPrefix + '/cdns/:name', api.cdns.get);

    if(config.cron) cronjobs(api.cdns.updateData);
    else api.cdns.updateData(null, require('./public/data'));

    process.on('exit', terminator);

    ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS',
    'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGPIPE', 'SIGTERM'
    ].forEach(function(element, index, array) {
        process.on(element, function() { terminator(element); });
    });

    var port = config.port;
    app.listen(port, function() {
        console.log('%s: Node (version: %s) %s started on %d ...', Date(Date.now() ), process.version, process.argv[1], port);
    });
}

function terminator(sig) {
    if(typeof sig === "string") {
        console.log('%s: Received %s - terminating Node server ...',
            Date(Date.now()), sig);

        process.exit(1);
    }

    console.log('%s: Node server stopped.', Date(Date.now()) );
}

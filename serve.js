#!/bin/env node
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

    // openshift tweaks
    var ipaddr = process.env.OPENSHIFT_INTERNAL_IP;
    var port = process.env.OPENSHIFT_INTERNAL_PORT || config.port;

    process.on('exit', terminator);

    ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS',
    'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGPIPE', 'SIGTERM'
    ].forEach(function(element, index, array) {
        process.on(element, function() { terminator(element); });
    });

    app.listen(port, ipaddr, function() {
        console.log('%s: Node (version: %s) %s started on %s:%d ...', Date(Date.now() ), process.version, process.argv[1], ipaddr, port);
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

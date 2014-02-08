#!/usr/bin/env node
var path = require('path');

var express = require('express');

var config = require('./config');


main();

function main() {
    var port = config.port;

    var app = express();

    app.configure(function() {
        var halfDay = 43200000;

        app.set('port', port);

        app.use(express.favicon(path.join(__dirname, 'public/images/favicon.ico')));
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

    app.listen(port, function() {
        console.log('%s: Node (version: %s) %s started on %d ...', Date(Date.now() ), process.version, process.argv[1], port);

        init(app);
    });

    process.on('exit', terminator);

    ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS',
    'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGPIPE', 'SIGTERM'
    ].forEach(function(element) {
        process.on(element, function() { terminator(element); });
    });
}

function init(app) {
    var apiPrefix = 'v1';

    var api = require('./api');
    var routes = require('./routes');

    app.get('/', routes('index'));
    app.get('/about', routes('about'));
    app.get('/resources', routes('resources'));
    app.get('/resources/how-cdns-work', routes('howCdnsWork'));
    app.get('/resources/how-to-use-cdns', routes('howToUseCdns'));
    app.get('/api', routes('api'));

    app.get('/api/' + apiPrefix + '/cdns', api.cdns.getNames);
    app.get('/api/' + apiPrefix + '/cdns/:name', api.cdns.get);

    require('taskist')(config.tasks, require('./tasks'), {
        instant: function(err) {
            if(err) {
                console.trace();

                return console.error(err);
            }

            console.log('Tasks initialized!');

            api.cdns.updateData(require('./public/data'));
        }
    });

}

function terminator(sig) {
    if(typeof sig === 'string') {
        console.log('%s: Received %s - terminating Node server ...',
            Date(Date.now()), sig);

        process.exit(1);
    }

    console.log('%s: Node server stopped.', Date(Date.now()) );
}

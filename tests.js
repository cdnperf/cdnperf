#!/usr/bin/env node
var pingdom = require('./pingdom');
var config = require('./config');


main();

function main() {
    var api = pingdom(config.pingdom);

    api.checks(function(err, checks) {
        if(err) return console.error(err);

        api.results(checks[0].id, 5, function(err, results) {
            if(err) return console.error(err);

            console.log(results);
        });
    });
}

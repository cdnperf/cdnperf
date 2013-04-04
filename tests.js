#!/usr/bin/env node
var pingdom = require('./pingdom');
var config = require('./config');


main();

function main() {
    var api = pingdom(config.pingdom);

    api.checks(function(err, checks) {
        if(err) return console.error(err);

        api.results(function(err, results) {
            if(err) return console.error(err);

            console.log(results);
        }, {
            target: checks[0].id,
            qs: {
                limit: 5
            }
        });
    });
}

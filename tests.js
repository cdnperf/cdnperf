#!/usr/bin/env node
var pingdom = require('./pingdom');
var config = require('./config');


main();

function main() {
    pingdom.checks(config.pingdom, function(err, checks) {
        if(err) return console.error(err);

        console.log(checks);
    });
}

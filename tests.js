#!/usr/bin/env node
var pingdom = require('./pingdom');
var config = require('./config');


main();

function main() {
    pingdom.getChecks(config.pingdom, function(err, res) {
        if(err) return console.error(err);

        console.log(res.body);
    });
}

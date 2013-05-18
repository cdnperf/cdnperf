#!/usr/bin/env node
var config = require('./config');
var data = require('./data');


main();

function main() {
    data.checks(config.pingdom, {
        limit: 5
    }, function(err, results) {
        if(err) return console.error(err);

        console.log(results, results[0].data);
    });
}

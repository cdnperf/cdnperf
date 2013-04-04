#!/usr/bin/env node
var request = require('request');

var config = require('./config');


main();

function main() {
    var url = 'https://api.pingdom.com/api/2.0/checks';

    request.get(url, {
        auth: config.pingdom,
        headers: {
            'App-Key': config.pingdom.appkey
        }
    }, function(err, res) {
        if(err) return console.error(err);

        console.log(res.body);
    });
}

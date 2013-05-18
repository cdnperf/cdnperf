#!/usr/bin/env node
var data = require('./data')(require('./config').pingdom);


main();

function main() {
    latency(4);
    uptime(4);
}

function latency(range) {
    data.latency({
        range: range,
        date: new Date()
    }, logResults('latency'));
}

function uptime(range) {
    data.uptime({
        range: range,
        date: new Date()
    }, logResults('uptime'));
}

function logResults(prefix) {
    return function(err, results) {
        if(err) return console.error(err);

        console.log(prefix, results);
    };
}

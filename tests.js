#!/usr/bin/env node
var config = require('./config');
var data = require('./data');


main();

function main() {
    // these are supposed to return an average per day
    dayAverageLatency();
    dayUptime();
    weekAverageLatency();
    weekUptime();
    monthAverageLatency();
    monthUptime();

    // kernel
    checks();
}

function dayAverageLatency() {
    data.dayAverageLatency(config.pingdom, {
        date: new Date()
    }, function(err, results) {
        if(err) return console.error(err);

        console.log('day averages', results);
    });
}

function dayUptime() {
    data.dayUptime(config.pingdom, {
        date: new Date()
    }, function(err, results) {
        if(err) return console.error(err);

        console.log('day uptime', results);
    });
}

function weekAverageLatency() {
    data.weekAverageLatency();
}

function weekUptime() {
    data.weekUptime();
}

function monthAverageLatency() {
    data.monthAverageLatency();
}

function monthUptime() {
    data.monthUptime();
}

function checks() {
    data.checks(config.pingdom, {
        limit: 5
    }, function(err, results) {
        if(err) return console.error(err);

        console.log(results, results[0].data);
    });
}

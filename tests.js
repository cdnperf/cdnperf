#!/usr/bin/env node
var data = require('./data')(require('./config').pingdom);


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
    data.dayAverageLatency({
        date: new Date()
    }, logResults('day averages'));
}

function dayUptime() {
    data.dayUptime({
        date: new Date()
    }, logResults('day uptime'));
}

function weekAverageLatency() {
    data.weekAverageLatency({
        date: new Date()
    }, logResults('week averages'));
}

function weekUptime() {
    data.weekUptime({
        date: new Date()
    }, logResults('week uptime'));
}

function monthAverageLatency() {
    data.monthAverageLatency({
        date: new Date()
    }, logResults('month averages'));
}

function monthUptime() {
    data.monthUptime({
        date: new Date()
    }, logResults('month uptime'));
}

function logResults(prefix) {
    return function(err, results) {
        if(err) return console.error(err);

        console.log(prefix, results);
    };
}

function checks() {
    data.checks({
        limit: 5
    }, function(err, results) {
        if(err) return console.error(err);

        console.log(results, results[0].data);
    });
}

#!/usr/bin/env node
var data = require('./data')(require('./config').pingdom);


main();

function main() {
    // these are supposed to return an average per day
    monthLatency();
    monthUptime();
    weekLatency();
    weekUptime();
    dayLatency();
    dayUptime();

    // kernel
    checks();
}

function monthLatency() {
    data.monthLatency({
        date: new Date()
    }, logResults('month averages'));
}

function monthUptime() {
    data.monthUptime({
        date: new Date()
    }, logResults('month uptime'));
}

function weekLatency() {
    data.weekLatency({
        date: new Date()
    }, logResults('week averages'));
}

function weekUptime() {
    data.weekUptime({
        date: new Date()
    }, logResults('week uptime'));
}

function dayLatency() {
    data.dayLatency({
        date: new Date()
    }, logResults('day averages'));
}

function dayUptime() {
    data.dayUptime({
        date: new Date()
    }, logResults('day uptime'));
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

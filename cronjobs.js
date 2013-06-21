var fs = require('fs');

require('date-utils');

var config = require('./config');

var async = require('async');
var cronJob = require('cron').CronJob;
var pingdom = require('pingdom-api')(config.pingdom);


function init(cb) {
    writeJSON(cb);

    new cronJob(config.cron, writeJSON.bind(undefined, cb), null, true);
}
module.exports = init;

function writeJSON(cb) {
    cb = cb || function() {};

    pingdom.checks(function(err, checks) {
        if(err) return cb(err);

        async.parallel(constructChecks(checks), function(err, data) {
            if(err) return cb(err);

            write(JSON.stringify(structure(data)), './public/data.json');

            cb(null, data);
        });
    });
}

function constructChecks(checks) {
    return checks.map(function(check) {
        return function(cb) {
            var to = Date.today();
            var from = to.clone().addMonths(-6);

            async.series([
                getSummaries.bind(undefined, check, from, to),
                getDowntimes.bind(undefined, check, from, to)
            ], function(err, data) {
                if(err) return console.error(err);

                cb(err, {
                    summaries: data[0],
                    downtimes: data[1]
                });
            });
        };
    });
}

function getSummaries(check, from, to, cb) {
    // downtime info is in seconds, not accurate enough...
    pingdom['summary.performance'](function(err, data) {
        cb(err, {
            check: check,
            data: data
        }); // skip res
    }, {
        target: check.id,
        qs: {
            from: from,
            to: to,
            resolution: 'day'
        }
    });
}

function getDowntimes(check, from, to, cb) {
    pingdom['summary.outage'](function(err, outages, res) {
        // skip res
        cb(err, outages && outages.states? calculateDowntimes(outages.states, from, to): []);
    }, {
        target: check.id,
        qs: {
            from: from,
            to: to
        }
    });
}

function calculateDowntimes(data, from, to) {
    var ret = zeroes(from.getDaysBetween(to));
    var downFrom, downTo, fromDelta, toDelta, next;

    // calculate downtimes per day and sum them up as ms
    data.filter(equals('status', 'down')).forEach(function(v) {
        downFrom = new Date(v.timefrom * 1000);
        downTo = new Date(v.timeto * 1000);
        fromDelta = from.getDaysBetween(downFrom);
        toDelta = from.getDaysBetween(downTo);

        if(fromDelta == toDelta) {
            ret[fromDelta] += downTo - downFrom;
        }
        else {
            next = downTo.clone().clearTime();

            ret[fromDelta] += next - downFrom;
            ret[toDelta] += downTo - next;
        }
    });

    return ret;
}

// TODO: move to some utility lib
function zeroes(a) {
    var ret = [];
    var i;

    for(i = 0; i < a; i++) ret.push(0);

    return ret;
}

// TODO: move to some utility lib
function equals(a, b) {
    return function(v) {
        return v[a] == b;
    };
}

// TODO: move to some utility lib
function prop(a) {
    return function(v) {
        return v[a];
    };
}

function structure(data) {
    var days = data[0].summaries.data.days;

    return {
        providers: data.map(function(d) {
            var summaries = d.summaries;
            var check = summaries.check;

            return {
                name: check.name,
                host: check.hostname,
                type: check.name.split(' ')[1].toLowerCase(),
                latency: parseLatency(summaries.data.days),
                downtime: d.downtimes
            };
        }),
        firstDate: days[0].starttime,
        lastDate: days[days.length - 1].starttime
    };

    function parseLatency(data) {
        return data.map(function(v) {
            return v.avgresponse;
        });
    }
}

function write(data, target) {
    fs.writeFile(target, data, function(err) {
        if(err) return console.error(err);

        console.log('Wrote ' + target);
    });
}

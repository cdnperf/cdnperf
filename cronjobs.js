var fs = require('fs');

require('date-utils');

var config = require('./config');

var is = require('annois');
var async = require('async');
var cronJob = require('cron').CronJob;
var pingdom = require('pingdom-api')(config.pingdom);


function init() {
    writeJSON();

    new cronJob('*/ 0 0 0 * * *', writeJSON, null, true);
}
module.exports = init;

function writeJSON() {
    pingdom.checks(function(err, checks) {
        if(err) return console.error(err);

        async.parallel(constructChecks(checks), function(err, data) {
            if(err) return console.error(err);

            write(JSON.stringify(structure(data)), './public/data.json');
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
                getUptimes.bind(undefined, check, from, to)
            ], function(err, data) {
                if(err) return console.error(err);

                cb(err, {
                    summaries: data[0],
                    uptimes: data[1]
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

function getUptimes(check, from, to, cb) {
    pingdom['summary.outage'](function(err, outages, res) {
        // skip res
        cb(err, outages && outages.states? calculateUptimes(outages.states, from, to): []);
    }, {
        target: check.id,
        qs: {
            from: from,
            to: to
        }
    });
}

function calculateUptimes(data, from, to) {
    var ret = zeroes(from.getDaysBetween(to));
    var wholeDayInMs = 1000 * 60 * 60 * 24;
    var downFrom, downTo, fromDelta, toDelta, next;

    // calculate downtimes per day
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

    // calculate relative uptime per day
    return ret.map(function(v) {
        var res = parseFloat(((1 - (v / wholeDayInMs)) * 100).toFixed(3));

        return is.defined(res)? res: 1;
    });
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
                uptime: d.uptimes
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
